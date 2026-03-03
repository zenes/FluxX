import { koreanNameMap } from './koreanNameMap';

/**
 * Checks if a stock symbol corresponds to a Korean stock (.KS, .KQ or 6-digit numeric)
 */
export function isKoreanStock(symbol: string | null | undefined, currency?: string): boolean {
    if (!symbol) return false;

    // Explicit suffix check
    if (symbol.endsWith('.KS') || symbol.endsWith('.KQ')) return true;

    // Numeric check (Korean tickers are usually 6 digits)
    if (/^[0-9]{6}$/.test(symbol)) return true;

    // Fallback to currency
    if (currency === 'KRW') return true;

    return false;
}

/**
 * Normalizes ticker symbols for Yahoo Finance API calls
 */
export function getNormalizedTicker(symbol: string | null | undefined): string {
    if (!symbol) return '';

    // If it's a 6-digit Korean ticker without a suffix, default to .KS
    if (/^[0-9]{6}$/.test(symbol)) {
        return `${symbol}.KS`;
    }

    return symbol.toUpperCase();
}

/**
 * Robust name lookup for stocks
 */
export function getStockDisplayName(
    symbol: string | null | undefined,
    fallbackName?: string | null,
    priceData?: { shortName?: string } | null
): string {
    if (!symbol) return fallbackName || '---';

    const normalized = symbol.toUpperCase();
    const withoutSuffix = normalized.split('.')[0];

    // 1. Try exact match in map
    if (koreanNameMap[normalized]) return koreanNameMap[normalized];

    // 2. Try match without suffix (e.g. 005930 for 삼성전자)
    if (koreanNameMap[withoutSuffix]) return koreanNameMap[withoutSuffix];

    // 3. Try match with suffix if suffix is missing (e.g. 005930.KS for 삼성전자)
    if (isKoreanStock(symbol)) {
        const withKS = `${withoutSuffix}.KS`;
        const withKQ = `${withoutSuffix}.KQ`;
        if (koreanNameMap[withKS]) return koreanNameMap[withKS];
        if (koreanNameMap[withKQ]) return koreanNameMap[withKQ];
    }

    // 4. Try price data name
    if (priceData?.shortName) return priceData.shortName;

    // 5. Fallback to passed name or ticker
    return fallbackName || symbol;
}
