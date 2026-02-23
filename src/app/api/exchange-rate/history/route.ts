import { NextResponse } from 'next/server';
import yahooFinanceDefault from 'yahoo-finance2';

const yahooFinance = typeof yahooFinanceDefault === 'function'
    // @ts-ignore
    ? new yahooFinanceDefault()
    : yahooFinanceDefault;

export const revalidate = 300; // Cache historical data for 5 minutes

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '1mo'; // 1wk, 1mo, 3mo

        // Yahoo Finance API options mapping
        let period1 = new Date();
        switch (range) {
            case '1w':
                period1.setDate(period1.getDate() - 7);
                break;
            case '3m':
                period1.setMonth(period1.getMonth() - 3);
                break;
            case '6m':
                period1.setMonth(period1.getMonth() - 6);
                break;
            case '1y':
                period1.setFullYear(period1.getFullYear() - 1);
                break;
            case '3y':
                period1.setFullYear(period1.getFullYear() - 3);
                break;
            case '5y':
                period1.setFullYear(period1.getFullYear() - 5);
                break;
            case '10y':
                period1.setFullYear(period1.getFullYear() - 10);
                break;
            case '1m':
            default:
                period1.setMonth(period1.getMonth() - 1);
                break;
        }

        let intervalValue = '1d';
        if (range === '1w') intervalValue = '15m';
        else if (range === '3y' || range === '5y') intervalValue = '1wk';
        else if (range === '10y') intervalValue = '1mo';

        const queryOptions = {
            period1,
            period2: new Date(),
            interval: intervalValue as any,
        };

        // Note: '15m' interval is valid per yahoo-finance2 types for short ranges
        // Cast queryOptions if necessary depending on strict TS configurations, 
        // but yahoo-finance2 supports these standard intervals.

        // @ts-ignore
        const result = await yahooFinance.historical('KRW=X', queryOptions);

        // Format the response for Recharts (array of objects with date and value map)
        const formattedData = result.map((item: any) => ({
            date: item.date,
            close: item.close,
            high: item.high,
            low: item.low
        })).filter((item: any) => item.close != null); // Remove empty or null days

        return NextResponse.json({
            data: formattedData,
            range: range
        });

    } catch (error: any) {
        console.error('Historical exchange rate fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch historical exchange rate', details: error.message || error.toString() },
            { status: 500 }
        );
    }
}
