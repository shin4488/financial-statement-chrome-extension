import StringUtil from '@/app/plugins/utils/stringUtil';
import { StockSite } from './stockSite';

export default class Kabutan implements StockSite {
  constructor(readonly pathname: string, readonly searchParams: URLSearchParams) {}

  isValid(): boolean {
    const isStockPage = this.pathname.startsWith('/stock/');
    const hasStockCode = !StringUtil.isEmpty(this.fetchStockCode());
    return isStockPage && hasStockCode;
  }

  getStockCode(): string {
    return this.fetchStockCode();
  }

  private fetchStockCode(): string {
    return this.searchParams.get('code') || '';
  }
}
