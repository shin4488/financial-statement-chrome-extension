import Kabutan from './kabutan';
import Minkabu from './minkabu';
import YahooFinance from './yahooFinance';
import Shikiho from './shikiho';
import BuffettCode from './buffettCode';
import Rakuten from './rakuten';
import { extractStockCode, stockCodeSegmentAfter } from './stockCode';

const sp = (query: string) => new URLSearchParams(query);

describe('extractStockCode', () => {
  test.each([
    ['2168', '2168'],
    ['391A', '391A'],
    ['391a', '391A'], // 小文字は正規化する
    ['998407', ''], // 指数などの6桁は証券コードではない
    ['391', ''],
    ['21680', ''],
    ['ABCD', ''],
    ['', ''],
    [undefined, ''],
    [null, ''],
  ])('extractStockCode(%p) = %p', (candidate, expected) => {
    expect(extractStockCode(candidate as string | undefined | null)).toBe(expected);
  });
});

describe('stockCodeSegmentAfter', () => {
  test.each([
    ['/stock/391A', 'stock', '391A'],
    ['/stock/2168/dividend', 'stock', '2168'],
    ['/stock/', 'stock', ''],
    ['/news/2168', 'stock', ''],
    ['/', 'stock', ''],
  ])('%s (prefix=%s) -> %p', (pathname, prefix, expected) => {
    expect(stockCodeSegmentAfter(pathname, prefix)).toBe(expected);
  });
});

describe('Kabutan', () => {
  test.each([
    ['/stock/', 'code=2168', true, '2168'],
    ['/stock/chart', 'code=2168', true, '2168'],
    ['/stock/', 'code=391A', true, '391A'],
    ['/news/', 'code=2168', false, ''],
    ['/stock/', '', false, ''],
    ['/stock/', 'code=abc', false, ''], // コード形式でない値は無効
  ])('%s?%s -> valid=%s code=%s', (path, query, valid, code) => {
    const site = new Kabutan(path, sp(query));
    expect(site.isValid()).toBe(valid);
    if (valid) {
      expect(site.getStockCode()).toBe(code);
    }
  });
});

describe('Minkabu', () => {
  test.each([
    ['/stock/2168', true, '2168'],
    ['/stock/391A', true, '391A'], // 英数字コード
    ['/stock/2168/dividend', true, '2168'],
    ['/stock/2168/news2', true, '2168'], // 後続セグメントの数字が混入しない
    ['/stock/', false, ''],
    ['/', false, ''],
    ['/news/2168', false, ''],
  ])('%s -> valid=%s code=%s', (path, valid, code) => {
    const site = new Minkabu(path, sp(''));
    expect(site.isValid()).toBe(valid);
    if (valid) {
      expect(site.getStockCode()).toBe(code);
    }
  });
});

describe('YahooFinance', () => {
  test.each([
    ['/quote/2168.T', true, '2168'],
    ['/quote/391A.T', true, '391A'], // 英数字コード
    ['/quote/2168.T/chart', true, '2168'],
    ['/quote/998407.O', false, ''], // 指数ページは銘柄ではない
    ['/quote/', false, ''],
    ['/', false, ''],
  ])('%s -> valid=%s code=%s', (path, valid, code) => {
    const site = new YahooFinance(path, sp(''));
    expect(site.isValid()).toBe(valid);
    if (valid) {
      expect(site.getStockCode()).toBe(code);
    }
  });
});

describe('Shikiho', () => {
  test.each([
    ['/stocks/2168', true, '2168'],
    ['/stocks/391A', true, '391A'], // 英数字コード
    ['/stocks/', false, ''],
    ['/news/2168', false, ''],
  ])('%s -> valid=%s code=%s', (path, valid, code) => {
    const site = new Shikiho(path, sp(''));
    expect(site.isValid()).toBe(valid);
    if (valid) {
      expect(site.getStockCode()).toBe(code);
    }
  });
});

describe('BuffettCode', () => {
  test.each([
    ['/company/2168', true, '2168'],
    ['/company/391A', true, '391A'], // 英数字コード
    ['/company/2168/library', true, '2168'],
    ['/company/', false, ''],
    ['/', false, ''],
  ])('%s -> valid=%s code=%s', (path, valid, code) => {
    const site = new BuffettCode(path, sp(''));
    expect(site.isValid()).toBe(valid);
    if (valid) {
      expect(site.getStockCode()).toBe(code);
    }
  });
});

describe('Rakuten', () => {
  test.each([
    ['ric=2168.T', '2168'],
    ['ric=391A.T', '391A'], // 英数字コード
  ])('未ログイン: %s -> %s', (query, expected) => {
    const site = new Rakuten('/web/market/search/quote.html', sp(query));
    expect(site.isValid()).toBe(true);
    expect(site.getStockCode()).toBe(expected);
  });
  test.each([
    ['21680', '2168'],
    ['72030', '7203'],
    ['14000', '1400'], // 末尾の0は1つだけ除去される（EDINET5桁 -> 証券コード）
    ['391A0', '391A'], // 英数字コード
  ])('ログイン: dscrCd=%s -> %s', (dscrCd, expected) => {
    const site = new Rakuten('/app/info_jp_prc_stock.do', sp(`dscrCd=${dscrCd}`));
    expect(site.isValid()).toBe(true);
    expect(site.getStockCode()).toBe(expected);
  });
  test('対象外パスは無効', () => {
    expect(new Rakuten('/web/other', sp('ric=2168.T')).isValid()).toBe(false);
  });
  test('コード取得できなければ無効', () => {
    expect(new Rakuten('/web/market/search/quote.html', sp('')).isValid()).toBe(false);
    expect(new Rakuten('/web/market/search/quote.html', sp('ric=ABC')).isValid()).toBe(false);
  });
});
