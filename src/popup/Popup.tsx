import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import FinancialStatementList from './components/FinancialStatementList';
import DefaultLayout from './components/defaultLayout/DefaultLayout';
import { trackEvent } from './analytics';
import type { RootState } from '@/store/store';

const autoPlayStorageKey = 'investeeExtensionIsStatementAutoPlay';

const Popup = () => {
  const sitePage = useSelector((state: RootState) => state.sitePage);
  const { status, results } = useSelector((state: RootState) => state.financialStatement);
  // 自動切替はポップアップだけの表示設定なので、background を経由せずポップアップの保存値を最初の描画から使う
  const [isAutoPlay, setIsAutoPlay] = useState(
    () => (localStorage.getItem(autoPlayStorageKey) || 'true') === 'true',
  );
  const changeAutoPlay = (value: boolean) => {
    localStorage.setItem(autoPlayStorageKey, String(value));
    setIsAutoPlay(value);
  };
  const opened = useRef(false);
  const reported = useRef('');
  useEffect(() => {
    if (opened.current) {
      return;
    }
    opened.current = true;
    trackEvent('popup_open', { site_domain_name: sitePage.siteDomain || 'unknown' });
  }, [sitePage.siteDomain]);
  useEffect(() => {
    if (status !== 'success' && status !== 'empty' && status !== 'error') {
      return;
    }
    const key = `${sitePage.siteDomain}:${sitePage.stockCode}:${status}`;
    if (reported.current === key) {
      return;
    }
    reported.current = key;
    trackEvent('report_result', {
      site_domain_name: sitePage.siteDomain || 'unknown',
      result_status: status,
      result_count: results.length,
      unavailable_count: results.filter((report) =>
        [report.balanceSheet, report.profitLoss, report.cashFlow].some(
          (chart) => !chart.renderable,
        ),
      ).length,
    });
  }, [results, sitePage, status]);

  return (
    <DefaultLayout isAutoPlay={isAutoPlay} onAutoPlayChange={changeAutoPlay}>
      <FinancialStatementList isAutoPlay={isAutoPlay} />
    </DefaultLayout>
  );
};

export default Popup;
