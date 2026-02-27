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
            quotesCount: 10,
            newsCount: 0,
        });

        const quotes = (result.quotes || []) as any[];

        // Filter for relevant types
        const relevantQuotes = quotes.filter((q: any) =>
            q.quoteType === 'EQUITY' ||
            q.quoteType === 'ETF' ||
            q.quoteType === 'INDEX' ||
            q.quoteType === 'CURRENCY'
        );

        return NextResponse.json({
            results: relevantQuotes.map((q: any) => ({
                symbol: q.symbol,
                shortname: q.shortname || q.longname || q.symbol,
                exchange: q.exchange,
                quoteType: q.quoteType
            }))
        });
    } catch (error) {
        console.error('Ticker search failed:', error);
        return NextResponse.json({ error: 'Search failed', results: [] }, { status: 500 });
    }
}
