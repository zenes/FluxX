'use client';

import React from 'react';
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

interface StockDetailSheetProps {
    isOpen: boolean;
    onClose: () => void;
    stockAsset: AssetItem;
    currentPrice: number | null;
    changePercent: number | null;
    exchangeRate: number;
}

export default function StockDetailSheet({
    isOpen,
    onClose,
    stockAsset,
    currentPrice,
    changePercent,
    exchangeRate,
}: StockDetailSheetProps) {
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

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent
                side="bottom"
                className="h-auto max-h-[85vh] rounded-t-[40px] p-0 overflow-hidden border-none shadow-2xl bg-white"
            >
                {/* Handle Bar */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full z-20 bg-zinc-200" />

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-8 pb-4 border-b border-zinc-100">
                    <div>
                        <SheetTitle className="text-2xl font-black text-zinc-900 tracking-tight">{stockAsset.assetSymbol}</SheetTitle>
                        <p className="text-sm text-zinc-400 font-medium mt-0.5">보유 자산 상세</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full bg-zinc-100 text-zinc-400 active:scale-90 transition-transform">
                        <X className="size-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 pb-10 pt-4 space-y-4 overflow-y-auto max-h-[70vh] hide-scrollbar">
                    {/* Summary */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Current Value — full width */}
                        <div className="bg-zinc-50 ring-1 ring-zinc-100 rounded-[24px] p-5 col-span-2">
                            <p className="text-xs font-bold text-zinc-400 mb-2">평가 금액</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-zinc-900 tracking-tight">
                                    {totalValueKrw.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </span>
                                <span className="text-sm font-bold text-zinc-900 opacity-30">원</span>
                            </div>
                            <div className={cn(
                                "inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-xs font-bold",
                                isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
                            )}>
                                {isPositive ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                                {isPositive ? '+' : ''}{unrealizedPnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}원
                                <span className="opacity-60 ml-0.5">({isPositive ? '+' : ''}{returnRate.toFixed(2)}%)</span>
                            </div>
                        </div>

                        {/* Avg Price */}
                        <div className="bg-zinc-50 ring-1 ring-zinc-100 rounded-[24px] p-5">
                            <div className="flex items-center gap-1.5 mb-2">
                                <BarChart2 className="size-3.5 text-zinc-400" />
                                <p className="text-xs font-bold text-zinc-400">평단가</p>
                            </div>
                            <p className="text-lg font-black text-zinc-900 tracking-tight">
                                {isUSD
                                    ? `$${computedAvgPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                                    : `₩${computedAvgPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                                }
                            </p>
                            {isUSD && <p className="text-xs text-zinc-400 mt-0.5">≈ ₩{avgPriceKrw.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>}
                        </div>

                        {/* Current Price */}
                        <div className="bg-zinc-50 ring-1 ring-zinc-100 rounded-[24px] p-5">
                            <div className="flex items-center gap-1.5 mb-2">
                                <Percent className="size-3.5 text-zinc-400" />
                                <p className="text-xs font-bold text-zinc-400">현재가</p>
                            </div>
                            <p className="text-lg font-black text-zinc-900 tracking-tight">
                                {isUSD && currentPrice
                                    ? `$${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                                    : currentPrice
                                        ? `₩${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                                        : '-'
                                }
                            </p>
                            {changePercent !== null && (
                                <p className={cn("text-xs font-bold mt-0.5", changePercent >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                    {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Per-account holdings */}
                    {stockAsset.entries && stockAsset.entries.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3 px-1">
                                <Building2 className="size-4 text-zinc-400" />
                                <h3 className="text-sm font-bold text-zinc-500">보유 계좌</h3>
                            </div>
                            <div className="space-y-2">
                                {stockAsset.entries.map((entry, idx) => {
                                    const entryAvgPrice = entry.qty > 0 ? entry.totalCost / entry.qty : 0;
                                    const entryValueKrw = isUSD
                                        ? (currentPrice || 0) * exchangeRate * entry.qty
                                        : (currentPrice || 0) * entry.qty;
                                    const entryAvgKrw = isUSD ? entryAvgPrice * exchangeRate : entryAvgPrice;
                                    const entryBookValue = entryAvgKrw * entry.qty;
                                    const entryPnl = entryValueKrw - entryBookValue;
                                    const entryReturn = entryBookValue > 0 ? (entryPnl / entryBookValue) * 100 : 0;
                                    const entryIsPositive = entryReturn >= 0;

                                    return (
                                        <div
                                            key={entry.id || idx}
                                            className="bg-zinc-50 ring-1 ring-zinc-100 rounded-[20px] p-4 flex items-center justify-between"
                                        >
                                            <div>
                                                <p className="text-sm font-bold text-zinc-800">
                                                    {entry.predefinedAccountAlias || entry.account || entry.broker}
                                                </p>
                                                <p className="text-xs text-zinc-400 font-medium mt-0.5">
                                                    {entry.qty.toLocaleString()}주 · 평단 {isUSD
                                                        ? `$${entryAvgPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                                                        : `₩${entryAvgPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                                                    }
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-zinc-900">
                                                    ₩{entryValueKrw.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </p>
                                                <p className={cn("text-xs font-bold mt-0.5", entryIsPositive ? "text-emerald-500" : "text-rose-500")}>
                                                    {entryIsPositive ? '+' : ''}{entryReturn.toFixed(2)}%
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Total Qty */}
                    <div className="bg-zinc-50 ring-1 ring-zinc-100 rounded-[20px] p-4 flex items-center justify-between">
                        <p className="text-sm font-bold text-zinc-500">총 보유 수량</p>
                        <p className="text-sm font-black text-zinc-900">{stockAsset.amount.toLocaleString()}주</p>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
