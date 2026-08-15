import BuffettCode from './stockSite/buffettCode';
import Kabutan from './stockSite/kabutan';
import Minkabu from './stockSite/minkabu';
import Rakuten from './stockSite/rakuten';
import Shikiho from './stockSite/shikiho';
import YahooFinance from './stockSite/yahooFinance';

const validSiteClassHash = {
  'www.buffett-code.com': BuffettCode,
  'minkabu.jp': Minkabu,
  'kabutan.jp': Kabutan,
  'www.rakuten-sec.co.jp': Rakuten,
  'member.rakuten-sec.co.jp': Rakuten,
  'shikiho.toyokeizai.net': Shikiho,
  'finance.yahoo.co.jp': YahooFinance,
};

export const getValidSiteInstance = (urlHostName: string) => {
  // hasOwnPropertyで引く: in演算子だとホスト名が"constructor"等のとき
  // Object.prototypeのメンバーが対応サイトクラス扱いになるため
  if (!Object.prototype.hasOwnProperty.call(validSiteClassHash, urlHostName)) {
    return;
  }

  return validSiteClassHash[urlHostName as keyof typeof validSiteClassHash];
};
