import StringUtil from '@/app/plugins/utils/stringUtil';
import { StockSite } from './stockSite';

export default class Rakuten implements StockSite {
  constructor(readonly pathname: string, readonly searchParams: URLSearchParams) {}

  isValid(): boolean {
    // 未ログイン時のパスとログイン時のパスが異なる
    // どちらかのパスであれば有効なサイトとする
    const isStockPage =
      this.pathname.startsWith('/web/market/search/') ||
      this.pathname.startsWith('/app/info_jp_prc_stock.do');
    const hasStockCode = !StringUtil.isEmpty(this.fetchStockCode());
    return isStockPage && hasStockCode;
  }

  getStockCode(): string {
    return this.fetchStockCode();
  }

  private fetchStockCode(): string {
    // 未ログイン時の証券コードのクエリパラメータkeyとログイン時のクエリパラメータkeyが異なる
    // どちらかで証券コードが取得できればそれを採用する
    const guestStockCode = this.searchParams.get('ric')?.replaceAll(/[^0-9]/gi, '');
    if (!StringUtil.isEmpty(guestStockCode)) {
      return guestStockCode as string;
    }

    return this.searchParams.get('dscrCd')?.replaceAll(/0$/gi, '') || '';
  }
}
