import FinancialStatementList from '@/app/features/financialStatementList/FinancialStatementList';
import DefaultLayout from '@/app/layouts/default/DefaultLayout';
import { logLoadStatementsEventToAnalytics } from '@/app/plugins/google/analytics';
import store from '@/app/store';

const Popup = () => {
  // 開いた時点のページに関する情報をGoogleアナリティクスへ送信
  const sitePage = store.getState().sitePage;
  logLoadStatementsEventToAnalytics(sitePage.siteDomain, sitePage.stockCode);

  // ポップアップ画面の大きさの定義
  document.body.className = 'w-[31rem] h-[15rem]';

  return (
    <DefaultLayout>
      <FinancialStatementList />
    </DefaultLayout>
  );
};

export default Popup;
