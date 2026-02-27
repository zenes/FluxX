'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ExternalLink, Loader2, ChevronDown, ChevronUp, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MarketAsset } from './typesV2';

interface NewsItem {
    title: string;
    pubDate: string;
    link: string;
    guid: string;
    author: string;
    thumbnail: string;
    description: string;
    content: string;
    enclosure: any;
    categories: string[];
    sourceName?: string;
    ticker?: string;
}

interface InvestmentNewsCardV2Props {
    myStocks: MarketAsset[];
}

// Tiers: 1 (News Thumbnail) -> 2 (FMP Logo) -> 3 (Ticker Box)
const FMP_API_KEY = "demo"; // Placeholder API key

export default function InvestmentNewsCardV2({ myStocks }: InvestmentNewsCardV2Props) {
    const [newsList, setNewsList] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

    const fetchNews = useCallback(async () => {
        if (!myStocks || myStocks.length === 0) {
            setNewsList([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Take top 4 stocks
            const fetchPromises = myStocks.slice(0, 4).map(async (stock) => {
                const keyword = stock.name?.split('(')[0]?.trim();
                if (!keyword) return [];
                const timestamp = Date.now();
                const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=ko&gl=KR&ceid=KR:ko&t=${timestamp}`;
                const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&t=${timestamp}`;

                try {
                    const response = await fetch(proxyUrl);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                    const data = await response.json();
                    if (data?.status === 'ok' && Array.isArray(data?.items)) {
                        // Filter items older than 7 days immediately
                        const sevenDaysAgo = new Date();
                        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                        return data.items
                            .filter((item: any) => new Date(item.pubDate) >= sevenDaysAgo)
                            .map((item: any) => ({
                                ...item,
                                thumbnail: item?.thumbnail || item?.enclosure?.link || (item?.description?.match(/<img[^>]+src="([^">]+)"/)?.[1] || ''),
                                sourceName: keyword,
                                ticker: stock.ticker
                            }));
                    }
                    return [];
                } catch (err) {
                    console.error(`Failed to fetch news for ${keyword}:`, err);
                    return [];
                }
            });

            const results = await Promise.all(fetchPromises);

            // Logic: 3 items per stock preference, but fill shortfall from active stocks
            const targetTotal = results.length * 3;
            let fairList: NewsItem[] = [];
            let overflowList: NewsItem[] = [];

            results.forEach(stockNews => {
                fairList.push(...stockNews.slice(0, 3));
                overflowList.push(...stockNews.slice(3));
            });

            // Sort overflow to take the freshest ones if we have a shortfall
            overflowList.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

            const shortfall = Math.max(0, targetTotal - fairList.length);
            const finalCombined = [...fairList, ...overflowList.slice(0, shortfall)];

            // Final sort by latest time
            finalCombined.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

            // Limit to 15 items total for the expanded view
            setNewsList(finalCombined.slice(0, 15));
        } catch (err) {
            console.error('Total news fetch failed:', err);
            setError('뉴스를 불러올 수 없습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [myStocks]);

    useEffect(() => {
        fetchNews();
    }, [fetchNews]);

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHrs < 1) return '방금 전';
        if (diffHrs < 24) return `${diffHrs}시간 전`;
        return `${Math.floor(diffHrs / 24)}일 전`;
    };

    const displayedNews = isExpanded ? newsList : newsList.slice(0, 3);

    return (
        <div className="bg-white dark:bg-[#1A1A1E] rounded-[24px] shadow-sm border border-zinc-100 dark:border-white/5 overflow-hidden flex flex-col pt-5">
            {/* Header */}
            <div className="px-5 mb-4 flex items-center justify-between">
                <h2 className="text-[17px] font-black text-zinc-900 dark:text-white tracking-tight">
                    최신 투자 뉴스
                </h2>
                <button
                    onClick={fetchNews}
                    disabled={isLoading}
                    className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all disabled:opacity-50"
                >
                    {isLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <RefreshCw className="size-4" />
                    )}
                </button>
            </div>

            {/* News List */}
            <div className="flex flex-col">
                {isLoading && newsList.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="size-8 text-zinc-200 dark:text-zinc-800 animate-spin" />
                        <p className="text-sm font-bold text-zinc-400">뉴스를 불러오는 중입니다...</p>
                    </div>
                ) : error ? (
                    <div className="py-20 text-center px-5 flex flex-col items-center gap-2">
                        <p className="text-sm font-bold text-red-500 dark:text-red-400">{error}</p>
                        <button
                            onClick={fetchNews}
                            className="text-xs font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-white underline underline-offset-4"
                        >
                            다시 시도
                        </button>
                    </div>
                ) : newsList.length > 0 ? (
                    <>
                        <div className="divide-y divide-zinc-100 dark:divide-white/5">
                            {displayedNews.map((news) => (
                                <button
                                    key={news.guid}
                                    onClick={() => setSelectedNews(news)}
                                    className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors group"
                                >
                                    <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                                        <h3 className="text-[15px] font-bold text-zinc-900 dark:text-zinc-200 leading-[1.4] line-clamp-2 group-hover:text-zinc-950 dark:group-hover:text-white">
                                            {news.title}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-black text-zinc-400 uppercase tracking-wider">
                                                {news.sourceName}
                                            </span>
                                            <span className="size-0.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                            <span className="text-[11px] font-bold text-zinc-400">
                                                {formatTime(news.pubDate)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Thumbnail with Fallback */}
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 dark:bg-white/5 shrink-0 border border-zinc-100 dark:border-white/5 relative flex items-center justify-center">
                                        {/* Tier 1: News Thumbnail */}
                                        {news.thumbnail && (
                                            <img
                                                src={news.thumbnail}
                                                alt=""
                                                className="tier-1-img size-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    if (e.currentTarget.parentElement) {
                                                        const tier2 = e.currentTarget.parentElement.querySelector('.tier-2-img');
                                                        if (tier2) (tier2 as HTMLElement).style.display = 'block';
                                                        else {
                                                            const tier3 = e.currentTarget.parentElement.querySelector('.tier-3-fallback');
                                                            if (tier3) (tier3 as HTMLElement).style.display = 'flex';
                                                        }
                                                    }
                                                }}
                                            />
                                        )}

                                        {/* Tier 2: FMP Official Logo */}
                                        <img
                                            src={`https://financialmodelingprep.com/image-stock/${news.ticker}.png?apikey=${FMP_API_KEY}`}
                                            alt=""
                                            className={cn(
                                                "tier-2-img size-full object-contain p-2 bg-white",
                                                news.thumbnail ? "hidden" : "block"
                                            )}
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                if (e.currentTarget.parentElement) {
                                                    const tier3 = e.currentTarget.parentElement.querySelector('.tier-3-fallback');
                                                    if (tier3) (tier3 as HTMLElement).style.display = 'flex';
                                                }
                                            }}
                                        />

                                        {/* Tier 3: Ticker Text Box */}
                                        <div className="tier-3-fallback hidden size-full items-center justify-center">
                                            <span className="font-bold text-gray-500 dark:text-zinc-500 text-lg uppercase tracking-wider">
                                                {news.ticker || news.sourceName?.charAt(0)}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Footer (Accordion Toggle) */}
                        <div className="border-t border-zinc-100 dark:border-white/5 px-4 py-3 flex items-center justify-end">
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="flex items-center gap-1 text-[13px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                            >
                                {isExpanded ? (
                                    <>접기 <ChevronUp className="size-4" /></>
                                ) : (
                                    <>더보기 <ChevronDown className="size-4" /></>
                                )}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="py-20 text-center text-zinc-400 font-bold border-2 border-dashed border-zinc-50 dark:border-white/5 mx-5 mb-5 rounded-3xl">
                        관련 뉴스가 없습니다.
                    </div>
                )}
            </div>

            {/* News Detail Bottom Sheet */}
            <AnimatePresence>
                {selectedNews && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedNews(null)}
                            className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
                        />

                        {/* Sheet */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-x-0 bottom-0 bg-white dark:bg-[#1A1A1E] rounded-t-[32px] z-[101] max-h-[90vh] overflow-hidden flex flex-col"
                        >
                            {/* Handle & Close */}
                            <div className="relative pt-3 pb-2 flex justify-center shrink-0">
                                <div className="w-12 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                                <button
                                    onClick={() => setSelectedNews(null)}
                                    className="absolute right-6 top-4 p-2 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <div className="overflow-y-auto pb-32">
                                {/* 3-Tier Thumbnail Logic in Detail Sheet */}
                                <div className="px-6 mb-6">
                                    <div className="w-full h-48 rounded-2xl overflow-hidden border border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900 relative flex items-center justify-center">
                                        {/* Tier 1 */}
                                        {selectedNews.thumbnail && (
                                            <img
                                                src={selectedNews.thumbnail}
                                                alt=""
                                                className="tier-1-detail w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    if (e.currentTarget.parentElement) {
                                                        const t2 = e.currentTarget.parentElement.querySelector('.tier-2-detail');
                                                        if (t2) (t2 as HTMLElement).style.display = 'block';
                                                        else {
                                                            const t3 = e.currentTarget.parentElement.querySelector('.tier-3-detail');
                                                            if (t3) (t3 as HTMLElement).style.display = 'flex';
                                                        }
                                                    }
                                                }}
                                            />
                                        )}

                                        {/* Tier 2 */}
                                        <img
                                            src={`https://financialmodelingprep.com/image-stock/${selectedNews.ticker}.png?apikey=${FMP_API_KEY}`}
                                            alt=""
                                            className={cn(
                                                "tier-2-detail w-full h-full object-contain p-4 bg-white",
                                                selectedNews.thumbnail ? "hidden" : "block"
                                            )}
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                if (e.currentTarget.parentElement) {
                                                    const t3 = e.currentTarget.parentElement.querySelector('.tier-3-detail');
                                                    if (t3) (t3 as HTMLElement).style.display = 'flex';
                                                }
                                            }}
                                        />

                                        {/* Tier 3 */}
                                        <div className="tier-3-detail hidden size-full items-center justify-center bg-gray-100 dark:bg-white/5">
                                            <span className="font-bold text-gray-500 dark:text-zinc-500 text-3xl uppercase tracking-widest">
                                                {selectedNews.ticker}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="px-6">
                                    <div className="mb-4">
                                        <span className="text-[12px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-50 dark:bg-white/5 px-3 py-1 rounded-full">
                                            {selectedNews.sourceName}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white leading-[1.3] mb-6 tracking-tight">
                                        {selectedNews.title}
                                    </h2>
                                    <div className="text-[15px] font-medium text-zinc-600 dark:text-zinc-400 leading-[1.7] whitespace-pre-wrap">
                                        {selectedNews.description?.replace(/<[^>]*>/g, '') || selectedNews.content?.replace(/<[^>]*>/g, '') || '상세 내용이 없습니다.'}
                                    </div>
                                </div>
                            </div>

                            {/* Sticky Button */}
                            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-white dark:from-[#1A1A1E] via-white/90 dark:via-[#1A1A1E]/90 to-transparent">
                                <a
                                    href={selectedNews.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full bg-zinc-900 dark:bg-white text-white dark:text-black h-14 rounded-2xl font-black text-[15px] shadow-xl shadow-zinc-200 dark:shadow-none active:scale-[0.98] transition-all"
                                >
                                    기사 원문 보기 <ExternalLink className="size-4" />
                                </a>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
