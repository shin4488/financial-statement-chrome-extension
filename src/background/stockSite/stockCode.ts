// 証券コードの正規形式: 4桁数字、または3桁数字+英大文字1字（2024年以降の新形式。例: 391A）
const stockCodePattern = /^[0-9]{4}$|^[0-9]{3}[A-Z]$/;

// パスセグメント・クエリ値などの候補文字列から証券コードを取り出す。
// 形式に合致しなければ空文字を返す（呼び出し側のisValidが無効と判定する）
export const extractStockCode = (candidate: string | undefined | null): string => {
  if (candidate === undefined || candidate === null) {
    return '';
  }

  const normalized = candidate.toUpperCase();
  return stockCodePattern.test(normalized) ? normalized : '';
};

// /stock/2168/news のようなpathnameから、プレフィックス直後のセグメントを取り出す。
// パス全体から数字のみを抽出すると、英数字コードが化ける・後続セグメントの数字が混入するため
export const stockCodeSegmentAfter = (pathname: string, prefixSegment: string): string => {
  const segments = pathname.split('/').filter((segment) => segment !== '');
  return segments[0] === prefixSegment ? segments[1] ?? '' : '';
};
