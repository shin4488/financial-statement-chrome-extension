import browser from 'webextension-polyfill';
import store, { initializeWrappedStore } from '@/store/store';
import { setResult, setStatus } from '@/store/slices/financialStatement';
import { changeSiteDomain, changeStockCode } from '@/store/slices/sitePageSlice';
import FinancialStatementService from './financialStatement/service';
import StringUtil from '@/utils/stringUtil';
import { getValidSiteInstance } from './siteClassMapper';
import { StockSite } from './stockSite/stockSite';

initializeWrappedStore();

let activePage = '';
// タブ照会と財務取得は別々に完了順が逆転し得るため、それぞれ最新の要求を識別する。
// 同じ銘柄への更新通知では財務取得をやり直さないので、2つの番号を共用しない。
let requestSequence = 0;
let loadSequence = 0;

const clearPage = () => {
  activePage = '';
  loadSequence++;
  browser.action.disable();
  store.dispatch(setStatus('idle'));
  store.dispatch(changeSiteDomain(''));
  store.dispatch(changeStockCode(''));
};

const changeStateByActivatedTag = async () => {
  const requestId = ++requestSequence;
  const activeTabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (requestId !== requestSequence) {
    return;
  }
  if (activeTabs.length === 0 || StringUtil.isEmpty(activeTabs[0].url)) {
    clearPage();
    return;
  }

  const activeTabUrl = new URL(activeTabs[0].url as string);
  const validSiteClass = getValidSiteInstance(activeTabUrl.hostname);
  if (validSiteClass === undefined) {
    clearPage();
    return;
  }

  const validSiteInstance: StockSite = new validSiteClass(
    activeTabUrl.pathname,
    activeTabUrl.searchParams,
  );
  if (!validSiteInstance.isValid()) {
    clearPage();
    return;
  }

  const stockCode = validSiteInstance.getStockCode();
  const pageKey = `${activeTabUrl.hostname}:${stockCode}`;
  browser.action.enable();
  if (activePage === pageKey && store.getState().financialStatement.status !== 'error') {
    return;
  }
  activePage = pageKey;
  const loadId = ++loadSequence;
  store.dispatch(setStatus('loading'));
  store.dispatch(changeSiteDomain(activeTabUrl.hostname));
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

browser.tabs.onActivated.addListener(changeStateByActivatedTag);
browser.tabs.onUpdated.addListener(changeStateByActivatedTag);
browser.windows.onFocusChanged.addListener(changeStateByActivatedTag);

void changeStateByActivatedTag();
