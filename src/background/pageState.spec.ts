import type { FinancialStatementResult } from './financialStatement/result';
import { setStatus } from '@/store/slices/financialStatement';

const mocks = vi.hoisted(() => {
  // storage.session はブラウザを閉じるまで残るため、service worker を起動し直しても同じ内容を返す
  const session = new Map<string, unknown>();
  // アイコンの有効・無効はブラウザが持ち、service worker を起動し直しても残る。キー undefined は既定値
  const action = new Map<number | undefined, boolean>();
  const load = vi.fn();
  return {
    session,
    action,
    load,
    browser: {
      tabs: {
        query: vi.fn(),
        onActivated: { addListener: vi.fn() },
        onUpdated: { addListener: vi.fn() },
      },
      windows: { WINDOW_ID_NONE: -1, onFocusChanged: { addListener: vi.fn() } },
      action: {
        enable: vi.fn(async (tabId?: number) => {
          action.set(tabId, true);
        }),
        disable: vi.fn(async (tabId?: number) => {
          action.set(tabId, false);
        }),
      },
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
type Tab = { id: number; active: boolean; url: string };
// フォーカス中のウィンドウで表示中のタブ、他のウィンドウで表示中のタブ、バックグラウンドのタブ
const activeTab: Tab = { id: 1, active: true, url: '' };
const otherWindowTab: Tab = { id: 2, active: true, url: '' };
const backgroundTab: Tab = { id: 3, active: false, url: '' };
const openTab = (url: string) => {
  activeTab.url = url;
};
// ポップアップを開いた直後など、どのウィンドウにもフォーカスがなく、表示中のタブを照会しても返らない状態
let noWindowFocused = false;
// マニフェストの既定は有効。タブごとの設定がなければ既定値で表示される
const iconEnabled = (tabId: number) =>
  mocks.action.get(tabId) ?? mocks.action.get(undefined) ?? true;
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
  // 更新通知を渡してから結果を待つ。続けて届いた通知は、間を空けずに渡す
  const updateTabOf = async (tab: Tab, ...changes: Record<string, string>[]) => {
    changes.forEach((changeInfo) =>
      browser.tabs.onUpdated.addListener.mock.lastCall?.[0](tab.id, changeInfo, { ...tab }),
    );
    await flush();
  };
  return {
    store,
    updateTab: (...changes: Record<string, string>[]) => updateTabOf(activeTab, ...changes),
    updateTabOf,
    activateTab: async () => {
      browser.tabs.onActivated.addListener.mock.lastCall?.[0]({ tabId: activeTab.id });
      await flush();
    },
    // ページを読み込むと、そのタブのアイコンの設定は消えてから読み込み開始が通知される
    navigateTab: async (tab: Tab, url: string) => {
      tab.url = url;
      mocks.action.delete(tab.id);
      await updateTabOf(tab, { status: 'loading', url });
    },
    focusWindow: async (windowId = 1) => {
      browser.windows.onFocusChanged.addListener.mock.lastCall?.[0](windowId);
      await flush();
    },
  };
};

beforeEach(() => {
  // 各テストで差し替えた応答を、vi.fn に渡した実装へ戻す
  vi.resetAllMocks();
  mocks.session.clear();
  mocks.action.clear();
  activeTab.url = '';
  otherWindowTab.url = 'https://kabutan.jp/stock/?code=7203';
  backgroundTab.url = 'https://example.com/';
  noWindowFocused = false;
  browser.tabs.query.mockImplementation(async ({ active }: { active?: boolean }) =>
    (active
      ? noWindowFocused
        ? []
        : [activeTab]
      : [activeTab, otherWindowTab, backgroundTab]
    ).map((tab) => ({ ...tab })),
  );
});

it('ignores stale responses after changing companies, and distinguishes error and empty', async () => {
  const loads = pendingLoads();
  openTab('https://kabutan.jp/stock/?code=7203');
  const { store, updateTab } = await startServiceWorker();
  expect(store.getState().financialStatement.status).toBe('loading');
  await updateTab({ status: 'loading' }); // 同じページの読み込み直しで二重に取得しない
  expect(load).toHaveBeenCalledTimes(1);
  openTab('https://kabutan.jp/stock/?code=6758');
  await updateTab({ status: 'loading', url: activeTab.url });
  loads[0].resolve([]);
  await flush();
  expect(store.getState().financialStatement.status).toBe('loading');
  loads[1].reject();
  await flush();
  expect(store.getState().financialStatement.status).toBe('error');
  await updateTab({ status: 'loading' });
  loads[2].resolve([]);
  await flush();
  expect(store.getState().financialStatement.status).toBe('empty');
  openTab('https://example.com/');
  await updateTab({ url: activeTab.url });
  expect(store.getState().sitePage.stockCode).toBe('');
  expect(store.getState().financialStatement.status).toBe('idle');
  expect(iconEnabled(activeTab.id)).toBe(false);
});

it('keeps the results after the service worker restarts and does not load the same page again', async () => {
  load.mockResolvedValue([report]);
  openTab('https://kabutan.jp/stock/?code=7203');
  const first = await startServiceWorker();
  expect(first.store.getState().financialStatement.status).toBe('success');

  const restarted = await startServiceWorker();
  expect(restarted.store.getState()).toEqual(first.store.getState());
  await restarted.updateTab({ status: 'loading' });
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

it('retries a failed page when its tab loads again or changes its URL, not on other updates or a restart', async () => {
  load.mockRejectedValue(new Error('offline'));
  openTab('https://kabutan.jp/stock/?code=7203');
  const first = await startServiceWorker();
  expect(first.store.getState().financialStatement.status).toBe('error');
  await first.updateTabOf(backgroundTab, { status: 'loading' });
  await first.updateTabOf(otherWindowTab, { status: 'loading' });
  await first.updateTab({ title: 'トヨタ自動車' });
  await first.updateTab({ status: 'complete' });
  const restarted = await startServiceWorker();
  expect(load).toHaveBeenCalledTimes(1);
  expect(restarted.store.getState().financialStatement.status).toBe('error');

  // 読み込み直しの直後に、読み込み完了・タイトルの通知が続けて届いても、やり直しは取り消されない
  await restarted.updateTab({ status: 'loading' }, { status: 'complete' }, { title: 'トヨタ' });
  expect(load).toHaveBeenCalledTimes(2);
  // 同じ銘柄のまま URL だけが変わったとき（サイト内の別タブなど）
  openTab('https://kabutan.jp/stock/finance?code=7203');
  await restarted.updateTab({ url: activeTab.url });
  expect(load).toHaveBeenCalledTimes(3);
  load.mockResolvedValue([report]);
  await restarted.activateTab();
  expect(load).toHaveBeenCalledTimes(4);
  expect(restarted.store.getState().financialStatement.status).toBe('success');
});

it('keeps the page and does not retry it while no window has focus', async () => {
  load.mockResolvedValue([report]);
  openTab('https://kabutan.jp/stock/?code=7203');
  const first = await startServiceWorker();
  const shown = first.store.getState();
  expect(shown.financialStatement.status).toBe('success');

  // ポップアップを開いて停止していた service worker が起動したとき、どのウィンドウにもフォーカスがない通知が届くことがある
  noWindowFocused = true;
  const restarted = await startServiceWorker();
  await restarted.focusWindow(browser.windows.WINDOW_ID_NONE);
  expect(restarted.store.getState()).toEqual(shown);

  // 失敗した取得も、フォーカスが外れただけではやり直さない
  restarted.store.dispatch(setStatus('error'));
  noWindowFocused = false;
  await restarted.focusWindow(browser.windows.WINDOW_ID_NONE);
  expect(load).toHaveBeenCalledTimes(1);
  await restarted.focusWindow();
  expect(load).toHaveBeenCalledTimes(2);
  expect(restarted.store.getState()).toEqual(shown);
});

it('enables the icon per tab, so a stock page in a window without focus stays enabled', async () => {
  openTab('https://example.com/');
  const { navigateTab, focusWindow } = await startServiceWorker();
  expect(iconEnabled(activeTab.id)).toBe(false);
  expect(iconEnabled(otherWindowTab.id)).toBe(true);
  expect(iconEnabled(backgroundTab.id)).toBe(false);

  await focusWindow();
  expect(iconEnabled(otherWindowTab.id)).toBe(true);
  await navigateTab(otherWindowTab, otherWindowTab.url);
  expect(iconEnabled(otherWindowTab.id)).toBe(true);
  // バックグラウンドのタブも、切り替える前から銘柄ページの状態にする（財務データは取得しない）
  await navigateTab(backgroundTab, 'https://kabutan.jp/stock/?code=6758');
  expect(iconEnabled(backgroundTab.id)).toBe(true);
  await navigateTab(otherWindowTab, 'https://example.com/other');
  expect(iconEnabled(otherWindowTab.id)).toBe(false);
  expect(load).not.toHaveBeenCalled();
});
