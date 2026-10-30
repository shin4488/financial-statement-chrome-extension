import { getValidSiteInstance } from './siteClassMapper';

describe('getValidSiteInstance', () => {
  // 対応サイトのホスト名から、そのサイトの銘柄ページの URL の形式で証券コードを読み取る
  test.each([
    'https://kabutan.jp/stock/?code=7203',
    'https://minkabu.jp/stock/7203',
    'https://finance.yahoo.co.jp/quote/7203.T',
    'https://shikiho.toyokeizai.net/stocks/7203',
    'https://www.buffett-code.com/company/7203',
    'https://www.rakuten-sec.co.jp/web/market/search/quote.html?ric=7203.T',
    'https://member.rakuten-sec.co.jp/app/info_jp_prc_stock.do?dscrCd=72030',
  ])('%s -> 7203', (pageUrl) => {
    const { hostname, pathname, searchParams } = new URL(pageUrl);
    const Site = getValidSiteInstance(hostname);
    if (Site === undefined) {
      throw new Error(`${hostname} is not a supported site`);
    }
    const site = new Site(pathname, searchParams);
    expect(site.isValid()).toBe(true);
    expect(site.getStockCode()).toBe('7203');
  });

  test.each([['evil.com'], ['www.kabutan.jp'], ['kabutan.jp.evil.com'], ['']])(
    '%s -> undefined',
    (host) => {
      expect(getValidSiteInstance(host)).toBeUndefined();
    },
  );

  test('プロトタイプ由来のキーと同名のホスト名を対応サイト扱いしない', () => {
    expect(getValidSiteInstance('constructor')).toBeUndefined();
    expect(getValidSiteInstance('toString')).toBeUndefined();
  });
});
