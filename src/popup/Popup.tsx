import FinancialStatementList from '@/app/features/financialStatementList/FinancialStatementList';

const Popup = () => {
  // ポップアップ画面の大きさの定義
  document.body.className = 'w-[31rem] h-[15rem]';

  return <FinancialStatementList />;
};

export default Popup;
