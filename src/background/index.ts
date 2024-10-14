import browser from 'webextension-polyfill';
import store, { initializeWrappedStore } from '../app/store';

initializeWrappedStore();

store.subscribe(() => {
  // access store state
  // const state = store.getState();
  // console.log('state', state);
});

browser.tabs.onActivated.addListener(async () => {
  const activeTabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (activeTabs.length === 0 || activeTabs[0].url === undefined) {
    return;
  }

  // 一度に複数タブをアクティブにすることは考えない（アクティブなタブは1つのみとなる）
  const activeTabUrl = new URL(activeTabs[0].url);
  const activeTabHostName = activeTabUrl.hostname;
  if (activeTabHostName === 'minkabu.jp') {
    browser.action.enable();
  } else {
    browser.action.disable();
  }
});
