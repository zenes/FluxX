import { NextResponse } from 'next/server';
import yahooFinanceDefault from 'yahoo-finance2';

const yahooFinance = typeof yahooFinanceDefault === 'function'
    // @ts-ignore
    ? new yahooFinanceDefault()
    : yahooFinanceDefault;

export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
    try {
        // "KRW=X" is the symbol for USD to KRW exchange rate
        const quote = await yahooFinance.quote('KRW=X');

        // We expect regularMarketPrice to contain the current exchange rate
        // regularMarketChange contains the change, regularMarketChangePercent the percentage
        if (!quote || !quote.regularMarketPrice) {
            throw new Error('Could not fetch exchange rate data from Yahoo Finance');
        }

        return NextResponse.json({
            rate: quote.regularMarketPrice,
            change: quote.regularMarketChange,
            changePercent: quote.regularMarketChangePercent,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Exchange rate fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch exchange rate', details: error.message || error.toString() },
            { status: 500 }
        );
    }
}
