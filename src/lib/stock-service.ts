import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

// Global in-memory cache
const cache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 60 * 1000; // 1 minute

export interface StockQuote {
    price: number;
    change: number;
    changePercent: number;
    shortName: string;
    currency: string;
    sparkline: number[];
}

/**
 * Fetches stock prices and sparklines for a set of symbols.
 * Handles fallbacks for missing prices and implements a short-lived cache.
 */
export async function getStockQuotes(symbols: string[]): Promise<Record<string, StockQuote>> {
    const now = Date.now();
    const resultsMap: Record<string, StockQuote> = {};
    const symbolsToFetch: string[] = [];

    // 1. Check cache
    symbols.forEach(s => {
        const normalized = s.toUpperCase();
        if (cache[normalized] && (now - cache[normalized].timestamp < CACHE_TTL)) {
            resultsMap[normalized] = cache[normalized].data;
        } else {
            symbolsToFetch.push(normalized);
        }
    });

    if (symbolsToFetch.length === 0) {
        console.log(`[STOCK-SERVICE] Served ${Object.keys(resultsMap).length} quotes from CACHE.`);
        return resultsMap;
    }

    try {
        // 2. Fetch missing quotes from Yahoo Finance
        const results = await yahooFinance.quote(symbolsToFetch, {
            // @ts-ignore
            lang: 'ko-KR',
            // @ts-ignore
            region: 'KR'
        }, { validateResult: false });

        const quotesArray = Array.isArray(results) ? results : [results];

        // 3. Fetch sparklines (1d history) in parallel
        const sparklinesResults = await Promise.all(
            symbolsToFetch.map(async (sym) => {
                try {
                    const period1 = new Date();
                    period1.setDate(period1.getDate() - 1);

                    const chartData = await yahooFinance.chart(sym, {
                        period1,
                        period2: new Date(),
                        interval: '30m',
                    });

                    const quotes = chartData.quotes || [];
                    const prices = quotes
                        .map((q: any) => q.close || q.open)
                        .filter((p: number | undefined): p is number => !!p);

                    return { symbol: sym, sparkline: prices };
                } catch (e) {
                    // Suppress excessive logging for sparkline failures
                    return { symbol: sym, sparkline: [] };
                }
            })
        );

        const sparklineMap: Record<string, number[]> = {};
        sparklinesResults.forEach(r => {
            sparklineMap[r.symbol] = r.sparkline;
        });

        // 4. Map and store in cache
        quotesArray.forEach(q => {
            if (q && q.symbol) {
                const sym = q.symbol.toUpperCase();
                const fetchedPrice = q.regularMarketPrice || q.navPrice || q.bid || q.ask || 0;

                // Zero-Price Guard
                if (fetchedPrice === 0 && cache[sym]) {
                    resultsMap[sym] = cache[sym].data;
                    return;
                }

                const quoteData: StockQuote = {
                    price: fetchedPrice,
                    change: q.regularMarketChange || 0,
                    changePercent: q.regularMarketChangePercent || 0,
                    shortName: q.longName || q.shortName || q.symbol,
                    currency: q.currency || 'USD',
                    sparkline: sparklineMap[sym] || []
                };

                resultsMap[sym] = quoteData;
                cache[sym] = { data: quoteData, timestamp: now };
            }
        });

        console.log(`[STOCK-SERVICE] Fetched ${symbolsToFetch.length} new quotes from Yahoo.`);
        return resultsMap;

    } catch (error) {
        console.error('[STOCK-SERVICE] Critical failure fetching quotes:', error);
        // Fallback to cache for anything that failed if available
        symbolsToFetch.forEach(sym => {
            if (cache[sym]) resultsMap[sym] = cache[sym].data;
        });
        return resultsMap;
    }
}
