import { NextResponse } from 'next/server';
import yahooFinanceDefault from 'yahoo-finance2';

const yahooFinance = typeof yahooFinanceDefault === 'function'
    // @ts-ignore
    ? new yahooFinanceDefault()
    : yahooFinanceDefault;

export const revalidate = 300; // Cache for 5 minutes

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const symbol = searchParams.get('symbol');
        const range = searchParams.get('range') || '1mo';

        if (!symbol) {
            return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
        }

        let period1 = new Date();
        switch (range) {
            case '1d':
                period1.setDate(period1.getDate() - 1);
                break;
            case '5d':
            case '1w':
                period1.setDate(period1.getDate() - 7);
                break;
            case '3mo':
            case '3m':
                period1.setMonth(period1.getMonth() - 3);
                break;
            case '6mo':
            case '6m':
                period1.setMonth(period1.getMonth() - 6);
                break;
            case '1y':
                period1.setFullYear(period1.getFullYear() - 1);
                break;
            case '5y':
                period1.setFullYear(period1.getFullYear() - 5);
                break;
            case '1mo':
            case '1m':
            default:
                period1.setMonth(period1.getMonth() - 1);
                break;
        }

        let intervalValue = '1d';
        if (range === '1d' || range === '5d' || range === '1w') intervalValue = '15m';
        else if (range === '5y') intervalValue = '1wk';

        const queryOptions = {
            period1,
            period2: new Date(),
            interval: intervalValue as any,
        };

        // @ts-ignore
        const result = await yahooFinance.historical(symbol, queryOptions);

        const formattedData = result.map((item: any) => ({
            time: item.date instanceof Date
                ? item.date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
                : new Date(item.date).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
            date: item.date,
            price: item.close || item.open || 0,
            volume: item.volume || 0
        })).filter((item: any) => item.price > 0);

        return NextResponse.json({ chartData: formattedData });

    } catch (error: any) {
        console.error('Stock history fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stock history', details: error.message || error.toString() },
            { status: 500 }
        );
    }
}
