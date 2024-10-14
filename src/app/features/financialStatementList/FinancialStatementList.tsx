import React from 'react';
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
import { FinancialStatementResult } from '@/background/financialStatement/result';
import { FinancialStatementListState } from './state';
// import FirebaseAnalytics from '@/plugins/firebase/analytics';

export default class FinancialStatementList extends React.Component<
  unknown,
  FinancialStatementListState
> {
  state: Readonly<FinancialStatementListState> = {
    financialStatements: [],
  };

  componentDidMount(): void {
    const financialStatementResult: FinancialStatementResult[] = [
      {
        fiscalYearStartDate: '2023-01-01',
        fiscalYearEndDate: '2023-12-31',
        stockCode: '4493',
        companyName: '株式会社サイバーセキュリティクラウド',
        hasConsolidatedFinancialStatement: true,
        consolidatedInductoryCode: 'CTE',
        nonConsolidatedInductoryCode: 'CTE',
        balanceSheet: {
          amount: {
            currentAsset: 2146597000,
            propertyPlantAndEquipment: 51785000,
            intangibleAsset: 350199000,
            investmentAndOtherAsset: 232497000,
            currentLiability: 866808000,
            noncurrentLiability: 91739000,
            netAsset: 1822531000,
          },
          ratio: {
            currentAsset: 77.1,
            propertyPlantAndEquipment: 1.8,
            intangibleAsset: 12.5,
            investmentAndOtherAsset: 8.6,
            currentLiability: 31.1,
            noncurrentLiability: 3.2,
            netAsset: 65.7,
          },
        },
        profitLoss: {
          amount: {
            netSales: 3060751000,
            originalCost: 924992000,
            sellingGeneralExpense: 1585863000,
            operatingIncome: 549895000,
          },
          ratio: {
            netSales: 100,
            originalCost: 30.2,
            sellingGeneralExpense: 51.8,
            operatingIncome: 18,
          },
        },
        cashFlow: {
          startingCash: 1330154000,
          operatingActivitiesCashFlow: 578460000,
          investingActivitiesCashFlow: -106150000,
          financingActivitiesCashFlow: -93260000,
          endingCash: 1754945000,
        },
      },
      {
        fiscalYearStartDate: '2022-01-01',
        fiscalYearEndDate: '2022-12-31',
        stockCode: '4493',
        companyName: '株式会社サイバーセキュリティクラウド',
        hasConsolidatedFinancialStatement: false,
        consolidatedInductoryCode: '',
        nonConsolidatedInductoryCode: 'CTE',
        balanceSheet: {
          amount: {
            currentAsset: 1621137000,
            propertyPlantAndEquipment: 57414000,
            intangibleAsset: 286931000,
            investmentAndOtherAsset: 191882000,
            currentLiability: 663888000,
            noncurrentLiability: 184198000,
            netAsset: 1309278000,
          },
          ratio: {
            currentAsset: 75.1,
            propertyPlantAndEquipment: 2.6,
            intangibleAsset: 13.3,
            investmentAndOtherAsset: 9,
            currentLiability: 30.7,
            noncurrentLiability: 8.5,
            netAsset: 60.8,
          },
        },
        profitLoss: {
          amount: {
            netSales: 2275950000,
            originalCost: 664125000,
            sellingGeneralExpense: 1225924000,
            operatingIncome: 385900000,
          },
          ratio: {
            netSales: 100,
            originalCost: 29.1,
            sellingGeneralExpense: 53.8,
            operatingIncome: 17.1,
          },
        },
        cashFlow: {
          startingCash: 796741000,
          operatingActivitiesCashFlow: 353632000,
          investingActivitiesCashFlow: -114240000,
          financingActivitiesCashFlow: 40603000,
          endingCash: 1330154000,
        },
      },
      {
        fiscalYearStartDate: '2021-01-01',
        fiscalYearEndDate: '2021-12-31',
        stockCode: '4493',
        companyName: '株式会社サイバーセキュリティクラウド',
        hasConsolidatedFinancialStatement: true,
        consolidatedInductoryCode: 'CTE',
        nonConsolidatedInductoryCode: 'CTE',
        balanceSheet: {
          amount: {
            currentAsset: 1253269000,
            propertyPlantAndEquipment: 2902000,
            intangibleAsset: 299892000,
            investmentAndOtherAsset: 153959000,
            currentLiability: 543397000,
            noncurrentLiability: 221730000,
            netAsset: 944896000,
          },
          ratio: {
            currentAsset: 73.2,
            propertyPlantAndEquipment: 0.1,
            intangibleAsset: 17.5,
            investmentAndOtherAsset: 9.2,
            currentLiability: 31.7,
            noncurrentLiability: 12.9,
            netAsset: 55.4,
          },
        },
        profitLoss: {
          amount: {
            netSales: 1817470000,
            originalCost: 535877000,
            sellingGeneralExpense: 984324000,
            operatingIncome: 297268000,
          },
          ratio: {
            netSales: 100,
            originalCost: 29.4,
            sellingGeneralExpense: 54.1,
            operatingIncome: 16.5,
          },
        },
        cashFlow: {
          startingCash: 899050000,
          operatingActivitiesCashFlow: 382044000,
          investingActivitiesCashFlow: -59020000,
          financingActivitiesCashFlow: -169894000,
          endingCash: 1052180000,
        },
      },
      {
        fiscalYearStartDate: '2020-01-01',
        fiscalYearEndDate: '2020-12-31',
        stockCode: '4493',
        companyName: '株式会社サイバーセキュリティクラウド',
        hasConsolidatedFinancialStatement: true,
        consolidatedInductoryCode: 'CTE',
        nonConsolidatedInductoryCode: 'CTE',
        balanceSheet: {
          amount: {
            currentAsset: 1098414000,
            propertyPlantAndEquipment: 15742000,
            intangibleAsset: 329207000,
            investmentAndOtherAsset: 55820000,
            currentLiability: 645472000,
            noncurrentLiability: 189173000,
            netAsset: 664538000,
          },
          ratio: {
            currentAsset: 73.2,
            propertyPlantAndEquipment: 1,
            intangibleAsset: 21.9,
            investmentAndOtherAsset: 3.9,
            currentLiability: 43,
            noncurrentLiability: 12.6,
            netAsset: 44.4,
          },
        },
        profitLoss: {
          amount: {
            netSales: 1194005000,
            originalCost: 377282000,
            sellingGeneralExpense: 628301000,
            operatingIncome: 188421000,
          },
          ratio: {
            netSales: 100,
            originalCost: 31.5,
            sellingGeneralExpense: 52.6,
            operatingIncome: 15.9,
          },
        },
        cashFlow: {
          startingCash: 356914000,
          operatingActivitiesCashFlow: 133920000,
          investingActivitiesCashFlow: -242522000,
          financingActivitiesCashFlow: 650737000,
          endingCash: 899050000,
        },
      },
    ];
    this.setState(() => {
      return {
        // 下へスクロースするため、末尾へ取得データを追加する
        financialStatements: financialStatementResult,
      };
    });
  }

  render(): React.ReactNode {
    return (
      <>
        <Grid container spacing={2} padding={2}>
          {this.state.financialStatements.map((statement, index) => {
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
                          <span
                          // onClick={() =>
                          //   FirebaseAnalytics.logClickEvent({
                          //     content_type: 'url',
                          //     link_domain: 'kabutan.jp',
                          //     link_url: `https://kabutan.jp/stock/?code=${statement.stockCode}`,
                          //     custom_stock_code: statement.stockCode,
                          //     custom_title: statement.companyName,
                          //     custom_timespan: `${statement.fiscalYearStartDate}-${statement.fiscalYearEndDate}`,
                          //   })
                          // }
                          >
                            {statement.companyName}
                          </span>
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
                    <AppCarousel isAutoPlay stopAutoPlayOnHover={false}>
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
