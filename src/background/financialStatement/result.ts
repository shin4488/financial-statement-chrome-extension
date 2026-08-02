import { FinancialReportsQuery } from '@/__generated__/graphql';

// codegenの生成型から導出し、手書きしない（スキーマ変更時に型ズレが起きない）。
// チャート部分（balanceSheet/profitLoss/cashFlow）は共有チャートキット
// （@/shared/financialCharts）の構造的型と構造が一致するため、変換なしでそのまま渡せる
export type FinancialStatementResult = FinancialReportsQuery['financialReports'][number];
