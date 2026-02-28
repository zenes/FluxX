import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const tickersParam = searchParams.get('tickers');

    if (!tickersParam) {
        return NextResponse.json({ error: 'Tickers parameter is required' }, { status: 400 });
    }

    const tickers = tickersParam.split(',').map(t => t.trim().toUpperCase());

    try {
        const newsPromises = tickers.map(async (ticker) => {
            try {
                // Yahoo Finance RSS Feed URL
                const feedUrl = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${ticker}`;
                const feed = await parser.parseURL(feedUrl);

                return feed.items.map(item => ({
                    title: item.title,
                    link: item.link,
                    pubDate: item.pubDate,
                    guid: item.guid,
                    ticker: ticker,
                    sourceName: 'Yahoo Finance'
                }));
            } catch (err) {
                console.error(`Failed to fetch news for ${ticker}:`, err);
                return [];
            }
        });

        const allNewsResults = await Promise.all(newsPromises);
        let combinedNews = allNewsResults.flat();

        // Sort by date (descending)
        combinedNews.sort((a, b) => {
            const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
            const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
            return dateB - dateA;
        });

        // Limit to top 20 items
        combinedNews = combinedNews.slice(0, 20);

        return NextResponse.json({ items: combinedNews });
    } catch (error) {
        console.error('News API error:', error);
        return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
    }
}
