'use client';

import React, { useState } from 'react';
import {
    Sheet,
    SheetContent,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    X,
    TrendingUp,
    TrendingDown,
    Building2,
    BarChart2,
    Percent,
} from 'lucide-react';
import { AssetItem } from '@/lib/actions';
import { cn } from '@/lib/utils';

interface StockDetailSheetV2Props {
    isOpen: boolean;
    onClose: () => void;
    stockAsset: AssetItem;
    currentPrice: number | null;
    changePercent: number | null;
    exchangeRate: number;
}

const RANGES = ['1D', '1W', '1M', '3M', '6M', 'YTD', '1Y', 'MAX'];

export default function StockDetailSheetV2({
    isOpen,
    onClose,
    stockAsset,
    currentPrice,
    changePercent,
    exchangeRate,
}: StockDetailSheetV2Props) {
    const [activeRange, setActiveRange] = useState('1M');

    const isUSD = stockAsset.currency !== 'KRW';
    const priceInKrw = currentPrice
        ? (isUSD ? currentPrice * exchangeRate : currentPrice)
        : 0;
    const totalValueKrw = priceInKrw * stockAsset.amount;

    const computedAvgPrice = (() => {
        if (stockAsset.entries && stockAsset.entries.length > 0) {
            const totalCost = stockAsset.entries.reduce((s, e) => s + e.totalCost, 0);
            const totalQty = stockAsset.entries.reduce((s, e) => s + e.qty, 0);
            return totalQty > 0 ? totalCost / totalQty : (stockAsset.avgPrice || 0);
        }
        return stockAsset.avgPrice || 0;
    })();

    const avgPriceKrw = isUSD ? computedAvgPrice * exchangeRate : computedAvgPrice;
    const bookValue = avgPriceKrw * stockAsset.amount;
    const unrealizedPnl = totalValueKrw - bookValue;
    const returnRate = bookValue > 0 ? (unrealizedPnl / bookValue) * 100 : 0;
    const isPositive = returnRate >= 0;

    // ETF-Check 스타일 상수
    const COLOR_UP = "#FF4F60";
    const COLOR_DOWN = "#2684FE";
    const PRIMARY_ACCENT = "#38C798";
    const PRIMARY_TEXT = "#2B364B";

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent
                side="bottom"
                className="h-auto max-h-[92vh] rounded-t-[40px] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-[#121214]"
            >
                {/* Handle Bar */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full z-20 bg-zinc-200 dark:bg-white/10" />

                {/* Header */}
                <div className="px-6 pt-10 pb-6 border-b border-zinc-100 dark:border-white/5">
                    <div className="flex items-center justify-between uppercase text-[10px] font-black tracking-widest text-[#38C798] mb-2">
                        <span>ETF V2 Detail</span>
                        <button onClick={onClose} className="p-1 rounded-full bg-zinc-50 dark:bg-white/5 text-zinc-400">
                            <X className="size-4" />
                        </button>
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <SheetTitle className="text-2xl font-black text-[#2B364B] dark:text-white tracking-tight leading-none mb-1">
                                {stockAsset.assetSymbol}
                            </SheetTitle>
                            <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">STOCK ASSET</p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-baseline gap-1 justify-end">
                                <span className="text-sm font-bold text-zinc-300">₩</span>
                                <span className="text-3xl font-black text-[#2B364B] dark:text-white tracking-tighter leading-none">
                                    {priceInKrw.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </span>
                            </div>
                            {changePercent !== null && (
                                <div className="flex items-center gap-1 justify-end font-bold text-sm mt-1" style={{ color: changePercent >= 0 ? COLOR_UP : COLOR_DOWN }}>
                                    {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Chart Area with Gradient */}
                <div className="relative w-full h-48 bg-white dark:bg-[#121214] mt-4">
                    {/* Range Selectors */}
                    <div className="absolute top-0 inset-x-0 flex justify-center gap-1 z-10 px-4">
                        {RANGES.map(range => (
                            <button
                                key={range}
                                onClick={() => setActiveRange(range)}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-[11px] font-black transition-all",
                                    activeRange === range
                                        ? "bg-[#38C798] text-white"
                                        : "text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                                )}
                            >
                                {range}
                            </button>
                        ))}
                    </div>

                    {/* Placeholder Chart with Gradient Fill */}
                    <div className="absolute inset-x-0 bottom-0 top-10 pointer-events-none px-2">
                        <svg viewBox="0 0 400 120" className="w-full h-full preserve-3d" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={PRIMARY_ACCENT} stopOpacity="0.2" />
                                    <stop offset="100%" stopColor={PRIMARY_ACCENT} stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path
                                d="M0 80 Q 50 85, 100 40 T 200 60 T 300 10 T 400 45 L 400 120 L 0 120 Z"
                                fill="url(#chartGradient)"
                            />
                            <path
                                d="M0 80 Q 50 85, 100 40 T 200 60 T 300 10 T 400 45"
                                fill="none"
                                stroke={PRIMARY_ACCENT}
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                </div>

                {/* Detailed Info Cards */}
                <div className="px-6 pb-12 pt-6 space-y-4 overflow-y-auto max-h-[45vh] hide-scrollbar bg-zinc-50 dark:bg-black/20">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-[#1A1A1E] rounded-3xl p-5 shadow-sm border border-zinc-100 dark:border-white/5">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Unrealized PNL</p>
                            <p className={cn("text-xl font-black tracking-tight leading-none", isPositive ? "text-[#FF4F60]" : "text-[#2684FE]")}>
                                {isPositive ? '+' : ''}{unrealizedPnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </p>
                            <p className={cn("text-xs font-bold mt-1", isPositive ? "text-[#FF4F60]/60" : "text-[#2684FE]/60")}>
                                {isPositive ? '+' : ''}{returnRate.toFixed(2)}%
                            </p>
                        </div>
                        <div className="bg-white dark:bg-[#1A1A1E] rounded-3xl p-5 shadow-sm border border-zinc-100 dark:border-white/5">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Avg Price</p>
                            <p className="text-xl font-black text-[#2B364B] dark:text-white tracking-tight leading-none">
                                {isUSD ? `$${computedAvgPrice.toFixed(2)}` : `₩${computedAvgPrice.toLocaleString()}`}
                            </p>
                        </div>
                    </div>

                    {/* Additional Details */}
                    <div className="bg-white dark:bg-[#1A1A1E] rounded-3xl p-6 shadow-sm border border-zinc-100 dark:border-white/5 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-2 uppercase tracking-wider">
                                <Building2 className="size-3" /> 보유 수량
                            </span>
                            <span className="text-sm font-black text-[#2B364B] dark:text-white">{stockAsset.amount.toLocaleString()}주</span>
                        </div>
                        <div className="h-px bg-zinc-50 dark:bg-white/5" />
                        <div className="flex justify-between items-center">
                            <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-2 uppercase tracking-wider">
                                <BarChart2 className="size-3" /> 평가 금액
                            </span>
                            <span className="text-sm font-black text-[#2B364B] dark:text-white">₩{totalValueKrw.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
