import browser, { type Tabs } from 'webextension-polyfill';
import { exposeStore } from '@/store/bridge';
import store from '@/store/store';
import { setResult, setStatus } from '@/store/slices/financialStatement';
import { changeSiteDomain, changeStockCode } from '@/store/slices/sitePageSlice';
import FinancialStatementService from './financialStatement/service';
import StringUtil from '@/utils/stringUtil';
import { restoreSessionState } from './sessionState';
import { getValidSiteInstance } from './siteClassMapper';
import { StockSite } from './stockSite/stockSite';

const restored = restoreSessionState(store);

// 対応サイトの銘柄ページなら、サイトと証券コードを返す
const stockPageOf = (url: string | undefined) => {
  if (StringUtil.isEmpty(url)) {
    return undefined;
  }
  const pageUrl = new URL(url as string);
  const validSiteClass = getValidSiteInstance(pageUrl.hostname);
  if (validSiteClass === undefined) {
    return undefined;
  }
  const validSiteInstance: StockSite = new validSiteClass(pageUrl.pathname, pageUrl.searchParams);
  if (!validSiteInstance.isValid()) {
    return undefined;
  }
  return { siteDomain: pageUrl.hostname, stockCode: validSiteInstance.getStockCode() };
};

// アイコンの有効・無効はタブごとに設定し、各ウィンドウで表示中のタブの状態を表示させる。
// 既定は無効で、銘柄ページのタブだけ有効にする。タブの設定はページを読み込むと消えるため、更新通知のたびに設定し直す
const updateAction = (tab: Tabs.Tab) => {
  if (tab.id === undefined) {
    return;
  }
  // 更新通知の後に閉じたタブは設定できないが、表示されないので無視する
  (stockPageOf(tab.url) ? browser.action.enable(tab.id) : browser.action.disable(tab.id)).catch(
    () => undefined,
  );
};
void browser.action.disable();
// インストール・更新の直後など、service worker の起動前から開いているタブにも設定する
void browser.tabs.query({}).then((tabs) => tabs.forEach(updateAction));

// タブ照会と財務取得は別々に完了順が逆転し得るため、それぞれ最新の要求を識別する。
// 同じ銘柄への更新通知では財務取得をやり直さないので、2つの番号を共用しない。
let requestSequence = 0;
let loadSequence = 0;

const clearPage = () => {
  loadSequence++;
  store.dispatch(setStatus('idle'));
  store.dispatch(changeSiteDomain(''));
  store.dispatch(changeStockCode(''));
};

// 同じページで失敗した取得をやり直す条件（表示中のタブの ID を受け取って判定する）。
// タブの照会は直後の通知で打ち切られることがあるため、条件は最後まで照会を終えたときにまとめて使う
const retryConditions: ((activeTabId?: number) => boolean)[] = [];

// service worker には現在のウィンドウがなく、currentWindow を指定した照会は空になることがある
// （停止していた service worker をポップアップを開いて起動したときなど）。最後にフォーカスしたウィンドウを指定して照会する
const queryShownTab = async () => {
  const { id: windowId } = await browser.windows.getLastFocused();
  if (windowId === undefined) {
    return undefined;
  }
  const [tab] = await browser.tabs.query({ active: true, windowId });
  return tab as Tabs.Tab | undefined;
};

const loadFinancialStatement = async (loadId: number, stockCode: string) => {
  try {
    const statementResults = await new FinancialStatementService().load(stockCode);
    // 同じページの更新通知が来ても結果を受け取る。別ページへ移動した結果は破棄する。
    if (loadId !== loadSequence) {
      return;
    }
    store.dispatch(setResult(statementResults));
  } catch {
    if (loadId === loadSequence) {
      store.dispatch(setStatus('error'));
    }
  }
};

// 最後に始めた確認。確認は、表示中のページと比べ、取得が要るなら読み込み中にして取得を始めたところで終わる（取得の完了は待たない）
let latestCheck: Promise<void> = Promise.resolve();

const checkShownPage = async (): Promise<void> => {
  const requestId = ++requestSequence;
  const shownTab = await queryShownTab().catch(() => undefined);
  // 打ち切った確認のやり直しの条件は、後から始まった確認が引き継ぐ。その確認が判定を終えるまで待つ
  if (requestId !== requestSequence) {
    return latestCheck;
  }
  // 表示中のタブを特定できないとき（ウィンドウがないときなど）は、表示を変えない
  if (shownTab === undefined) {
    return;
  }
  const retryOnError = retryConditions.splice(0).some((allows) => allows(shownTab.id));
  const page = stockPageOf(shownTab.url);
  if (page === undefined) {
    clearPage();
    return;
  }

  const { siteDomain, stockCode } = page;
  const { financialStatement, sitePage } = store.getState();
  if (
    sitePage.siteDomain === siteDomain &&
    sitePage.stockCode === stockCode &&
    !(financialStatement.status === 'error' && retryOnError)
  ) {
    return;
  }
  const loadId = ++loadSequence;
  store.dispatch(setStatus('loading'));
  store.dispatch(changeSiteDomain(siteDomain));
  store.dispatch(changeStockCode(stockCode));
  void loadFinancialStatement(loadId, stockCode);
};

// 停止前の状態を戻してから、表示中のページと比べる
const onPageChanged = (retryOnError?: (activeTabId?: number) => boolean) => {
  if (retryOnError !== undefined) {
    retryConditions.push(retryOnError);
  }
  latestCheck = restored.then(checkShownPage);
  return latestCheck;
};
// 失敗した取得は、ポップアップが接続したとき、タブ・ウィンドウを切り替えたとき、表示中のタブの URL が変わったときにやり直す。
// 読み込み開始の通知（status: 'loading'）は iframe の読み込みでも届き、同じ URL での読み込み直しと区別できないため、条件にしない
// （読み込み直したページは、ポップアップを開いたときにやり直す）。
// 他のタブの更新やタイトルの変更などでは、表示中のページを確かめるだけで API は呼び直さない。
// ポップアップへは確認を終えてから状態を送らせ、やり直す前の失敗を表示させない
exposeStore(store, { ready: restored, onConnect: () => onPageChanged(() => true) });
browser.tabs.onActivated.addListener(() => void onPageChanged(() => true));
browser.windows.onFocusChanged.addListener((windowId) => {
  // Chrome のウィンドウからフォーカスが外れただけなら、表示中のページは変わらない
  if (windowId !== browser.windows.WINDOW_ID_NONE) {
    void onPageChanged(() => true);
  }
});
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  updateAction(tab);
  void onPageChanged(
    changeInfo.url !== undefined ? (activeTabId) => activeTabId === tabId : undefined,
  );
});

// service worker の起動は他のタブの更新などでも起きるため、失敗した取得はやり直さない（ポップアップの接続で起動したときは、接続でやり直す）
void onPageChanged();
