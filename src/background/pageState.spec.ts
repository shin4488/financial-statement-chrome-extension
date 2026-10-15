import type { FinancialStatementResult } from './financialStatement/result';

const mocks = vi.hoisted(() => {
  // storage.session はブラウザを閉じるまで残るため、service worker を起動し直しても同じ内容を返す
  const session = new Map<string, unknown>();
  const load = vi.fn();
  return {
    session,
    load,
    browser: {
      tabs: {
        query: vi.fn(),
        onActivated: { addListener: vi.fn() },
        onUpdated: { addListener: vi.fn() },
      },
      windows: { onFocusChanged: { addListener: vi.fn() } },
      action: { enable: vi.fn(), disable: vi.fn() },
      storage: {
        session: {
          get: vi.fn(async (key: string) =>
            session.has(key) ? { [key]: structuredClone(session.get(key)) } : {},
          ),
          set: vi.fn(async (items: Record<string, unknown>) => {
            Object.entries(items).forEach(([key, value]) =>
              session.set(key, structuredClone(value)),
            );
          }),
        },
      },
    },
    // new で呼ばれるため、アロー関数ではなく function で実装する
    Service: vi.fn(function () {
      return { load };
    }),
  };
});
vi.mock('webextension-polyfill', () => ({ default: mocks.browser }));
vi.mock('./financialStatement/service', () => ({ default: mocks.Service }));
vi.mock('@/store/bridge', () => ({ exposeStore: vi.fn() }));

const { browser, load } = mocks;
const report = { id: 'report-7203', companyName: 'トヨタ自動車' } as FinancialStatementResult;
const flush = () => new Promise((resolve) => setTimeout(resolve));
const openTab = (url: string) => browser.tabs.query.mockResolvedValue([{ url }]);
// 取得のたびに、テストから結果を返せる Promise を作る
const pendingLoads = () => {
  const loads: { resolve: (results: FinancialStatementResult[]) => void; reject: () => void }[] =
    [];
  load.mockImplementation(
    () =>
      new Promise((resolve, reject) => {
        loads.push({ resolve, reject: () => reject(new Error('offline')) });
      }),
  );
  return loads;
};

// service worker の起動を模す: モジュールを読み込み直し、初期状態の store で background を始める
const startServiceWorker = async () => {
  vi.resetModules();
  const { default: store } = await import('@/store/store');
  await import('./index');
  await flush();
  return {
    store,
    refresh: async () => {
      browser.tabs.onUpdated.addListener.mock.lastCall?.[0]();
      await flush();
    },
  };
};

beforeEach(() => {
  // 各テストで差し替えた応答を、vi.fn に渡した実装へ戻す
  vi.resetAllMocks();
  mocks.session.clear();
});

it('ignores stale responses after changing companies, and distinguishes error and empty', async () => {
  const loads = pendingLoads();
  openTab('https://kabutan.jp/stock/?code=7203');
  const { store, refresh } = await startServiceWorker();
  expect(store.getState().financialStatement.status).toBe('loading');
  await refresh(); // 同じページの更新で二重に取得しない
  expect(load).toHaveBeenCalledTimes(1);
  openTab('https://kabutan.jp/stock/?code=6758');
  await refresh();
  loads[0].resolve([]);
  await flush();
  expect(store.getState().financialStatement.status).toBe('loading');
  loads[1].reject();
  await flush();
  expect(store.getState().financialStatement.status).toBe('error');
  await refresh();
  loads[2].resolve([]);
  await flush();
  expect(store.getState().financialStatement.status).toBe('empty');
  openTab('https://example.com/');
  await refresh();
  expect(store.getState().sitePage.stockCode).toBe('');
  expect(store.getState().financialStatement.status).toBe('idle');
  expect(browser.action.disable).toHaveBeenCalled();
});

it('keeps the results after the service worker restarts and does not load the same page again', async () => {
  load.mockResolvedValue([report]);
  openTab('https://kabutan.jp/stock/?code=7203');
  const first = await startServiceWorker();
  expect(first.store.getState().financialStatement.status).toBe('success');

  const restarted = await startServiceWorker();
  expect(restarted.store.getState()).toEqual(first.store.getState());
  await restarted.refresh();
  expect(load).toHaveBeenCalledTimes(1);
});

it('loads again when the service worker stopped before the results arrived', async () => {
  pendingLoads();
  openTab('https://kabutan.jp/stock/?code=7203');
  const first = await startServiceWorker();
  expect(first.store.getState().financialStatement.status).toBe('loading');

  load.mockResolvedValue([report]);
  const restarted = await startServiceWorker();
  expect(load).toHaveBeenCalledTimes(2);
  expect(restarted.store.getState().financialStatement).toEqual({
    status: 'success',
    results: [report],
  });
});

it('still follows the active page when the state cannot be read or saved', async () => {
  browser.storage.session.get.mockRejectedValue(new Error('unavailable'));
  browser.storage.session.set.mockImplementation(() => {
    throw new Error('unavailable');
  });
  load.mockResolvedValue([]);
  openTab('https://kabutan.jp/stock/?code=6758');
  const { store } = await startServiceWorker();
  expect(store.getState().sitePage).toEqual({ siteDomain: 'kabutan.jp', stockCode: '6758' });
  expect(store.getState().financialStatement.status).toBe('empty');
});
