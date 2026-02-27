'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, ChevronDown, ChevronUp, Plus, Minus, X, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// --- DATA SCHEMA & CONSTANTS ---
type AssetType = 'KR' | 'US' | 'INDEX' | 'FX';

interface MarketAsset {
    id: string | number;
    type: AssetType;
    name: string;
    ticker: string;
    currentPrice: number;
    changeAmount: number;
    changeRate: number; // Percentage
}

const TABS = ['주요', 'MY종목', 'MY지수', '환율', '주가지수', '원자재', '국채수익률'];

// Pre-configured initial dummy data
const INITIAL_STOCKS: MarketAsset[] = [
    { id: 'kr-1', type: 'KR', name: 'KODEX 미국배당커버드콜액티브', ticker: '476830', currentPrice: 12770, changeAmount: 85, changeRate: 0.67 },
    { id: 'us-1', type: 'US', name: 'Apple Inc.', ticker: 'AAPL', currentPrice: 182.52, changeAmount: 1.2, changeRate: 0.66 },
    { id: 'kr-2', type: 'KR', name: 'SOL 미국배당다우존스', ticker: '446720', currentPrice: 13085, changeAmount: 25, changeRate: 0.19 },
    { id: 'us-2', type: 'US', name: 'NVIDIA Corporation', ticker: 'NVDA', currentPrice: 880.08, changeAmount: 25.1, changeRate: 2.94 },
    { id: 'idx-1', type: 'INDEX', name: 'S&P 500', ticker: '^SPX', currentPrice: 5123.69, changeAmount: 15.2, changeRate: 0.30 },
    { id: 'us-3', type: 'US', name: 'Tesla, Inc.', ticker: 'TSLA', currentPrice: 175.22, changeAmount: -1.5, changeRate: -0.85 },
    { id: 'fx-1', type: 'FX', name: 'USD/KRW', ticker: 'USDKRW=X', currentPrice: 1335.50, changeAmount: 2.5, changeRate: 0.19 },
    { id: 'kr-3', type: 'KR', name: '삼성전자', ticker: '005930', currentPrice: 73000, changeAmount: 500, changeRate: 0.69 },
];

