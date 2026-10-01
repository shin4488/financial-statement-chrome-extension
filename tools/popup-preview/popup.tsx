import '@/global.css';
import { createRoot } from 'react-dom/client';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Popup from '@/popup/Popup';
import financialStatement, { setResult, setStatus } from '@/store/slices/financialStatement';
import autoPlayStatus, { changeAutoPlayStatus } from '@/store/slices/autoPlayStatusSlice';
import sitePage, { changeSiteDomain, changeStockCode } from '@/store/slices/sitePageSlice';
import type { FinancialReportsQuery } from '@/__generated__/graphql';
import query from '@/background/financialStatement/document.graphql?raw';
import { scenarios } from './fixtures';

const store = configureStore({ reducer: { financialStatement, autoPlayStatus, sitePage } });
const params = new URLSearchParams(location.search);
const codes = params
  .get('codes')
  ?.split(',')
  .map((code) => code.trim())
  .filter(Boolean);
const scenario = scenarios.find((item) => item.id === params.get('case')) ?? scenarios[0];
store.dispatch(changeSiteDomain('kabutan.jp'));
store.dispatch(changeStockCode(codes?.join(',') ?? ''));

// 本体は保存済みの自動切替設定を読むため、確認中に5秒ごと勝手に進まない初期値を用意する。
localStorage.setItem('investeeExtensionIsStatementAutoPlay', 'false');
localStorage.setItem('investeeExtensionAnalyticsEnabled', 'false');
store.dispatch(changeAutoPlayStatus(false));

if (codes?.length) {
  store.dispatch(setStatus('loading'));
  void fetch('/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { stockCodes: codes } }),
  })
    .then(async (response) => {
      const payload: { data?: FinancialReportsQuery; errors?: unknown[] } = await response.json();
      if (!response.ok || payload.errors?.length || !payload.data) {
        throw new Error('Financial reports unavailable');
      }
      store.dispatch(setResult(payload.data.financialReports));
    })
    .catch(() => store.dispatch(setStatus('error')));
} else if (scenario.status === 'success') {
  store.dispatch(setResult(scenario.reports));
} else {
  store.dispatch(setStatus(scenario.status));
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <Provider store={store}>
    <Popup />
  </Provider>,
);
