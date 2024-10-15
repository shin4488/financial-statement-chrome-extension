export interface StockSite {
  pathname: string;
  searchParams?: URLSearchParams;

  isValid(): boolean;
  getStockCode(): string;
}
