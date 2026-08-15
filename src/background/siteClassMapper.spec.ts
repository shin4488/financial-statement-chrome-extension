import { getValidSiteInstance } from './siteClassMapper';
import BuffettCode from './stockSite/buffettCode';
import Kabutan from './stockSite/kabutan';
import Minkabu from './stockSite/minkabu';
import Rakuten from './stockSite/rakuten';
import Shikiho from './stockSite/shikiho';
import YahooFinance from './stockSite/yahooFinance';

describe('getValidSiteInstance', () => {
  test.each([
    ['kabutan.jp', Kabutan],
    ['minkabu.jp', Minkabu],
    ['finance.yahoo.co.jp', YahooFinance],
    ['shikiho.toyokeizai.net', Shikiho],
    ['www.buffett-code.com', BuffettCode],
    ['www.rakuten-sec.co.jp', Rakuten],
    ['member.rakuten-sec.co.jp', Rakuten],
  ])('%s -> 対応クラス', (host, klass) => {
    expect(getValidSiteInstance(host)).toBe(klass);
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
