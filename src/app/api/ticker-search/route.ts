import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
        return NextResponse.json({ results: [] });
    }

    try {
        const result = await yahooFinance.search(query, {
            quotesCount: 5,
            newsCount: 0,
        });

        // Assert the result type as yahoo-finance2 search returns a mixed object
        // The type provided by the library can be complex, so we safely handle the quotes array
        const quotes = (result.quotes || []) as any[];

        // Filter for equities to avoid mutual funds or indices if possible
        const equities = quotes.filter((q: any) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF');

        return NextResponse.json({
            results: equities.map((q: any) => ({
                symbol: q.symbol,
                shortname: q.shortname || q.longname,
                exchange: q.exchange,
            }))
        });
    } catch (error) {
        console.error('Ticker search failed:', error);
        return NextResponse.json({ error: 'Search failed', results: [] }, { status: 500 });
    }
}
