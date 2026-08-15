import StringUtil from '@/utils/stringUtil';
import { extractStockCode } from './stockCode';
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
    // どちらかで証券コードが取得できればそれを採用する。
    // 未ログイン時: ric=<証券コード>.<市場サフィックス>
    const guestStockCode = extractStockCode(this.searchParams.get('ric')?.split('.')[0]);
    if (!StringUtil.isEmpty(guestStockCode)) {
      return guestStockCode;
    }

    // ログイン時: dscrCd=EDINET5桁（証券コード+末尾0）
    return extractStockCode(this.searchParams.get('dscrCd')?.replaceAll(/0$/gi, ''));
  }
}
