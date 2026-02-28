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
    onModalToggle?: (isOpen: boolean) => void;
    isHydrated?: boolean;
}

// Tiers: 1 (News Thumbnail) -> 2 (FMP Logo) -> 3 (Ticker Box)
const FMP_API_KEY = "demo"; // Placeholder API key

export default function InvestmentNewsCardV2({ myStocks, onModalToggle, isHydrated }: InvestmentNewsCardV2Props) {
    const [newsList, setNewsList] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
    const [activeRegion, setActiveRegion] = useState<'ALL' | 'KR' | 'US'>('ALL');
    const lastFetchedQuery = React.useRef<string>('');

    // Synchronize modal state with parent
    useEffect(() => {
        onModalToggle?.(!!selectedNews);
    }, [!!selectedNews, onModalToggle]);

    const fetchNews = useCallback(async () => {
        if (!myStocks || myStocks.length === 0 || !isHydrated) {
            setNewsList([]);
            setIsLoading(false);
            return;
        }

        const tickers = myStocks
            .map(s => s.ticker)
            .filter(Boolean)
            .slice(0, 5); // Limit tickers to avoid long internal URLs

        if (tickers.length === 0) {
            setNewsList([]);
            setIsLoading(false);
            return;
        }

        const query = tickers.join(',');
        const fetchKey = `${query}-${activeRegion}`;

        // Prevent redundant fetches if the query and region hasn't changed
        if (fetchKey === lastFetchedQuery.current) {
            setIsLoading(false);
            return;
        }

        lastFetchedQuery.current = fetchKey;
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/news?tickers=${encodeURIComponent(query)}&region=${activeRegion}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            if (Array.isArray(data?.items)) {
                const finalCombined = data.items.map((item: any) => {
                    // Match with local stock name if possible
                    const matchedStock = myStocks.find(s => s.ticker === item.ticker);

                    return {
                        ...item,
                        sourceName: matchedStock?.name || item.sourceName || '야후 파이낸스',
                        thumbnail: '' // Yahoo/Google RSS doesn't provide easy thumbnails
                    };
                });

                setNewsList(finalCombined);
            } else {
                setNewsList([]);
            }
        } catch (err) {
            console.error('Yahoo news fetch failed:', err);
            setError('뉴스를 불러올 수 없습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [myStocks, isHydrated, activeRegion]);

    useEffect(() => {
        if (isHydrated) {
            fetchNews();
        }
    }, [fetchNews, isHydrated]);

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();

        // Ensure we're comparing correct timestamps
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHrs = Math.floor(diffMins / 60);

        if (diffMins < 5) return '방금 전';
        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffHrs < 24) return `${diffHrs}시간 전`;

        // For older dates, show MM.DD (KST is implicit in browser's local time)
        return `${date.getMonth() + 1}.${date.getDate()}`;
    };

    const displayedNews = isExpanded ? newsList : newsList.slice(0, 3);

    return (
        <div className="bg-white dark:bg-[#1A1A1E] rounded-[24px] shadow-sm border border-zinc-100 dark:border-white/5 overflow-hidden flex flex-col pt-5">
            {/* Header */}
            <div className="px-5 mb-4 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                    <h2 className="text-[17px] font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-1">
                        최신 투자 뉴스
                        <span className="text-[10px] font-black opacity-30">[C]</span>
                    </h2>
                    <div className="flex items-center gap-1 mt-2">
                        {[
                            { id: 'ALL', label: '전체' },
                            { id: 'KR', label: '국내' },
                            { id: 'US', label: '해외' }
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                onClick={() => setActiveRegion(btn.id as any)}
                                className={cn(
                                    "px-3 py-1 rounded-full text-[11px] font-bold transition-all",
                                    activeRegion === btn.id
                                        ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-sm"
                                        : "bg-zinc-50 dark:bg-white/5 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100"
                                )}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>
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
                            onTouchStart={(e) => e.stopPropagation()}
                            onTouchMove={(e) => e.stopPropagation()}
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
