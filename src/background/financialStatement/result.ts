import { BalanceSheetBarChartProps } from '@/app/features/balanceSheetBarChart/props';
import { CashFlowBarChartProps } from '@/app/features/cashFlowBarChart/props';
import { ProfitLossBarChartProps } from '@/app/features/profitLossBarChart/props';

export interface FinancialStatementResult {
  fiscalYearStartDate: string;
  fiscalYearEndDate: string;
  companyName: string;
  stockCode: string;
  hasConsolidatedFinancialStatement: boolean;
  consolidatedInductoryCode: string;
  nonConsolidatedInductoryCode: string;
  balanceSheet: BalanceSheetBarChartProps;
  profitLoss: ProfitLossBarChartProps;
  cashFlow: CashFlowBarChartProps;
}
