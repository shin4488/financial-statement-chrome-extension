import { FinancialStatementResult } from '@/background/financialStatement/result';

export interface ChangeAutoPlayStatusAction {
  type: string;
  payload: boolean;
}

export interface ChangeFinancialStatementAction {
  type: string;
  payload: FinancialStatementResult[];
}

export interface ChangeSiteDomainAction {
  type: string;
  payload: string;
}

export interface ChangeStockCodeAction {
  type: string;
  payload: string;
}
