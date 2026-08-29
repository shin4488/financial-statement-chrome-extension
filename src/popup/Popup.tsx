import FinancialStatementList from './components/FinancialStatementList';
import DefaultLayout from './components/defaultLayout/DefaultLayout';
import { logLoadStatementsEventToAnalytics } from './analytics';
import store from '@/store/store';

const Popup = () => {
  // 開いた時点のページに関する情報をGoogleアナリティクスへ送信
  const sitePage = store.getState().sitePage;
  logLoadStatementsEventToAnalytics(sitePage.siteDomain, sitePage.stockCode);

  // ポップアップ画面の大きさはpopup.htmlの静的CSSで定義する（ここでbodyに当てると
  // JS実行までの未スタイルな一瞬をChromeが実寸とみなし、窓幅が最大の800pxで固定されることがある）

  return (
    <DefaultLayout>
      <FinancialStatementList />
    </DefaultLayout>
  );
};

export default Popup;
