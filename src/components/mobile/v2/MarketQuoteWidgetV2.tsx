'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, ChevronDown, ChevronUp, Plus, Minus, X, Search, Loader2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { AssetType, MarketAsset } from './typesV2';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Bar,
    ComposedChart
} from 'recharts';

const TABS = ['주요', 'MY종목', 'MY지수', '환율', '주가지수', '원자재', '국채수익률'];

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

interface MarketQuoteWidgetV2Props {
    myStocks: MarketAsset[];
    setMyStocks: React.Dispatch<React.SetStateAction<MarketAsset[]>>;
    onModalToggle?: (isOpen: boolean) => void;
    onRefresh?: () => Promise<void>;
}

const StockReorderItem = ({
    stock,
    onDelete
}: {
    stock: MarketAsset;
    onDelete: (id: string | number) => void;
}) => {
    const dragControls = useDragControls();
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    const dragBg = isDark ? '#27272a' : '#f4f4f5';

    return (
        <Reorder.Item
            value={stock}
            id={String(stock.id)}
            dragListener={false}
            dragControls={dragControls}
            className="flex items-center justify-between p-4 bg-white dark:bg-[#1A1A1E] rounded-2xl border border-zinc-100 dark:border-white/5 touch-none"
            whileDrag={{
                scale: 1.02,
                backgroundColor: dragBg,
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                zIndex: 10
            }}
            transition={{ duration: 0 }}
        >
            <div className="flex items-center gap-3">
                <div
                    className="p-1 cursor-grab active:cursor-grabbing text-zinc-400 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    onPointerDown={(e) => dragControls.start(e)}
                >
                    <GripVertical className="size-5" />
                </div>
                <div className="size-10 rounded-xl bg-zinc-50 dark:bg-white/5 flex items-center justify-center font-black text-[10px] text-zinc-400">
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
                onClick={() => onDelete(stock.id)}
                className="size-9 bg-zinc-100 dark:bg-white/10 rounded-xl flex items-center justify-center text-zinc-900 dark:text-white transition-colors active:scale-90"
            >
                <Minus className="size-5" />
            </button>
        </Reorder.Item>
    );
};

