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

        const rangeMap: Record<string, { range: string, interval: string }> = {
            '1d': { range: '1d', interval: '15m' },
            '1w': { range: '5d', interval: '1h' },
            '5d': { range: '5d', interval: '1h' },
            '1mo': { range: '1mo', interval: '1d' },
            '1m': { range: '1mo', interval: '1d' },
            '3mo': { range: '3mo', interval: '1d' },
            '3m': { range: '3mo', interval: '1d' },
            '6mo': { range: '6mo', interval: '1d' },
            '6m': { range: '6mo', interval: '1d' },
            'ytd': { range: 'ytd', interval: '1d' },
            '1y': { range: '1y', interval: '1d' },
            '5y': { range: '5y', interval: '1wk' }
        };

        const { range: yahooRange, interval: yahooInterval } = rangeMap[range.toLowerCase()] || rangeMap['1mo'];

        // Convert range to period1
        let period1 = new Date();
        switch (yahooRange) {
            case '1d': period1.setDate(period1.getDate() - 1); break;
            case '5d': period1.setDate(period1.getDate() - 5); break;
            case '1mo': period1.setMonth(period1.getMonth() - 1); break;
            case '3mo': period1.setMonth(period1.getMonth() - 3); break;
            case '6mo': period1.setMonth(period1.getMonth() - 6); break;
            case 'ytd': period1 = new Date(new Date().getFullYear(), 0, 1); break;
            case '1y': period1.setFullYear(period1.getFullYear() - 1); break;
            case '5y': period1.setFullYear(period1.getFullYear() - 5); break;
        }

        // @ts-ignore
        const result = await yahooFinance.chart(symbol, {
            period1,
            period2: new Date(),
            interval: yahooInterval as any,
        });

        const quotes = result.quotes || [];

        const formattedData = quotes.map((item: any) => {
            const date = new Date(item.date);
            let timeStr = '';

            if (range === '1d') {
                // For 1 day, show time (HH:mm)
                timeStr = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
            } else {
                // For 1 week and longer, show date (MM/DD)
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                timeStr = `${month}/${day}`;
            }

            return {
                time: timeStr,
                date: item.date,
                price: item.close || item.open || 0,
                volume: item.volume || 0
            };
        }).filter((item: any) => item.price > 0);

        return NextResponse.json({ chartData: formattedData });

    } catch (error: any) {
        console.error('Stock history fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stock history', details: error.message || error.toString() },
            { status: 500 }
        );
    }
}
