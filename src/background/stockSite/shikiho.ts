import StringUtil from '@/utils/stringUtil';
import { extractStockCode, stockCodeSegmentAfter } from './stockCode';
import { StockSite } from './stockSite';

export default class Shikiho implements StockSite {
  constructor(readonly pathname: string, readonly searchParams: URLSearchParams) {}

  isValid(): boolean {
    const isStockPage = this.pathname.startsWith('/stocks/');
    const hasStockCode = !StringUtil.isEmpty(this.replaceForStockCode());
    return isStockPage && hasStockCode;
  }

  getStockCode(): string {
    return this.replaceForStockCode();
  }

  private replaceForStockCode(): string {
    return extractStockCode(stockCodeSegmentAfter(this.pathname, 'stocks'));
  }
}
