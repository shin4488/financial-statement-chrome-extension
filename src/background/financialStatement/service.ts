import { CompanyFinancialStatement } from '@/__generated__/graphql';
import StringUtil from '@/app/plugins/utils/stringUtil';
import { NumberUtil } from '@/app/plugins/utils/numberUtil';
import ApolloClientService from '@/app/plugins/apollo/service';
import { FinancialStatementConditionParameter } from './parameter';
import { FinancialStatementResult } from './result';

export default class FinancialStatementService {
  private apolloService: ApolloClientService;

  constructor() {
    this.apolloService = new ApolloClientService();
  }

  async load(stockCode: string) {
    const condition = {
      stockCodes: [stockCode],
    };
    const result = await this.query(condition);
    const financialStatements = result.companyFinancialStatements;
    if (
      financialStatements === undefined ||
      financialStatements === null ||
      financialStatements.length === 0
    ) {
      return [];
    }

    return financialStatements.map((statement) =>
      this.mapFinancialStatementFromResponseToState(statement),
    );
  }

  private query(parameter: FinancialStatementConditionParameter) {
    const result = this.apolloService
      .query(
        `
        query {
          companyFinancialStatements(
            offset: 0
            , limit: 100
            , stockCodes: ${JSON.stringify(parameter.stockCodes)}
          ) {
            fiscalYearStartDate
            fiscalYearEndDate
            filingDate
            stockCode
            companyJapaneseName
            hasConsolidatedFinancialStatement
            consolidatedInductoryCode
            nonConsolidatedInductoryCode
            balanceSheet {
              amount {
                currentAsset
                propertyPlantAndEquipment
                intangibleAsset
                investmentAndOtherAsset
                currentLiability
                noncurrentLiability
                netAsset
              }
              ratio {
                currentAsset
                propertyPlantAndEquipment
                intangibleAsset
                investmentAndOtherAsset
                currentLiability
                noncurrentLiability
                netAsset
              }
            }
            profitLoss {
              amount {
                netSales
                originalCost
                sellingGeneralExpense
                operatingIncome
              }
              ratio {
                netSales
                originalCost
                sellingGeneralExpense
                operatingIncome
              }
            }
            cashFlow {
              startingCash
              operatingActivitiesCashFlow
              investingActivitiesCashFlow
              financingActivitiesCashFlow
              endingCash
            }
          }
        }
        `,
      )
      .then((result) => result);
    return result;
  }

  private mapFinancialStatementFromResponseToState(
    financialStatementResponse: CompanyFinancialStatement,
  ): FinancialStatementResult {
    const balanceSheetAmount = financialStatementResponse.balanceSheet?.amount;
    const balanceSheetRatio = financialStatementResponse.balanceSheet?.ratio;
    const profitLossAmount = financialStatementResponse.profitLoss?.amount;
    const profitLossRatio = financialStatementResponse.profitLoss?.ratio;
    const cashFlow = financialStatementResponse.cashFlow;

    return {
      fiscalYearStartDate: StringUtil.toBlankIfEmpty(
        financialStatementResponse.fiscalYearStartDate,
      ),
      fiscalYearEndDate: StringUtil.toBlankIfEmpty(financialStatementResponse.fiscalYearEndDate),
      stockCode: StringUtil.toBlankIfEmpty(financialStatementResponse.stockCode).slice(0, -1),
      companyName: StringUtil.toBlankIfEmpty(financialStatementResponse.companyJapaneseName),
      hasConsolidatedFinancialStatement:
        financialStatementResponse.hasConsolidatedFinancialStatement || false,
      consolidatedInductoryCode: StringUtil.toBlankIfEmpty(
        financialStatementResponse.consolidatedInductoryCode,
      ),
      nonConsolidatedInductoryCode: StringUtil.toBlankIfEmpty(
        financialStatementResponse.nonConsolidatedInductoryCode,
      ),
      balanceSheet: {
        amount: {
          currentAsset: NumberUtil.toNumberOrDefault(balanceSheetAmount?.currentAsset),
          propertyPlantAndEquipment: NumberUtil.toNumberOrDefault(
            balanceSheetAmount?.propertyPlantAndEquipment,
          ),
          intangibleAsset: NumberUtil.toNumberOrDefault(balanceSheetAmount?.intangibleAsset),
          investmentAndOtherAsset: NumberUtil.toNumberOrDefault(
            balanceSheetAmount?.investmentAndOtherAsset,
          ),
          currentLiability: NumberUtil.toNumberOrDefault(balanceSheetAmount?.currentLiability),
          noncurrentLiability: NumberUtil.toNumberOrDefault(
            balanceSheetAmount?.noncurrentLiability,
          ),
          netAsset: NumberUtil.toNumberOrDefault(balanceSheetAmount?.netAsset),
        },
        ratio: {
          currentAsset: NumberUtil.toNumberOrDefault(balanceSheetRatio?.currentAsset),
          propertyPlantAndEquipment: NumberUtil.toNumberOrDefault(
            balanceSheetRatio?.propertyPlantAndEquipment,
          ),
          intangibleAsset: NumberUtil.toNumberOrDefault(balanceSheetRatio?.intangibleAsset),
          investmentAndOtherAsset: NumberUtil.toNumberOrDefault(
            balanceSheetRatio?.investmentAndOtherAsset,
          ),
          currentLiability: NumberUtil.toNumberOrDefault(balanceSheetRatio?.currentLiability),
          noncurrentLiability: NumberUtil.toNumberOrDefault(balanceSheetRatio?.noncurrentLiability),
          netAsset: NumberUtil.toNumberOrDefault(balanceSheetRatio?.netAsset),
        },
      },
      profitLoss: {
        amount: {
          netSales: NumberUtil.toNumberOrDefault(profitLossAmount?.netSales),
          originalCost: NumberUtil.toNumberOrDefault(profitLossAmount?.originalCost),
          sellingGeneralExpense: NumberUtil.toNumberOrDefault(
            profitLossAmount?.sellingGeneralExpense,
          ),
          operatingIncome: NumberUtil.toNumberOrDefault(profitLossAmount?.operatingIncome),
        },
        ratio: {
          netSales: NumberUtil.toNumberOrDefault(profitLossRatio?.netSales),
          originalCost: NumberUtil.toNumberOrDefault(profitLossRatio?.originalCost),
          sellingGeneralExpense: NumberUtil.toNumberOrDefault(
            profitLossRatio?.sellingGeneralExpense,
          ),
          operatingIncome: NumberUtil.toNumberOrDefault(profitLossRatio?.operatingIncome),
        },
      },
      cashFlow: {
        startingCash: NumberUtil.toNumberOrDefault(cashFlow?.startingCash),
        operatingActivitiesCashFlow: NumberUtil.toNumberOrDefault(
          cashFlow?.operatingActivitiesCashFlow,
        ),
        investingActivitiesCashFlow: NumberUtil.toNumberOrDefault(
          cashFlow?.investingActivitiesCashFlow,
        ),
        financingActivitiesCashFlow: NumberUtil.toNumberOrDefault(
          cashFlow?.financingActivitiesCashFlow,
        ),
        endingCash: NumberUtil.toNumberOrDefault(cashFlow?.endingCash),
      },
    };
  }
}
