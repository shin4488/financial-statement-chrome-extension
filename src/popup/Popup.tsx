import FinancialStatementList from './components/FinancialStatementList';
import DefaultLayout from './components/defaultLayout/DefaultLayout';
import { logLoadStatementsEventToAnalytics } from './analytics';
import store from '@/store/store';

const Popup = () => {
  // 開いた時点のページに関する情報をGoogleアナリティクスへ送信
  const sitePage = store.getState().sitePage;
  logLoadStatementsEventToAnalytics(sitePage.siteDomain, sitePage.stockCode);

  // ポップアップ画面の大きさの定義
  document.body.className = 'w-[28rem] h-[15rem]';

  return (
    <DefaultLayout>
      <FinancialStatementList />
    </DefaultLayout>
  );
};

export default Popup;
