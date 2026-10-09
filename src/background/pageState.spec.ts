import type { Mock } from 'vitest';
import browser from 'webextension-polyfill';
import store from '@/store/store';
import FinancialStatementService from './financialStatement/service';

vi.mock('webextension-polyfill', () => ({
  default: {
    tabs: {
      query: vi.fn(),
      onActivated: { addListener: vi.fn() },
      onUpdated: { addListener: vi.fn() },
    },
    windows: { onFocusChanged: { addListener: vi.fn() } },
    action: { enable: vi.fn(), disable: vi.fn() },
  },
}));
vi.mock('./financialStatement/service', () => ({ default: vi.fn() }));
vi.mock('@/store/store', async () => {
  const { configureStore } = await vi.importActual<typeof import('@reduxjs/toolkit')>(
    '@reduxjs/toolkit',
  );
  const financialStatement = await vi.importActual<
    typeof import('@/store/slices/financialStatement')
  >('@/store/slices/financialStatement');
  const sitePage = await vi.importActual<typeof import('@/store/slices/sitePageSlice')>(
    '@/store/slices/sitePageSlice',
  );
  return {
    initializeWrappedStore: vi.fn(),
    default: configureStore({
      reducer: { financialStatement: financialStatement.default, sitePage: sitePage.default },
    }),
  };
});

it('ignores stale responses after changing companies, and distinguishes error and empty', async () => {
  const resolves: ((result: []) => void)[] = [];
  const rejects: ((reason: Error) => void)[] = [];
  const load = vi.fn(
    () =>
      new Promise((resolve, reject) => {
        resolves.push(resolve);
        rejects.push(reject);
      }),
  );
  // new で呼ばれるため、アロー関数ではなく function で実装する
  (FinancialStatementService as Mock).mockImplementation(function () {
    return { load };
  });
  (browser.tabs.query as Mock).mockResolvedValue([{ url: 'https://kabutan.jp/stock/?code=7203' }]);
  await import('./index');
  await Promise.resolve();
  expect(store.getState().financialStatement.status).toBe('loading');
  const refresh = (browser.tabs.onUpdated.addListener as Mock).mock.calls[0][0];
  await refresh(); // 同じページの更新で二重に取得しない
  expect(load).toHaveBeenCalledTimes(1);
  (browser.tabs.query as Mock).mockResolvedValue([{ url: 'https://kabutan.jp/stock/?code=6758' }]);
  const pending = refresh();
  await Promise.resolve();
  resolves[0]([]);
  await Promise.resolve();
  expect(store.getState().financialStatement.status).toBe('loading');
  rejects[1](new Error('offline'));
  await pending;
  expect(store.getState().financialStatement.status).toBe('error');
  const retry = refresh();
  await Promise.resolve();
  resolves[2]([]);
  await retry;
  expect(store.getState().financialStatement.status).toBe('empty');
  (browser.tabs.query as Mock).mockResolvedValue([{ url: 'https://example.com/' }]);
  await refresh();
  expect(store.getState().sitePage.stockCode).toBe('');
  expect(store.getState().financialStatement.status).toBe('idle');
  expect(browser.action.disable).toHaveBeenCalled();
});
