import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import Parser from 'rss-parser';

const yahooFinance = new YahooFinance();
const parser = new Parser();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const tickersParam = searchParams.get('tickers');
    const region = searchParams.get('region') || 'ALL'; // KR, US, ALL

    if (!tickersParam) {
        return NextResponse.json({ error: 'Tickers parameter is required' }, { status: 400 });
    }

    const tickers = tickersParam.split(',').map(t => t.trim().toUpperCase());

    try {
        const newsItems: any[] = [];

        // US (Yahoo Finance) News via Search API (more robust than RSS)
        if (region === 'US' || region === 'ALL') {
            const usPromises = tickers.map(async (ticker) => {
                try {
                    let yTicker = ticker;
                    if (/^\d{6}$/.test(ticker)) {
                        yTicker = `${ticker}.KS`;
                    }

                    const searchResults = await yahooFinance.search(yTicker, { newsCount: 10 });
                    return (searchResults.news || []).map((item: any) => ({
                        title: item.title,
                        link: item.link,
                        pubDate: item.publisherDate || item.pubDate, // Yahoo search uses publisherDate
                        guid: item.uuid || item.link,
                        ticker: ticker,
                        sourceName: item.publisher || 'Yahoo Finance',
                        region: 'US'
                    }));
                } catch (err) {
                    console.error(`Yahoo Search failed for ${ticker}:`, err);
                    return [];
                }
            });
            const usResults = await Promise.all(usPromises);
            newsItems.push(...usResults.flat());
        }

        // KR (Google News) News
        if (region === 'KR' || region === 'ALL') {
            const krPromises = tickers.map(async (ticker) => {
                try {
                    // For KR, we use Google News with Korean settings
                    // We search by ticker and some common Korean contexts if possible, 
                    // but usually tickers like '005930' work well in Google News KR
                    const feedUrl = `https://news.google.com/rss/search?q=${ticker}&hl=ko&gl=KR&ceid=KR:ko`;
                    const feed = await parser.parseURL(feedUrl);
                    return feed.items.map(item => ({
                        title: item.title,
                        link: item.link,
                        pubDate: item.pubDate,
                        guid: item.guid,
                        ticker: ticker,
                        sourceName: item.source || '국내 뉴스',
                        region: 'KR'
                    }));
                } catch (err) {
                    return [];
                }
            });
            const krResults = await Promise.all(krPromises);
            newsItems.push(...krResults.flat());
        }

        // De-duplicate by guid/link
        const seen = new Set();
        const uniqueNews = newsItems.filter(item => {
            const key = item.guid || item.link;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        // Sort by date (descending)
        uniqueNews.sort((a, b) => {
            const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
            const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
            return dateB - dateA;
        });

        return NextResponse.json({ items: uniqueNews.slice(0, 40) });
    } catch (error) {
        console.error('News API error:', error);
        return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
    }
}
