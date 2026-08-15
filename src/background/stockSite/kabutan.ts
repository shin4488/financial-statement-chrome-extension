import StringUtil from '@/utils/stringUtil';
import { extractStockCode } from './stockCode';
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
    return extractStockCode(this.searchParams.get('code'));
  }
}
