import StringUtil from '@/app/plugins/utils/stringUtil';
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
    return this.pathname.replaceAll(/[^0-9]/gi, '');
  }
}
