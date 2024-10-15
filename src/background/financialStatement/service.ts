import {
  GetCompanyFinancialStatementsByCodesDocument,
  GetCompanyFinancialStatementsByCodesQuery,
  GetCompanyFinancialStatementsByCodesQueryVariables,
} from '@/__generated__/graphql';
import StringUtil from '@/app/plugins/utils/stringUtil';
import { NumberUtil } from '@/app/plugins/utils/numberUtil';
import ApolloClientService from '@/app/plugins/apollo/service';

export default class FinancialStatementService {
  private apolloService: ApolloClientService;

  constructor() {
    this.apolloService = new ApolloClientService();
  }

  async load(stockCode: string) {
    const { data } = await this.apolloService.query<
      GetCompanyFinancialStatementsByCodesQuery,
      GetCompanyFinancialStatementsByCodesQueryVariables
    >(GetCompanyFinancialStatementsByCodesDocument, { stockCodes: [stockCode] });

    const financialStatements = data?.companyFinancialStatements;
    if (
      financialStatements === undefined ||
      financialStatements === null ||
      financialStatements.length === 0
    ) {
      return [];
    }

    return financialStatements.map((statement) => {
      const balanceSheetAmount = statement.balanceSheet?.amount;
      const balanceSheetRatio = statement.balanceSheet?.ratio;
      const profitLossAmount = statement.profitLoss?.amount;
      const profitLossRatio = statement.profitLoss?.ratio;
      const cashFlow = statement.cashFlow;

      return {
        fiscalYearStartDate: StringUtil.toBlankIfEmpty(statement.fiscalYearStartDate),
        fiscalYearEndDate: StringUtil.toBlankIfEmpty(statement.fiscalYearEndDate),
        stockCode: StringUtil.toBlankIfEmpty(statement.stockCode).slice(0, -1),
        companyName: StringUtil.toBlankIfEmpty(statement.companyJapaneseName),
        hasConsolidatedFinancialStatement: statement.hasConsolidatedFinancialStatement || false,
        consolidatedInductoryCode: StringUtil.toBlankIfEmpty(statement.consolidatedInductoryCode),
        nonConsolidatedInductoryCode: StringUtil.toBlankIfEmpty(
          statement.nonConsolidatedInductoryCode,
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
            noncurrentLiability: NumberUtil.toNumberOrDefault(
              balanceSheetRatio?.noncurrentLiability,
            ),
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
    });
  }
}
