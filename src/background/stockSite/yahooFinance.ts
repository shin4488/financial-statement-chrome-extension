import StringUtil from '@/utils/stringUtil';
import { extractStockCode, stockCodeSegmentAfter } from './stockCode';
import { StockSite } from './stockSite';

export default class YahooFinance implements StockSite {
  constructor(readonly pathname: string, readonly searchParams: URLSearchParams) {}

  isValid(): boolean {
    const isStockPage = this.pathname.startsWith('/quote/');
    const hasStockCode = !StringUtil.isEmpty(this.replaceForStockCode());
    return isStockPage && hasStockCode;
  }

  getStockCode(): string {
    return this.replaceForStockCode();
  }

  private replaceForStockCode(): string {
    // /quote/<証券コード>.<市場サフィックス> 形式。サフィックスを除いた部分がコード
    const quoteSymbol = stockCodeSegmentAfter(this.pathname, 'quote');
    return extractStockCode(quoteSymbol.split('.')[0]);
  }
}
