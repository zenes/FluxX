'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, MoreHorizontal } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { calculateNetWorth, MarketPrices } from '@/lib/calculations';
import { AssetItem } from '@/lib/actions';
import StockDetailSheetV2 from './StockDetailSheetV2';

interface SimpleModeV2CardProps {
    id: string | number;
    initialAssets?: AssetItem[];
    initialExchange?: { rate: number };
    initialGold?: { price: number };
    stockAsset?: AssetItem;
}

export default function SimpleModeV2Card({
    id,
    initialAssets,
    initialExchange,
    initialGold,
    stockAsset,
}: SimpleModeV2CardProps) {
    const [netWorth, setNetWorth] = useState<number | null>(null);
    const [stockPriceInfo, setStockPriceInfo] = useState<{ price: number; currency: string; change?: number; changePercent?: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                if (stockAsset && stockAsset.assetSymbol) {
                    const res = await fetch(`/api/stock-price?symbols=${stockAsset.assetSymbol}`);
                    const data = await res.json();
                    const quote = data.quotes?.[stockAsset.assetSymbol];
                    if (quote) {
                        setStockPriceInfo({
                            price: quote.price,
                            currency: quote.currency || 'USD',
                            change: quote.change,
                            changePercent: quote.changePercent
                        });
                    }
                } else if (id === 'total' && initialAssets) {
                    console.log('V2 Card [total]: starting fetch for', initialAssets.length, 'assets');
                    const symbols = initialAssets
                        .filter(a => a.assetType === 'stock' && a.assetSymbol)
                        .map(a => a.assetSymbol)
                        .join(',');

                    let stockPrices = {};
                    if (symbols) {
                        const res = await fetch(`/api/stock-price?symbols=${symbols}`);
                        const data = await res.json();
                        stockPrices = data.quotes || {};
                    }

                    const prices: MarketPrices = {
                        usdKrw: initialExchange?.rate || 1400,
                        goldUsd: initialGold?.price || 2600,
                        stockPrices: stockPrices as any,
                    };
                    console.log('V2 Card [total]: Market prices used:', prices);
                    const calculatedValue = calculateNetWorth(initialAssets, prices);
                    console.log('V2 Card [total]: Calculated net worth:', calculatedValue);
                    setNetWorth(calculatedValue);
                }
            } catch (err) {
                console.error("Failed to fetch data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id, initialAssets, initialExchange, initialGold, stockAsset]);

    const stockValue = stockAsset && stockPriceInfo
        ? stockAsset.amount * stockPriceInfo.price * (stockPriceInfo.currency === 'USD' ? (initialExchange?.rate || 1400) : 1)
        : 0;

    const isTotal = id === 'total';
    const displayValue = isTotal ? (netWorth || 0) : stockValue;
    const changePercent = stockPriceInfo?.changePercent || 0;
    const isUp = changePercent >= 0;

    // ETF-Check 스타일 상수
    const COLOR_UP = "#FF4F60";
    const COLOR_DOWN = "#2684FE";
    const PRIMARY_TEXT = "#2B364B";

    return (
        <>
            <Card
                onClick={() => !isTotal && setIsDetailOpen(true)}
                className={cn(
                    "relative overflow-hidden bg-white dark:bg-[#1A1A1E] border-none rounded-[24px] shadow-sm active:scale-[0.98] transition-all cursor-pointer p-6",
                    isTotal ? "ring-1 ring-zinc-100 dark:ring-white/5" : ""
                )}
            >
                {/* Debug ID Badge */}
                <div className="absolute top-0 left-0 bg-black text-white text-[10px] font-black px-2 py-1 rounded-br-xl z-20 opacity-50">
                    ID: {isTotal ? 'TOTAL' : id}
                </div>

                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        {stockAsset ? (
                            <div className="size-10 rounded-xl bg-[#F5F5F7] dark:bg-white/5 flex items-center justify-center font-black text-[#2B364B] dark:text-white/80">
                                {stockAsset.assetSymbol?.charAt(0)}
                            </div>
                        ) : (
                            <div className="size-2 rounded-full bg-[#38C798]" />
                        )}
                        <div>
                            <p className="text-[16px] font-bold text-[#2B364B] dark:text-white/90 leading-tight">
                                {isTotal ? "총 자산 현황" : stockAsset?.assetSymbol}
                            </p>
                            {!isTotal && (
                                <p className="text-[12px] text-zinc-400 font-medium">
                                    {stockAsset?.amount.toLocaleString()}주 보유
                                </p>
                            )}
                        </div>
                    </div>
                    <button className="p-1 text-zinc-300">
                        <MoreHorizontal className="size-5" />
                    </button>
                </div>

                <div className="space-y-1">
                    {isLoading ? (
                        <div className="h-10 w-40 bg-zinc-100 dark:bg-white/5 animate-pulse rounded-lg" />
                    ) : (
                        <>
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg font-bold text-[#2B364B]/30 dark:text-white/20">₩</span>
                                <h2 className="text-[36px] font-black tracking-tighter text-[#2B364B] dark:text-white leading-none">
                                    {displayValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </h2>
                            </div>

                            {!isTotal && stockPriceInfo && (
                                <div
                                    className="flex items-center gap-1 font-bold text-sm mt-1"
                                    style={{ color: isUp ? COLOR_UP : COLOR_DOWN }}
                                >
                                    {isUp ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                                    <span>{isUp ? '+' : ''}{changePercent.toFixed(2)}%</span>
                                    <span className="text-zinc-300 dark:text-zinc-600 font-medium ml-1">당일</span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Subtle Sparkline Background Placeholder */}
                <div className="absolute right-0 bottom-0 w-32 h-16 opacity-10 pointer-events-none">
                    <svg viewBox="0 0 100 40" className="w-full h-full">
                        <path
                            d="M0 35 Q 25 35, 50 15 T 100 5 L 100 40 L 0 40 Z"
                            fill={isUp ? COLOR_UP : COLOR_DOWN}
                        />
                        <path
                            d="M0 35 Q 25 35, 50 15 T 100 5"
                            fill="none"
                            stroke={isUp ? COLOR_UP : COLOR_DOWN}
                            strokeWidth="2"
                        />
                    </svg>
                </div>
            </Card>

            {stockAsset && (
                <StockDetailSheetV2
                    isOpen={isDetailOpen}
                    onClose={() => setIsDetailOpen(false)}
                    stockAsset={stockAsset}
                    currentPrice={stockPriceInfo?.price ?? null}
                    changePercent={stockPriceInfo?.changePercent ?? null}
                    exchangeRate={initialExchange?.rate || 1400}
                />
            )}
        </>
    );
}
