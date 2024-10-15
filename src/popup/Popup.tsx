import FinancialStatementList from '@/app/features/financialStatementList/FinancialStatementList';
import DefaultLayout from '@/app/layouts/default/DefaultLayout';

const Popup = () => {
  // ポップアップ画面の大きさの定義
  document.body.className = 'w-[31rem] h-[15rem]';

  return (
    <DefaultLayout>
      <FinancialStatementList />
    </DefaultLayout>
  );
};

export default Popup;
