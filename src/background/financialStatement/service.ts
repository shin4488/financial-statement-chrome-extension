import { FinancialReportsDocument } from '@/__generated__/graphql';
import ApolloClientService from './apolloClientService';
import { FinancialStatementResult } from './result';

export default class FinancialStatementService {
  private apolloService: ApolloClientService;

  constructor() {
    this.apolloService = new ApolloClientService();
  }

  async load(stockCode: string): Promise<FinancialStatementResult[]> {
    const { data } = await this.apolloService.query(FinancialReportsDocument, {
      stockCodes: [stockCode],
    });

    // チャート構造はAPIの返却値をそのまま流す契約（科目・形式の解釈はバックエンド側の責務）
    return data?.financialReports ?? [];
  }
}
