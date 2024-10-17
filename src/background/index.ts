import browser from 'webextension-polyfill';
import store, { initializeWrappedStore } from '@/app/store';
import { setResult } from '@/app/slices/financialStatement';
import { changeSiteDomain, changeStockCode } from '@/app/slices/sitePageSlice';
import FinancialStatementService from './financialStatement/service';
import StringUtil from '@/app/plugins/utils/stringUtil';
import { getValidSiteInstance } from './siteClassMapper';
import { StockSite } from './stockSite/stockSite';

initializeWrappedStore();

store.subscribe(() => {
  // access store state
  // const state = store.getState();
  // console.log('state', state);
});

const changeStateByActivatedTag = async () => {
  const activeTabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (activeTabs.length === 0 || StringUtil.isEmpty(activeTabs[0].url)) {
    browser.action.disable();
    return;
  }

  // 一度に複数タブをアクティブにすることは考えない（アクティブなタブは1つのみとなる）
  const activeTabUrl = new URL(activeTabs[0].url as string);
  const validSiteClass = getValidSiteInstance(activeTabUrl.hostname);
  if (validSiteClass === undefined) {
    browser.action.disable();
    return;
  }

  const validSiteInstance: StockSite = new validSiteClass(
    activeTabUrl.pathname,
    activeTabUrl.searchParams,
  );
  if (!validSiteInstance.isValid()) {
    browser.action.disable();
    return;
  }

  browser.action.enable();
  const statementInstance = new FinancialStatementService();
  const stockCode = validSiteInstance.getStockCode();
  const statementResults = await statementInstance.load(stockCode);
  store.dispatch(setResult(statementResults));
  store.dispatch(changeSiteDomain(activeTabUrl.hostname));
  store.dispatch(changeStockCode(stockCode));
};

// タブ切り替えのため
browser.tabs.onActivated.addListener(changeStateByActivatedTag);
// 新規タブを開いたり、URLバーからサイト移動した時のため
browser.tabs.onUpdated.addListener(changeStateByActivatedTag);
browser.windows.onFocusChanged.addListener(changeStateByActivatedTag);
