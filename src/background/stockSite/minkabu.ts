import StringUtil from '@/app/plugins/utils/stringUtil';
import { StockSite } from './stockSite';

export default class Minkabu implements StockSite {
  constructor(readonly pathname: string, readonly searchParams: URLSearchParams) {}

  isValid(): boolean {
    const isStockPage = this.pathname.startsWith('/stock/');
    const hasStockCode = !StringUtil.isEmpty(this.pathname.replaceAll(this.regexToReplace(), ''));
    return isStockPage && hasStockCode;
  }

  getStockCode(): string {
    return this.pathname.replaceAll(this.regexToReplace(), '');
  }

  private regexToReplace(): RegExp {
    return /[^0-9]/gi;
  }
}