export default function MarketQuoteWidgetV2({ myStocks, setMyStocks, onModalToggle, onRefresh }: MarketQuoteWidgetV2Props) {
    const [activeTab, setActiveTab] = useState('MY종목');
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<MarketAsset | null>(null);
    const [selectedRange, setSelectedRange] = useState('1일');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // --- SEARCH & BOTTOM SHEET STATE ---
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [pendingAsset, setPendingAsset] = useState<any | null>(null);

    // Synchronize modal state with parent
    useEffect(() => {
        onModalToggle?.(isSheetOpen || !!selectedAsset);
    }, [isSheetOpen, !!selectedAsset, onModalToggle]);

    const handleRefresh = async () => {
        if (!onRefresh || isRefreshing) return;
        setIsRefreshing(true);
        try {
            await onRefresh();
        } finally {
            setIsRefreshing(false);
        }
    };

    // --- CHART DATA GENERATION ---
    const chartData = React.useMemo(() => {
        if (!selectedAsset) return [];
        const data = [];
        const baseline = 100;

        const ranges: Record<string, { steps: number, vol: number, trendFactor: number }> = {
            '1일': { steps: 80, vol: 0.8, trendFactor: 0.5 },
            '1주': { steps: 80, vol: 1.5, trendFactor: 1.0 },
            '1개월': { steps: 80, vol: 2.5, trendFactor: 1.5 },
            '3개월': { steps: 100, vol: 4.0, trendFactor: 2.5 },
            '6개월': { steps: 100, vol: 5.5, trendFactor: 3.5 },
            'YTD': { steps: 120, vol: 7.5, trendFactor: 4.5 },
            '1년': { steps: 120, vol: 10.0, trendFactor: 5.5 }
        };

        const config = ranges[selectedRange] || ranges['1일'];
        const steps = config.steps;
        const volatility = config.vol;
        const trend = selectedAsset.changeRate * config.trendFactor;

        let currentPrice = baseline - (trend * 0.4);
        const startTime = new Date();
        startTime.setHours(9, 0, 0, 0);

        for (let i = 0; i <= steps; i++) {
            const drift = (baseline + trend - currentPrice) / (steps - i + 1) * 0.15;
            currentPrice += drift + (Math.random() - 0.5) * volatility;

            const time = new Date(startTime.getTime() + i * (6.5 * 60 * 60 * 1000 / steps));
            const timeStr = time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });

            data.push({
                time: timeStr,
                price: parseFloat(currentPrice.toFixed(2)),
                volume: Math.floor(Math.random() * 2000) + 1000
            });
        }

        return data;
    }, [selectedAsset, selectedRange]);

    const isUp = selectedAsset?.changeAmount ? selectedAsset.changeAmount >= 0 : true;
    const chartColor = isUp ? "#FF4F60" : "#2684FE";

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-zinc-900/90 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl">
                    <p className="text-[10px] font-black text-zinc-500 mb-1 uppercase tracking-widest">{payload[0].payload.time}</p>
                    <p className="text-sm font-black text-white">
                        {formatPrice(selectedAsset!.type, payload[0].value)}
                    </p>
                </div>
            );
        }
        return null;
    };

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
        <div
            className="bg-white dark:bg-[#1A1A1E] rounded-[24px] shadow-sm border border-zinc-100 dark:border-white/5 overflow-hidden flex flex-col pt-4 relative"
        >
            {/* Top Navigation */}
            <div className="flex items-center justify-between px-4 mb-3">
                <div className="flex overflow-x-auto hide-scrollbar gap-2 flex-1 mr-2">
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
                {onRefresh && (
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all disabled:opacity-50 shrink-0"
                    >
                        <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
                    </button>
                )}
            </div>

            {/* List Layout (1-Column) */}
            <div className="flex flex-col px-4">
                {displayedStocks.map((item, index) => {
                    const isUp = item.changeAmount >= 0;
                    const sign = isUp ? "+" : "";
                    const themeColorClass = isUp ? "bg-[#FF4F60]" : "bg-[#2684FE]";

                    return (
                        <button
                            key={item.id}
                            onClick={() => setSelectedAsset(item)}
                            className={cn(
                                "flex items-center justify-between py-4 w-full text-left active:opacity-60 transition-opacity",
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
                        </button>
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
                            onTouchStart={(e) => e.stopPropagation()}
                            onTouchMove={(e) => e.stopPropagation()}
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
                                            <Reorder.Group
                                                axis="y"
                                                values={myStocks}
                                                onReorder={setMyStocks}
                                                className="space-y-3"
                                            >
                                                {myStocks.map((stock) => (
                                                    <StockReorderItem
                                                        key={stock.id}
                                                        stock={stock}
                                                        onDelete={handleDeleteStock}
                                                    />
                                                ))}
                                            </Reorder.Group>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            {/* --- ASSET DETAIL BOTTOM SHEET --- */}
            <AnimatePresence>
                {selectedAsset && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120]"
                            onClick={() => setSelectedAsset(null)}
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1A1A1E] rounded-t-[32px] shadow-2xl z-[130] max-h-[90vh] flex flex-col"
                            onTouchStart={(e) => e.stopPropagation()}
                            onTouchMove={(e) => e.stopPropagation()}
                        >
                            {/* Handle & Close */}
                            <div className="relative pt-3 pb-2 flex justify-center shrink-0">
                                <div className="w-12 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                                <button
                                    onClick={() => setSelectedAsset(null)}
                                    className="absolute right-6 top-4 p-2 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <div className="overflow-y-auto hide-scrollbar pb-10">
                                {/* Header Info */}
                                <div className="px-6 pt-4 mb-6">
                                    <div className="flex flex-col gap-1 mb-4">
                                        <span className="text-[13px] font-black text-zinc-400 uppercase tracking-widest">
                                            {selectedAsset.ticker}
                                        </span>
                                        <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                                            {selectedAsset.name}
                                        </h2>
                                    </div>
                                    <div className="flex items-end gap-3">
                                        <span className="text-3xl font-black text-zinc-900 dark:text-white">
                                            {formatPrice(selectedAsset.type, selectedAsset.currentPrice)}
                                        </span>
                                        <div className={cn(
                                            "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[13px] font-black text-white mb-1",
                                            selectedAsset.changeAmount >= 0 ? "bg-[#FF4F60]" : "bg-[#2684FE]"
                                        )}>
                                            {selectedAsset.changeAmount >= 0 ? "+" : ""}{selectedAsset.changeRate.toFixed(2)}%
                                        </div>
                                    </div>
                                </div>

                                {/* Range Selectors */}
                                <div className="px-6 mb-4">
                                    <div className="flex items-center justify-between bg-zinc-50 dark:bg-white/5 p-1 rounded-xl gap-0.5">
                                        {['1일', '1주', '1개월', '3개월', '6개월', 'YTD', '1년'].map((range) => (
                                            <button
                                                key={range}
                                                onClick={() => setSelectedRange(range)}
                                                className={cn(
                                                    "flex-1 py-1.5 text-[11px] font-black rounded-lg transition-all",
                                                    selectedRange === range
                                                        ? "bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 shadow-lg"
                                                        : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                                )}
                                            >
                                                {range}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Detailed Chart (Recharts Upgrade) */}
                                <div className="px-4 mb-8">
                                    <div className="w-full h-72 bg-white dark:bg-[#1A1A1E] rounded-[32px] border border-zinc-100 dark:border-white/5 relative overflow-hidden flex flex-col pt-8 pb-4">
                                        <div className="flex-1 w-full px-2">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor={chartColor} stopOpacity={0.15} />
                                                            <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.1} />
                                                    <XAxis
                                                        dataKey="time"
                                                        hide
                                                    />
                                                    <YAxis
                                                        yAxisId="price"
                                                        domain={['auto', 'auto']}
                                                        orientation="right"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fontSize: 10, fontWeight: 'bold', fill: '#A1A1AA' }}
                                                        mirror
                                                    />
                                                    <YAxis
                                                        yAxisId="volume"
                                                        orientation="left"
                                                        domain={[0, (dataMax: number) => dataMax * 3.5]}
                                                        hide={true}
                                                    />
                                                    <Tooltip content={<CustomTooltip />} />

                                                    <Bar
                                                        yAxisId="volume"
                                                        dataKey="volume"
                                                        fill="#A1A1AA"
                                                        opacity={0.12}
                                                        barSize={2}
                                                    />

                                                    <Area
                                                        yAxisId="price"
                                                        type="monotone"
                                                        dataKey="price"
                                                        stroke={chartColor}
                                                        strokeWidth={2.5}
                                                        fillOpacity={1}
                                                        fill="url(#colorPrice)"
                                                        animationDuration={1000}
                                                        dot={false}
                                                        activeDot={{ r: 6, strokeWidth: 0, fill: chartColor }}
                                                    />
                                                </ComposedChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Time Labels Overlay */}
                                        <div className="mt-2 px-8 flex justify-between text-[10px] font-black text-zinc-300 dark:text-zinc-600 tracking-tighter">
                                            <span>{chartData[0]?.time}</span>
                                            <span>{chartData[Math.floor(chartData.length / 2)]?.time}</span>
                                            <span>{chartData[chartData.length - 1]?.time}</span>
                                        </div>

                                        <div className="absolute top-4 left-6 flex items-center gap-2">
                                            <div className="size-1.5 rounded-full bg-red-500 animate-pulse" />
                                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                                {selectedRange === '1일' ? 'REALTIME 1D' : `${selectedRange} TREND`}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Key Statistics Grid */}
                                <div className="px-6">
                                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 px-1">주요 통계</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: '시가', value: formatPrice(selectedAsset.type, selectedAsset.currentPrice * 0.98) },
                                            { label: '고가', value: formatPrice(selectedAsset.type, selectedAsset.currentPrice * 1.02) },
                                            { label: '저가', value: formatPrice(selectedAsset.type, selectedAsset.currentPrice * 0.97) },
                                            { label: '거래량', value: selectedAsset.type === 'KR' ? '1.2M' : '45.8M' },
                                            { label: '52주 최고', value: formatPrice(selectedAsset.type, selectedAsset.currentPrice * 1.5) },
                                            { label: '52주 최저', value: formatPrice(selectedAsset.type, selectedAsset.currentPrice * 0.6) },
                                        ].map((stat) => (
                                            <div key={stat.label} className="bg-zinc-50 dark:bg-white/5 p-4 rounded-2xl flex flex-col gap-1">
                                                <span className="text-[11px] font-bold text-zinc-400">{stat.label}</span>
                                                <span className="text-[15px] font-black text-zinc-900 dark:text-white">{stat.value}</span>
                                            </div>
                                        ))}
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
