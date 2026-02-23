import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');

    if (!symbolsParam) {
        return NextResponse.json({ error: 'Symbols parameter is required' }, { status: 400 });
    }

    const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());

    try {
        // Fetch quotes for all requested symbols
        const results = await yahooFinance.quote(symbols);

        // Convert array to a symbol-keyed dictionary for easier frontend access
        const quotesMap: Record<string, { price: number, change: number, changePercent: number, shortName: string }> = {};

        // Make sure to handle single result (object) vs multiple results (array) uniformly
        const quotesArray = Array.isArray(results) ? results : [results];

        quotesArray.forEach(q => {
            if (q && q.symbol) {
                quotesMap[q.symbol] = {
                    price: q.regularMarketPrice || 0,
                    change: q.regularMarketChange || 0,
                    changePercent: q.regularMarketChangePercent || 0,
                    shortName: q.shortName || q.longName || q.symbol,
                };
            }
        });

        return NextResponse.json({ quotes: quotesMap });
    } catch (error) {
        console.error('Failed to fetch stock prices:', error);
        return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 });
    }
}
