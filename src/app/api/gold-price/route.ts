import { NextResponse } from 'next/server';
import yahooFinanceDefault from 'yahoo-finance2';

const yahooFinance = typeof yahooFinanceDefault === 'function'
    // @ts-ignore
    ? new yahooFinanceDefault()
    : yahooFinanceDefault;

export const revalidate = 60; // Cache for 60 seconds

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'global'; // 'global' or 'krx'

        // GC=F: Gold Futures (USD)
        // 411060.KS: ACE KRX금현물 (KRW)
        const symbol = type === 'krx' ? '411060.KS' : 'GC=F';

        // @ts-ignore
        const quote = await yahooFinance.quote(symbol);

        if (!quote || !quote.regularMarketPrice) {
            throw new Error(`Could not fetch data for ${symbol}`);
        }

        return NextResponse.json({
            price: quote.regularMarketPrice,
            change: quote.regularMarketChange,
            changePercent: quote.regularMarketChangePercent,
            symbol: symbol,
            currency: type === 'krx' ? 'KRW' : 'USD',
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Gold price fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch gold price', details: error.message || error.toString() },
            { status: 500 }
        );
    }
}
