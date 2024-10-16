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
  if (!(urlHostName in validSiteClassHash)) {
    return;
  }

  return validSiteClassHash[urlHostName as keyof typeof validSiteClassHash];
};
