import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

const cache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 60 * 1000; // 1 minute

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');

    if (!symbolsParam) {
        return NextResponse.json({ error: 'Symbols parameter is required' }, { status: 400 });
    }

    const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());
    const now = Date.now();

    // Try to serve from cache
    const resultsMap: Record<string, any> = {};
    const symbolsToFetch: string[] = [];

    symbols.forEach(s => {
        if (cache[s] && (now - cache[s].timestamp < CACHE_TTL)) {
            resultsMap[s] = cache[s].data;
        } else {
            symbolsToFetch.push(s);
        }
    });

    if (symbolsToFetch.length === 0) {
        return NextResponse.json({ quotes: resultsMap });
    }

    try {
        // Fetch only missing quotes
        const results = await yahooFinance.quote(symbolsToFetch);
        const quotesArray = Array.isArray(results) ? results : [results];

        quotesArray.forEach(q => {
            if (q && q.symbol) {
                const data = {
                    price: q.regularMarketPrice || 0,
                    change: q.regularMarketChange || 0,
                    changePercent: q.regularMarketChangePercent || 0,
                    shortName: q.shortName || q.longName || q.symbol,
                    currency: q.currency || 'USD',
                };
                resultsMap[q.symbol] = data;
                cache[q.symbol] = { data, timestamp: now };
            }
        });

        return NextResponse.json({ quotes: resultsMap });
    } catch (error) {
        console.error('Failed to fetch stock prices:', error);
        return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 });
    }
}
