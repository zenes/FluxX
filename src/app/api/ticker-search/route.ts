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
        // Use localized search with validation disabled to handle schema variations
        const result = await yahooFinance.search(query, {
            quotesCount: 8,
            // @ts-ignore
            lang: 'ko-KR',
            // @ts-ignore
            region: 'KR'
        }, { validateResult: false }) as any;

        const quotes = (result.quotes || []) as any[];

        // Filter for relevant types: Equities, ETFs, Indices, Currencies
        const relevantQuotes = quotes.filter((q: any) =>
            q.quoteType === 'EQUITY' ||
            q.quoteType === 'ETF' ||
            q.quoteType === 'INDEX' ||
            q.quoteType === 'CURRENCY'
        );

        return NextResponse.json({
            results: relevantQuotes.map((q: any) => ({
                symbol: q.symbol,
                // Prioritize longname for localized (Korean) names
                shortname: q.longname || q.shortname || q.symbol,
                exchange: q.exchange,
                quoteType: q.quoteType
            }))
        });
    } catch (error) {
        console.error('Ticker search failed:', error);
        return NextResponse.json({ error: (error as any).message || 'Search failed', results: [] }, { status: 500 });
    }
}
