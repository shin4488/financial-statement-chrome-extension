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
exposeStore(store, restored);

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

const changeStateByActivatedTag = async () => {
  const requestId = ++requestSequence;
  const activeTabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (requestId !== requestSequence) {
    return;
  }
  const retryOnError = retryConditions.splice(0).some((allows) => allows(activeTabs[0]?.id));
  const page = stockPageOf(activeTabs[0]?.url);
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

// 停止前の状態を戻してから、表示中のページと比べる
const onPageChanged = (retryOnError?: (activeTabId?: number) => boolean) => {
  if (retryOnError !== undefined) {
    retryConditions.push(retryOnError);
  }
  void restored.then(changeStateByActivatedTag);
};
// 失敗した取得は、タブ・ウィンドウを切り替えたときと、表示中のタブの読み込み開始・URL の変更でやり直す。
// 他のタブの更新やタイトルの変更などでは、表示中のページを確かめるだけで API は呼び直さない
browser.tabs.onActivated.addListener(() => onPageChanged(() => true));
browser.windows.onFocusChanged.addListener(() => onPageChanged(() => true));
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  updateAction(tab);
  const reloaded = changeInfo.status === 'loading' || changeInfo.url !== undefined;
  onPageChanged(reloaded ? (activeTabId) => activeTabId === tabId : undefined);
});

// service worker の起動は他のタブの更新などでも起きるため、失敗した取得はやり直さない
onPageChanged();