const Sparkline = ({ isUp }: { isUp: boolean }) => {
    const color = isUp ? "#FF4F60" : "#2684FE";
    return (
        <svg width="56" height="20" viewBox="0 0 56 20" fill="none" className="opacity-80">
            <path
                d={isUp
                    ? "M0 16 L8 12 L16 14 L24 8 L32 10 L40 4 L56 6"
                    : "M0 4 L8 8 L16 4 L24 12 L32 10 L40 16 L56 14"}
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default function MarketQuoteWidgetV2() {
    const [activeTab, setActiveTab] = useState('MY종목');
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [myStocks, setMyStocks] = useState<MarketAsset[]>(INITIAL_STOCKS);

    // --- SEARCH & BOTTOM SHEET STATE ---
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [pendingAsset, setPendingAsset] = useState<any | null>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    // --- DEBOUNCE & API CALL ---
    useEffect(() => {
        if (!searchQuery.trim() || pendingAsset?.symbol === searchQuery || (pendingAsset && (pendingAsset.shortname || pendingAsset.symbol) === searchQuery)) {
            setSearchResults([]);
            return;
        }

        const fetchResults = async () => {
            setIsSearching(true);
            try {
                const response = await fetch(`/api/ticker-search?q=${encodeURIComponent(searchQuery)}`);
                const data = await response.json();
                if (data.results) {
                    setSearchResults(data.results);
                }
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setIsSearching(false);
            }
        };

        const timer = setTimeout(fetchResults, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, pendingAsset]);

    // --- HELPERS ---
    const formatPrice = (type: AssetType, price: number) => {
        if (type === 'US') return `US$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (type === 'FX') return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return price.toLocaleString();
    };

    const inferAssetType = (result: any): AssetType => {
        const exchange = result.exchange;
        if (exchange === 'KSC' || exchange === 'KSD' || exchange === 'KOE' || (result.symbol && /^[0-9]{6}\.(KS|KQ)$/.test(result.symbol))) return 'KR';
        if (exchange === 'NMS' || exchange === 'NYQ' || exchange === 'ASE') return 'US';
        if (result.quoteType === 'CURRENCY') return 'FX';
        if (result.quoteType === 'INDEX') return 'INDEX';
        return 'US'; // Default
    };

    const handleAddClick = () => {
        if (!pendingAsset) return;

        const newAsset: MarketAsset = {
            id: pendingAsset.symbol + Date.now(),
            type: inferAssetType(pendingAsset),
            name: pendingAsset.shortname || pendingAsset.symbol,
            ticker: pendingAsset.symbol,
            currentPrice: 0,
            changeAmount: 0,
            changeRate: 0,
        };

        newAsset.currentPrice = newAsset.type === 'KR' ? Math.floor(Math.random() * 100000) : Math.random() * 500;
        newAsset.changeAmount = (Math.random() - 0.5) * (newAsset.currentPrice * 0.05);
        newAsset.changeRate = (newAsset.changeAmount / newAsset.currentPrice) * 100;

        setMyStocks(prev => [newAsset, ...prev]);
        setSearchQuery('');
        setPendingAsset(null);
        setSearchResults([]);
    };

    const handleDeleteStock = (id: string | number) => {
        setMyStocks(prev => prev.filter(s => s.id !== id));
    };

    const handleSelectDropdown = (result: any) => {
        setPendingAsset(result);
        setSearchQuery(result.shortname || result.symbol);
        setSearchResults([]);
    };

    const displayedStocks = isExpanded ? myStocks : myStocks.slice(0, 4);

    return (
        <div className="bg-white dark:bg-[#1A1A1E] rounded-[24px] shadow-sm border border-zinc-100 dark:border-white/5 overflow-hidden flex flex-col pt-4 relative">
            {/* Top Navigation */}
            <div className="flex overflow-x-auto hide-scrollbar px-4 gap-2 mb-3">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors",
                            activeTab === tab
                                ? "bg-zinc-800 text-white dark:bg-white dark:text-zinc-900"
                                : "bg-zinc-100 text-zinc-600 dark:bg-white/5 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* List Layout (1-Column) */}
            <div className="flex flex-col px-4">
                {displayedStocks.map((item, index) => {
                    const isUp = item.changeAmount >= 0;
                    const sign = isUp ? "+" : "";
                    const themeColorClass = isUp ? "bg-[#FF4F60]" : "bg-[#2684FE]";

                    return (
                        <div
                            key={item.id}
                            className={cn(
                                "flex items-center justify-between py-4",
                                index !== displayedStocks.length - 1 && "border-b border-zinc-100 dark:border-white/5"
                            )}
                        >
                            {/* Left: Ticker & Name */}
                            <div className="flex flex-col gap-0.5 flex-1 min-w-0 pr-2">
                                <span className="text-[15px] font-bold text-zinc-900 dark:text-white uppercase tracking-tight">
                                    {item.ticker}
                                </span>
                                <span className="text-[12px] text-zinc-500 dark:text-zinc-400 line-clamp-1 break-all">
                                    {item.name}
                                </span>
                            </div>

                            {/* Right Group: Sparkline + Price & Badge */}
                            <div className="flex items-center gap-4">
                                <Sparkline isUp={isUp} />
                                <div className="flex flex-col items-end gap-1.5 min-w-[70px]">
                                    <span className="text-[14px] font-bold text-zinc-900 dark:text-white">
                                        {formatPrice(item.type, item.currentPrice)}
                                    </span>
                                    <div className={cn(
                                        "px-2 py-0.5 rounded-md text-[11px] font-bold text-white min-w-[60px] text-center",
                                        themeColorClass
                                    )}>
                                        {sign}{item.changeRate.toFixed(2)}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="border-t border-zinc-100 dark:border-white/5 px-4 py-3 flex items-center justify-between">
                <button
                    onClick={() => setIsSheetOpen(true)}
                    className="flex items-center gap-1 text-[13px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 px-2 py-1 rounded-lg transition-colors"
                >
                    <Plus className="size-4" /> 자산 추가
                </button>

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

            {/* --- BOTTOM SHEET --- */}
            <AnimatePresence>
                {isSheetOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.1 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[100]"
                            onClick={() => setIsSheetOpen(false)}
                        />

                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.15 }}
                            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1A1A1E] rounded-t-[32px] shadow-2xl z-[110] max-h-[85vh] flex flex-col border-t border-zinc-100 dark:border-white/10"
                        >
                            <div className="mx-auto w-12 h-1.5 bg-zinc-200 dark:bg-white/10 rounded-full mt-3 mb-1" />

                            <div className="p-6 overflow-y-auto hide-scrollbar flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-black text-zinc-900 dark:text-white">자산 관리</h3>
                                    <button onClick={() => setIsSheetOpen(false)} className="p-1.5 bg-zinc-100 dark:bg-white/5 rounded-full">
                                        <X className="size-5 text-zinc-500" />
                                    </button>
                                </div>

                                <div className="relative mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-1">
                                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                                <Search className="size-5 text-zinc-400" />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="종목명 또는 티커 검색"
                                                value={searchQuery}
                                                onChange={(e) => {
                                                    setSearchQuery(e.target.value);
                                                    if (pendingAsset) setPendingAsset(null);
                                                }}
                                                className="w-full bg-zinc-100 dark:bg-zinc-800/80 border-none rounded-2xl py-4 pl-11 pr-4 text-[15px] font-bold text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white outline-none"
                                            />
                                            {isSearching && (
                                                <div className="absolute inset-y-0 right-4 flex items-center">
                                                    <Loader2 className="size-5 text-zinc-900 dark:text-white animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            disabled={!pendingAsset}
                                            onClick={handleAddClick}
                                            className={cn(
                                                "size-[56px] rounded-2xl flex items-center justify-center transition-all active:scale-95",
                                                pendingAsset
                                                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-lg"
                                                    : "bg-zinc-100 dark:bg-white/5 text-zinc-400 cursor-not-allowed"
                                            )}
                                        >
                                            <Plus className="size-7" />
                                        </button>
                                    </div>

                                    <AnimatePresence>
                                        {searchResults.length > 0 && searchQuery.trim() !== '' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 5 }}
                                                transition={{ duration: 0.1 }}
                                                className="absolute top-full left-0 right-[68px] mt-2 bg-white dark:bg-[#1C1C21] rounded-2xl border border-zinc-100 dark:border-white/10 shadow-2xl overflow-hidden z-[120]"
                                            >
                                                <ul className="max-h-52 overflow-y-auto custom-scrollbar">
                                                    {searchResults.map((result, idx) => (
                                                        <li key={result.symbol + idx}>
                                                            <button
                                                                onClick={() => handleSelectDropdown(result)}
                                                                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors text-left border-b border-zinc-50 dark:border-white/5 last:border-none"
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-[13px] text-zinc-900 dark:text-white truncate">
                                                                        {result.shortname || result.symbol}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
                                                                        {result.exchange} • {result.symbol}
                                                                    </span>
                                                                </div>
                                                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/10 text-zinc-500 font-black">
                                                                    {result.quoteType}
                                                                </span>
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-sm font-black text-zinc-400 px-1">나의 시세 리스트 ({myStocks.length})</p>
                                    <div className="space-y-2">
                                        {myStocks.length === 0 ? (
                                            <div className="py-12 text-center text-zinc-400 font-bold border-2 border-dashed border-zinc-100 dark:border-white/5 rounded-3xl">
                                                등록된 자산이 없습니다.
                                            </div>
                                        ) : (
                                            <ul className="space-y-3">
                                                {myStocks.map((stock) => (
                                                    <li key={stock.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-transparent">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center font-black text-[10px] text-zinc-400">
                                                                {stock.type}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-[14px] text-zinc-900 dark:text-white truncate max-w-[150px]">
                                                                    {stock.name}
                                                                </span>
                                                                <span className="text-[11px] font-bold text-zinc-400 tracking-tight">
                                                                    {stock.ticker}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteStock(stock.id)}
                                                            className="size-9 bg-zinc-100 dark:bg-white/10 rounded-xl flex items-center justify-center text-zinc-900 dark:text-white transition-colors active:scale-90"
                                                        >
                                                            <Minus className="size-5" />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
