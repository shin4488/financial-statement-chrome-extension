import browser from 'webextension-polyfill';
import store, { initializeWrappedStore } from '@/app/store';
import { setResult } from '@/app/slices/financialStatement';
import FinancialStatementService from './financialStatement/service';
import StringUtil from '@/app/plugins/utils/stringUtil';

initializeWrappedStore();

store.subscribe(() => {
  // access store state
  // const state = store.getState();
  // console.log('state', state);
});

const changeStateByActivatedTag = async () => {
  const activeTabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (activeTabs.length === 0 || StringUtil.isEmpty(activeTabs[0].url)) {
    return;
  }

  // 一度に複数タブをアクティブにすることは考えない（アクティブなタブは1つのみとなる）
  const activeTabUrl = new URL(activeTabs[0].url as string);
  const activeTabHostName = activeTabUrl.hostname;
  const activeTabPathname = activeTabUrl.pathname;
  const hasStockCode =
    activeTabHostName === 'minkabu.jp' && activeTabPathname.startsWith('/stock/');
  if (!hasStockCode) {
    browser.action.disable();
    return;
  }

  browser.action.enable();
  const stockCode = activeTabPathname.replace('/stock/', '');
  const statementInstance = new FinancialStatementService();
  const statementResults = await statementInstance.load(stockCode);
  store.dispatch(setResult(statementResults));
};

// タブ切り替えのため
browser.tabs.onActivated.addListener(changeStateByActivatedTag);
// 新規タブを開いたり、URLバーからサイト移動した時のため
browser.tabs.onUpdated.addListener(changeStateByActivatedTag);
browser.windows.onFocusChanged.addListener(changeStateByActivatedTag);
