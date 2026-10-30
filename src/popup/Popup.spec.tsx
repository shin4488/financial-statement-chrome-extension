import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Popup from './Popup';
import { trackEvent } from './analytics';
import financialStatement, { setResult, setStatus } from '@/store/slices/financialStatement';
import sitePage, { changeSiteDomain, changeStockCode } from '@/store/slices/sitePageSlice';
import type { FinancialStatementResult } from '@/background/financialStatement/result';

vi.mock('./analytics', () => ({ trackEvent: vi.fn() }));

const autoPlayStorageKey = 'investeeExtensionIsStatementAutoPlay';
const metric = { value: 0.1, status: 'AVAILABLE' as const };
// グラフの代わりに表示不可の文言を出すレポート。どのスライドを表示しているかを文言で確かめる
const report: FinancialStatementResult = {
  id: 'report-1',
  companyName: '検証株式会社',
  stockCode: '192A',
  fiscalYearStartDate: '2025-06-01',
  fiscalYearEndDate: '2026-05-31',
  consolidationType: 'consolidated',
  accountingStandard: 'jgaap',
  balanceSheet: { renderable: false, note: 'BS表示', bars: [] },
  profitLoss: { renderable: false, note: 'PL表示', bars: [] },
  cashFlow: { renderable: false, note: 'CF表示', steps: [] },
  freeCashFlowTrend: { renderable: false, note: 'フリーCF表示', points: [] },
  financialIndicators: {
    roe: { ...metric, source: 'CALCULATED' },
    roa: metric,
    netProfitMargin: metric,
    assetTurnover: metric,
    financialLeverage: metric,
  },
};
const createStore = (reports?: FinancialStatementResult[]) => {
  const store = configureStore({ reducer: { financialStatement, sitePage } });
  if (reports !== undefined) {
    store.dispatch(setResult(reports));
  }
  return store;
};
const autoPlayCheckbox = () => screen.getByRole('checkbox', { name: '自動切替' });
// 自動切替の間隔（5秒）より長く待ち、切替のアニメーションも終える
const waitLongerThanAutoPlayInterval = () => {
  act(() => {
    vi.advanceTimersByTime(6000);
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  localStorage.clear();
});
afterEach(() => {
  vi.useRealTimers();
});

it('uses the UI store and counts each settled result once even in StrictMode', () => {
  const store = createStore();
  store.dispatch(changeSiteDomain('kabutan.jp'));
  store.dispatch(changeStockCode('7203'));
  store.dispatch(setStatus('loading'));
  render(
    <React.StrictMode>
      <Provider store={store}>
        <Popup />
      </Provider>
    </React.StrictMode>,
  );
  expect(trackEvent).toHaveBeenCalledTimes(1);
  expect(trackEvent).toHaveBeenCalledWith('popup_open', { site_domain_name: 'kabutan.jp' });
  act(() => {
    store.dispatch(setResult([]));
  });
  expect(trackEvent).toHaveBeenCalledTimes(2);
  expect(trackEvent).toHaveBeenLastCalledWith('report_result', {
    site_domain_name: 'kabutan.jp',
    result_status: 'empty',
    result_count: 0,
    unavailable_count: 0,
  });
  act(() => {
    store.dispatch(setResult([]));
  });
  expect(trackEvent).toHaveBeenCalledTimes(2);
  act(() => {
    store.dispatch(setStatus('error'));
  });
  expect(trackEvent).toHaveBeenLastCalledWith(
    'report_result',
    expect.objectContaining({ result_status: 'error' }),
  );
});

it.each([
  { saved: null, isAutoPlay: true },
  { saved: 'true', isAutoPlay: true },
  { saved: 'false', isAutoPlay: false },
])(
  'draws autoplay from the saved preference $saved as soon as the popup renders, and the charts follow it',
  ({ saved, isAutoPlay }) => {
    if (saved !== null) {
      localStorage.setItem(autoPlayStorageKey, saved);
    }
    render(
      <Provider store={createStore([report])}>
        <Popup />
      </Provider>,
    );
    // 描画した直後（非同期に届く値を待たない時点）で、保存した設定を表示している
    expect(autoPlayCheckbox()).toHaveProperty('checked', isAutoPlay);
    waitLongerThanAutoPlayInterval();
    expect(screen.getByText(isAutoPlay ? 'PL表示' : 'BS表示')).toBeVisible();
  },
);

it('saves the autoplay change and passes it to the charts without the background', () => {
  const store = createStore([report]);
  // ポップアップの store への dispatch は background へ送られる
  const dispatch = vi.spyOn(store, 'dispatch');
  render(
    <Provider store={store}>
      <Popup />
    </Provider>,
  );
  fireEvent.click(autoPlayCheckbox());
  expect(localStorage.getItem(autoPlayStorageKey)).toBe('false');
  expect(autoPlayCheckbox()).toHaveProperty('checked', false);
  waitLongerThanAutoPlayInterval();
  expect(screen.getByText('BS表示')).toBeVisible();
  expect(dispatch).not.toHaveBeenCalled();
});
