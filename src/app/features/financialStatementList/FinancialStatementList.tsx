import React from 'react';
import { connect } from 'react-redux';
import { Link } from '@mui/material';
import Grid from '@mui/material/Grid2';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import AppCarousel from '@/app/features/appCarousel/AppCarousel';
import BalanceSheetBarCahrt from '@/app/features/balanceSheetBarChart/BalanceSheetBarChart';
import ProfitLossBarChart from '@/app/features/profitLossBarChart/ProfitLossBarChart';
import CashFlowBarChart from '@/app/features/cashFlowBarChart/CashFlowBarChart';
import ChartAlternative from '@/app/features/chartAlternative/ChartAlternative';
import { RootState } from '@/app/store';

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
            <CardHeader subheader="データがありません。決算報告前や日本会計基準を採用していない企業のデータは表示できません。"></CardHeader>
          </Card>
        </Grid>
      );
    }

    return (
      <>
        <Grid container spacing={2} paddingX={2}>
          {this.props.financialStatementResults.map((statement, index) => {
            const balanceSheet = statement.balanceSheet;
            const profitLoss = statement.profitLoss;
            const cashFlow = statement.cashFlow;
            const consolidationTypeLabel = statement.hasConsolidatedFinancialStatement
              ? '連結'
              : '単体';
            const ignoredInductoryCodes = ['bnk', 'ele'];
            const isBankOrElectricity =
              (statement.hasConsolidatedFinancialStatement &&
                ignoredInductoryCodes.includes(
                  statement.consolidatedInductoryCode.toLowerCase(),
                )) ||
              (!statement.hasConsolidatedFinancialStatement &&
                ignoredInductoryCodes.includes(
                  statement.nonConsolidatedInductoryCode.toLowerCase(),
                ));

            return (
              <Grid size={12} key={index}>
                <Card>
                  <CardHeader
                    title={
                      <div className="financial-statement-card-header">
                        <Link
                          title={`${statement.companyName}（株探）`}
                          underline="none"
                          target="_blank"
                          href={`https://kabutan.jp/stock/?code=${statement.stockCode}`}
                        >
                          <span>{statement.companyName}</span>
                        </Link>
                      </div>
                    }
                    subheader={
                      <div className="financial-statement-card-header">
                        {`${statement.fiscalYearStartDate} - ${statement.fiscalYearEndDate}（${consolidationTypeLabel}）`}
                      </div>
                    }
                  />
                  <CardContent>
                    <AppCarousel isAutoPlay={this.props.isAutoPlay} stopAutoPlayOnHover={false}>
                      {/* 貸借対照表 */}
                      {isBankOrElectricity ? (
                        <ChartAlternative>
                          貸借対照表: 金融機関や電気事業者のデータ表示には対応しておりません。
                        </ChartAlternative>
                      ) : (
                        <BalanceSheetBarCahrt
                          amount={balanceSheet.amount}
                          ratio={balanceSheet.ratio}
                        />
                      )}

                      {/* 損益計算書 */}
                      {isBankOrElectricity ? (
                        <ChartAlternative>
                          損益計算書: 金融機関や電気事業者のデータ表示には対応しておりません。
                        </ChartAlternative>
                      ) : (
                        <ProfitLossBarChart amount={profitLoss.amount} ratio={profitLoss.ratio} />
                      )}

                      {/* キャッシュフロー計算書 */}
                      <CashFlowBarChart
                        startingCash={cashFlow.startingCash}
                        operatingActivitiesCashFlow={cashFlow.operatingActivitiesCashFlow}
                        investingActivitiesCashFlow={cashFlow.investingActivitiesCashFlow}
                        financingActivitiesCashFlow={cashFlow.financingActivitiesCashFlow}
                        endingCash={cashFlow.endingCash}
                      />
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
