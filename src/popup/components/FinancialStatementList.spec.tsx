import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import FinancialStatementList from './FinancialStatementList';
import financialStatement, { setResult } from '@/store/slices/financialStatement';
import autoPlayStatus, { changeAutoPlayStatus } from '@/store/slices/autoPlayStatusSlice';
import sitePage from '@/store/slices/sitePageSlice';
import type { FinancialStatementResult } from '@/background/financialStatement/result';

// jsdomではアニメーションを描画できないため、motionの表示切替だけを同期化する。
// カルーセル本体・前後移動・自動切替・Redux・指標コンポーネントは実装を使う。
jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, animate }: { children: React.ReactNode; animate?: string }) => (
      <div style={{ display: animate && animate !== 'center' ? 'none' : undefined }}>
        {children}
      </div>
    ),
  },
}));

const metric = { value: 0.1, status: 'AVAILABLE' as const };
const report: FinancialStatementResult = {
  id: 'report-1',
  companyName: '検証株式会社',
  stockCode: '192A',
  fiscalYearStartDate: '2025-06-01',
  fiscalYearEndDate: '2026-05-31',
  consolidationType: 'non_consolidated',
  accountingStandard: 'jgaap',
  balanceSheet: { renderable: false, note: 'BS表示', bars: [] },
  profitLoss: { renderable: false, note: 'PL表示', bars: [] },
  cashFlow: { renderable: false, note: 'CF表示', steps: [] },
  financialIndicators: {
    roe: { ...metric, source: 'CALCULATED' },
    roa: { ...metric, value: 0.04 },
    netProfitMargin: metric,
    assetTurnover: { ...metric, value: 0.4 },
    financialLeverage: { ...metric, value: 2.5 },
  },
};

function setup(reports = [report], autoPlay = false) {
  const store = configureStore({ reducer: { financialStatement, autoPlayStatus, sitePage } });
  store.dispatch(setResult(reports));
  store.dispatch(changeAutoPlayStatus(autoPlay));
  render(
    <Provider store={store}>
      <FinancialStatementList />
    </Provider>,
  );
  return store;
}

function settle() {
  act(() => {
    jest.advanceTimersByTime(200);
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  // jsdomはレイアウトを計測しないため、実ポップアップのチャート高を与える。
  jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(400);
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it('BS → PL → CF → ROE・ROAの順に切り替わり、前後へ循環する', () => {
  setup();
  expect(screen.getByText('BS表示')).toBeVisible();
  for (const note of ['PL表示', 'CF表示']) {
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    settle();
    expect(screen.getByText(note)).toBeVisible();
  }
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  settle();
  expect(screen.getByLabelText('ROE：10.0%')).toBeVisible();
  expect(screen.getByLabelText('ROA：4.0%')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  settle();
  expect(screen.getByText('BS表示')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
  settle();
  expect(screen.getByLabelText('ROE：10.0%')).toBeVisible();
});

it('自動切替で指標にも進み、OFFにすると停止する', () => {
  const store = setup([report], true);
  for (let i = 0; i < 3; i += 1) {
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    settle();
  }
  expect(screen.getByLabelText('ROE：10.0%')).toBeVisible();
  act(() => {
    store.dispatch(changeAutoPlayStatus(false));
  });
  act(() => {
    jest.advanceTimersByTime(10000);
  });
  expect(screen.getByLabelText('ROE：10.0%')).toBeVisible();
});

it('旧キャッシュの指標欠損でも開けて、再取得した企業公表ROEに更新される', () => {
  const { financialIndicators: omitted, ...legacy } = report;
  expect(omitted).toBeDefined();
  // 更新前に永続化されたJSONは新しい必須フィールドを持たない。
  const store = setup([legacy as FinancialStatementResult]);
  fireEvent.click(screen.getByRole('button', { name: 'carousel indicator 4' }));
  settle();
  expect(screen.getAllByText('データなし')).toHaveLength(7);
  act(() => {
    store.dispatch(
      setResult([
        {
          ...report,
          financialIndicators: {
            ...report.financialIndicators,
            roe: { value: 0.372, status: 'AVAILABLE', source: 'DISCLOSED' },
            roa: { value: null, status: 'MISSING_DATA' },
          },
        },
      ]),
    );
  });
  expect(screen.getByLabelText('ROE：37.2%')).toBeVisible();
  expect(screen.getByText('企業公表値')).toBeVisible();
  expect(within(screen.getByRole('group', { name: 'ROA' })).getByText('データなし')).toBeVisible();
});

it('年度ごとのカードに対応する値を表示し、空の取得結果でも落ちない', () => {
  const store = setup([
    report,
    {
      ...report,
      id: 'report-2',
      fiscalYearEndDate: '2025-05-31',
      financialIndicators: {
        ...report.financialIndicators,
        roe: { ...metric, value: -0.2, source: 'CALCULATED' },
      },
    },
  ]);
  for (const button of screen.getAllByRole('button', { name: 'carousel indicator 4' })) {
    fireEvent.click(button);
    settle();
  }
  expect(screen.getByLabelText('ROE：10.0%')).toBeVisible();
  expect(screen.getByLabelText('ROE：-20.0%')).toBeVisible();
  act(() => {
    store.dispatch(setResult([]));
  });
  expect(screen.getByText(/データがありません/)).toBeVisible();
  expect(screen.queryByRole('region', { name: 'ROE・ROA' })).toBeNull();
});
