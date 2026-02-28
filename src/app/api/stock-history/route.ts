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

        // Helper to fetch data
        const fetchData = async (r: string, i: string) => {
            let p1 = new Date();
            switch (r) {
                case '1d': p1.setDate(p1.getDate() - 2); break; // Fetch at least 2 days to be safe
                case '5d': p1.setDate(p1.getDate() - 7); break;
                case '1mo': p1.setMonth(p1.getMonth() - 1); break;
                case '3mo': p1.setMonth(p1.getMonth() - 3); break;
                case '6mo': p1.setMonth(p1.getMonth() - 6); break;
                case 'ytd': p1 = new Date(new Date().getFullYear(), 0, 1); break;
                case '1y': p1.setFullYear(p1.getFullYear() - 1); break;
                case '5y': p1.setFullYear(p1.getFullYear() - 5); break;
                default: p1.setMonth(p1.getMonth() - 1);
            }
            // @ts-ignore
            return await yahooFinance.chart(symbol, {
                period1: p1,
                period2: new Date(),
                interval: i as any,
            });
        };

        let result = await fetchData(yahooRange, yahooInterval);
        let quotes = result.quotes || [];

        // FALLBACK: If 1d is requested but empty (weekend/holiday), try 5d to find the last trading day
        if (range.toLowerCase() === '1d' && quotes.length === 0) {
            result = await fetchData('5d', '15m'); // Use 15m for detailed intraday fallback
            quotes = result.quotes || [];
        }

        let finalQuotes = quotes;
        if (range.toLowerCase() === '1d' && quotes.length > 0) {
            // Find the most recent day in the quotes
            const lastQuoteDate = new Date(quotes[quotes.length - 1].date);
            const lastDateStr = lastQuoteDate.toDateString();

            // Filter only quotes from that specific last trading day
            finalQuotes = quotes.filter((q: any) => new Date(q.date).toDateString() === lastDateStr);
        }

        const formattedData = finalQuotes.map((item: any) => {
            const date = new Date(item.date);
            let timeStr = '';

            if (range.toLowerCase() === '1d') {
                timeStr = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
            } else {
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
