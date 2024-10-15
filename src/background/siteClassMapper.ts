import Minkabu from './stockSite/minkabu';
import YahooFinance from './stockSite/yahooFinance';

const validSiteClassHash = {
  'minkabu.jp': Minkabu,
  'finance.yahoo.co.jp': YahooFinance,
};

export const getValidSiteInstance = (urlHostName: string) => {
  if (!(urlHostName in validSiteClassHash)) {
    return;
  }

  return validSiteClassHash[urlHostName as keyof typeof validSiteClassHash];
};
