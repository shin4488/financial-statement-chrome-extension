import browser from 'webextension-polyfill';
import store from '@/store/store';
import FinancialStatementService from './financialStatement/service';

jest.mock('webextension-polyfill', () => ({
  __esModule: true,
  default: {
    tabs: {
      query: jest.fn(),
      onActivated: { addListener: jest.fn() },
      onUpdated: { addListener: jest.fn() },
    },
    windows: { onFocusChanged: { addListener: jest.fn() } },
    action: { enable: jest.fn(), disable: jest.fn() },
  },
}));
jest.mock('./financialStatement/service', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@/store/store', () => {
  const { configureStore } = jest.requireActual('@reduxjs/toolkit');
  return {
    __esModule: true,
    initializeWrappedStore: jest.fn(),
    default: configureStore({
      reducer: {
        financialStatement: jest.requireActual('@/store/slices/financialStatement').default,
        sitePage: jest.requireActual('@/store/slices/sitePageSlice').default,
      },
    }),
  };
});

it('ignores stale responses after changing companies, and distinguishes error and empty', async () => {
  const resolves: ((result: []) => void)[] = [];
  const rejects: ((reason: Error) => void)[] = [];
  const load = jest.fn(
    () =>
      new Promise((resolve, reject) => {
        resolves.push(resolve);
        rejects.push(reject);
      }),
  );
  (FinancialStatementService as jest.Mock).mockImplementation(() => ({ load }));
  (browser.tabs.query as jest.Mock).mockResolvedValue([
    { url: 'https://kabutan.jp/stock/?code=7203' },
  ]);
  await import('./index');
  await Promise.resolve();
  expect(store.getState().financialStatement.status).toBe('loading');
  const refresh = (browser.tabs.onUpdated.addListener as jest.Mock).mock.calls[0][0];
  await refresh(); // 同じページの更新で二重に取得しない
  expect(load).toHaveBeenCalledTimes(1);
  (browser.tabs.query as jest.Mock).mockResolvedValue([
    { url: 'https://kabutan.jp/stock/?code=6758' },
  ]);
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
  (browser.tabs.query as jest.Mock).mockResolvedValue([{ url: 'https://example.com/' }]);
  await refresh();
  expect(store.getState().sitePage.stockCode).toBe('');
  expect(store.getState().financialStatement.status).toBe('idle');
  expect(browser.action.disable).toHaveBeenCalled();
});
