import React from 'react';
import { connect } from 'react-redux';
import { Link } from '@mui/material';
import Grid from '@mui/material/Grid2';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import AppCarousel from './appCarousel/AppCarousel';
import { FreeCashFlowChart, StackedBarChart, WaterfallChart } from '@/shared/financialCharts';
import { FinancialIndicators } from '@/shared/financialIndicators';
import { trackEvent } from '../analytics';
import { useStaggeredDraw } from './useStaggeredDraw';
import { RootState } from '@/store/store';

// 会計基準は日本基準以外のみサブヘッダに表示する（判断材料として意味を持つのは「日本基準とは表示形式が違う」ことを示す場合だけのため）。
// accountingStandardはこの表示だけに使い、チャートの描画を分岐させない（チャートの構造はAPIの返却値に従う）
const nonJgaapBadge: Record<string, string> = {
  ifrs: 'IFRS',
  us_gaap: '米国基準',
};

const mapStateToProps = (state: RootState) => ({
  status: state.financialStatement.status,
  financialStatementResults: state.financialStatement.results,
});
type FinancialStatementListWithStoreProps = ReturnType<typeof mapStateToProps> & {
  isAutoPlay: boolean;
};
type FinancialStatementResult =
  FinancialStatementListWithStoreProps['financialStatementResults'][number];

// ポップアップを開いたときに全年度のグラフを一度に描くと、表示が遅れる。見えているカードを先に描き、ほかのカードは1枚ずつ順に描く。
// 描くまではグラフと同じ大きさの枠を置くため、カードの高さとカルーセルの動きは変わらない
function FinancialStatementCard({
  statement,
  isAutoPlay,
}: {
  statement: FinancialStatementResult;
  isAutoPlay: boolean;
}) {
  const [cardRef, drawn] = useStaggeredDraw<HTMLDivElement>();
  const deferred = !drawn;
  const consolidationTypeLabel = statement.consolidationType === 'consolidated' ? '連結' : '単体';
  // hasOwnPropertyで引く: 素の[]アクセスだとaccountingStandardが"constructor"等のときObject.prototypeのメンバーがラベルとして描画されるため
  const standardLabel = Object.prototype.hasOwnProperty.call(
    nonJgaapBadge,
    statement.accountingStandard,
  )
    ? nonJgaapBadge[statement.accountingStandard]
    : undefined;
  const subheaderSuffix = standardLabel
    ? `（${consolidationTypeLabel}・${standardLabel}）`
    : `（${consolidationTypeLabel}）`;

  return (
    <Card ref={cardRef}>
      <CardHeader
        title={
          <Link
            title={`${statement.companyName}（株探）`}
            onClick={() => trackEvent('outbound_click', { link_domain: 'kabutan.jp' })}
            underline="none"
            target="_blank"
            rel="noopener noreferrer"
            href={`https://kabutan.jp/stock/?code=${encodeURIComponent(statement.stockCode ?? '')}`}
          >
            <span>{statement.companyName}</span>
          </Link>
        }
        subheader={`${statement.fiscalYearStartDate} - ${statement.fiscalYearEndDate}${subheaderSuffix}`}
      />
      <CardContent>
        <AppCarousel isAutoPlay={isAutoPlay}>
          {/* 貸借対照表・損益計算書・キャッシュフロー計算書・フリーCF・ROE・ROA。
              チャート構造はAPIの返却値をそのまま渡す（表示不可はrenderable/noteで届く） */}
          <StackedBarChart chart={statement.balanceSheet} width="100%" deferred={deferred} />
          <StackedBarChart chart={statement.profitLoss} width="100%" deferred={deferred} />
          <WaterfallChart chart={statement.cashFlow} width="100%" deferred={deferred} />
          <FreeCashFlowChart trend={statement.freeCashFlowTrend} deferred={deferred} />
          <FinancialIndicators indicators={statement.financialIndicators} />
        </AppCarousel>
      </CardContent>
    </Card>
  );
}

// background は、表示中のタブが銘柄ページでなければ状態を idle にする。ポップアップは background が確認を終えた状態を受け取ってから描くため、
// idle は読み込みの前ではなく、表示できるページではないことを表す。失敗した取得は、ポップアップを開いたときにやり直す
const statusMessages = {
  idle: 'このページは対応しているサイトの銘柄ページではないため、財務データを表示できません。',
  loading: '財務データを読み込んでいます。',
  error: '財務データを取得できませんでした。ポップアップを開き直してお試しください。',
} as const;

// 状態の文言やデータなしのカードも、年度のカードと同じ左右の余白の中に置く
function ListArea({ children }: { children: React.ReactNode }) {
  return (
    <Grid container spacing={2} paddingX={2}>
      {children}
    </Grid>
  );
}

class FinancialStatementList extends React.Component<FinancialStatementListWithStoreProps> {
  render(): React.ReactNode {
    const { status } = this.props;
    if (status === 'loading' || status === 'idle' || status === 'error') {
      return (
        <ListArea>
          <Grid size={12}>
            <p role="status">{statusMessages[status]}</p>
          </Grid>
        </ListArea>
      );
    }
    if (this.props.financialStatementResults.length === 0) {
      return (
        <ListArea>
          <Grid size={12}>
            <Card>
              <CardHeader subheader="データがありません。決算報告前などデータが未登録の企業は表示できません。"></CardHeader>
            </Card>
          </Grid>
        </ListArea>
      );
    }

    return (
      <ListArea>
        {this.props.financialStatementResults.map((statement) => (
          <Grid size={12} key={statement.id}>
            <FinancialStatementCard statement={statement} isAutoPlay={this.props.isAutoPlay} />
          </Grid>
        ))}
      </ListArea>
    );
  }
}

export default connect(mapStateToProps)(FinancialStatementList);
