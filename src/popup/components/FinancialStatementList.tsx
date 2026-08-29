import React from 'react';
import { connect } from 'react-redux';
import { Link } from '@mui/material';
import Grid from '@mui/material/Grid2';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import AppCarousel from './appCarousel/AppCarousel';
import { StackedBarChart, WaterfallChart } from '@/shared/financialCharts';
import { RootState } from '@/store/store';

// 会計基準は日本基準以外のみサブヘッダに表示する（判断材料として意味を持つのは
// 「日本基準とは表示形式が違う」ことを示す場合だけのため）。
// accountingStandardを描画分岐に使わないことがこの設計の規律
const nonJgaapBadge: Record<string, string> = {
  ifrs: 'IFRS',
  us_gaap: '米国基準',
};

const mapStateToProps = (state: RootState) => ({
  isAutoPlay: state.autoPlayStatus.isAutoPlay,
  financialStatementResults: state.financialStatement.results,
});
type FinancialStatementListWithStoreProps = ReturnType<typeof mapStateToProps>;

class FinancialStatementList extends React.Component<FinancialStatementListWithStoreProps> {
  render(): React.ReactNode {
    if (this.props.financialStatementResults.length === 0) {
      return (
        <Grid size={12}>
          <Card>
            <CardHeader subheader="データがありません。決算報告前などデータが未登録の企業は表示できません。"></CardHeader>
          </Card>
        </Grid>
      );
    }

    return (
      <>
        <Grid container spacing={2} paddingX={2}>
          {this.props.financialStatementResults.map((statement) => {
            const consolidationTypeLabel =
              statement.consolidationType === 'consolidated' ? '連結' : '単体';
            // hasOwnPropertyで引く: 素の[]アクセスだとaccountingStandardが"constructor"等のとき
            // Object.prototypeのメンバーがラベルとして描画されるため
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
              <Grid size={12} key={statement.id}>
                <Card>
                  <CardHeader
                    title={
                      <div className="financial-statement-card-header">
                        <Link
                          title={`${statement.companyName}（株探）`}
                          underline="none"
                          target="_blank"
                          rel="noopener noreferrer"
                          href={`https://kabutan.jp/stock/?code=${encodeURIComponent(
                            statement.stockCode ?? '',
                          )}`}
                        >
                          <span>{statement.companyName}</span>
                        </Link>
                      </div>
                    }
                    subheader={
                      <div className="financial-statement-card-header">
                        {`${statement.fiscalYearStartDate} - ${statement.fiscalYearEndDate}${subheaderSuffix}`}
                      </div>
                    }
                  />
                  <CardContent>
                    <AppCarousel isAutoPlay={this.props.isAutoPlay} stopAutoPlayOnHover={false}>
                      {/* 貸借対照表・損益計算書・キャッシュフロー計算書。
                          チャート構造はAPIの返却値をそのまま渡す（表示不可はrenderable/noteで届く） */}
                      <StackedBarChart chart={statement.balanceSheet} width="100%" />
                      <StackedBarChart chart={statement.profitLoss} width="100%" />
                      <WaterfallChart chart={statement.cashFlow} width="100%" />
                    </AppCarousel>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </>
    );
  }
}

export default connect(mapStateToProps)(FinancialStatementList);
