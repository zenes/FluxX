import { NextResponse } from 'next/server';
import { getStockQuotes } from '@/lib/stock-service';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');

    if (!symbolsParam) {
        return NextResponse.json({ error: 'Symbols parameter is required' }, { status: 400 });
    }

    const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());

    try {
        const resultsMap = await getStockQuotes(symbols);

        // Verification log for user (preserved for debugging as requested)
        console.log(`[API] Found ${Object.keys(resultsMap).length} prices:`,
            Object.entries(resultsMap).map(([s, d]: [string, any]) => `${s}: ${d.price}`).join(', ')
        );

        return NextResponse.json({ quotes: resultsMap });
    } catch (error) {
        console.error('Failed to fetch stock prices API:', error);
        return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 });
    }
}
