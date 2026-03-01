'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, MoreHorizontal, Coins, CreditCard, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { calculateNetWorth, MarketPrices } from '@/lib/calculations';
import { AssetItem } from '@/lib/actions';
import StockDetailSheetV2 from './StockDetailSheetV2';
import AssetGrowthDetailSheetV2 from './AssetGrowthDetailSheetV2';
import { koreanNameMap } from '@/lib/koreanNameMap';

interface SimpleModeV2CardProps {
    id: string | number;
    initialAssets?: AssetItem[];
    initialExchange?: { rate: number };
    initialGold?: { price: number };
    stockAsset?: AssetItem;
    assetItem?: AssetItem; // For non-stock assets (krw, gold, usd)
}

export default function SimpleModeV2Card({
    id,
    initialAssets,
    initialExchange,
    initialGold,
    stockAsset,
    assetItem,
}: SimpleModeV2CardProps) {
    const [netWorth, setNetWorth] = useState<number | null>(null);
    const [stockPriceInfo, setStockPriceInfo] = useState<{ price: number; currency: string; change?: number; changePercent?: number; shortName?: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [marketPrices, setMarketPrices] = useState<MarketPrices | null>(null);

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
                            changePercent: quote.changePercent,
                            shortName: quote.shortName
                        });
                    }
                } else if (id === 'total' && initialAssets) {
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
                    setMarketPrices(prices);
                    const calculatedValue = calculateNetWorth(initialAssets, prices);
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

    const isTotal = id === 'total';
    const isStock = !!stockAsset;
    const isOtherAsset = !!assetItem;

    let displayValue = 0;
    let title = "";
    let subtitle = "";
    let icon = null;

    if (isTotal) {
        displayValue = netWorth || 0;
        title = "총 자산 현황";
        icon = <div className="size-2 rounded-full bg-[#38C798]" />;
    } else if (isStock && stockAsset) {
        displayValue = stockPriceInfo
            ? stockAsset.amount * stockPriceInfo.price * (stockPriceInfo.currency === 'USD' ? (initialExchange?.rate || 1400) : 1)
            : stockAsset.amount * (stockAsset.avgPrice || 0) * (stockAsset.currency === 'USD' ? (initialExchange?.rate || 1400) : 1);

        const isKR = stockAsset.assetSymbol?.endsWith('.KS') || stockAsset.assetSymbol?.endsWith('.KQ');
        title = isKR
            ? (koreanNameMap[stockAsset.assetSymbol || ''] || stockPriceInfo?.shortName || stockAsset.assetSymbol || "Unknown")
            : (stockAsset.assetSymbol || "Unknown");

        subtitle = `${stockAsset.amount.toLocaleString()}주 보유`;
        icon = (
            <div className="size-10 rounded-xl bg-[#F5F5F7] dark:bg-white/5 flex items-center justify-center font-black text-[#2B364B] dark:text-white/80">
                {title.charAt(0)}
            </div>
        );
    } else if (isOtherAsset && assetItem) {
        title = assetItem.assetType.toUpperCase();
        if (assetItem.assetType === 'krw') {
            displayValue = assetItem.amount;
            title = "현금 (KRW)";
            icon = <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center"><CreditCard className="size-5 text-blue-500" /></div>;
        } else if (assetItem.assetType === 'usd') {
            displayValue = assetItem.amount * (initialExchange?.rate || 1400);
            title = "달러 (USD)";
            subtitle = `$${assetItem.amount.toLocaleString()}`;
            icon = <div className="size-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center"><DollarSign className="size-5 text-green-500" /></div>;
        } else if (assetItem.assetType === 'gold') {
            displayValue = (assetItem.amount / 31.1034768) * (initialGold?.price || 2600) * (initialExchange?.rate || 1400);
            title = "금 (Gold)";
            subtitle = `${assetItem.amount.toLocaleString()}g`;
            icon = <div className="size-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center"><Coins className="size-5 text-orange-500" /></div>;
        }
    }

    const changePercent = stockPriceInfo?.changePercent || 0;
    const isUp = changePercent >= 0;

    const COLOR_UP = "#FF4F60";
    const COLOR_DOWN = "#2684FE";

    return (
        <>
            <Card
                onClick={() => {
                    if (isStock || isTotal) setIsDetailOpen(true);
                }}
                className={cn(
                    "relative overflow-hidden bg-white dark:bg-[#1A1A1E] border-none rounded-[24px] shadow-sm active:scale-[0.98] transition-all cursor-pointer p-6",
                    isTotal ? "ring-1 ring-zinc-100 dark:ring-white/5" : ""
                )}
            >
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        {icon}
                        <div>
                            <p className="text-[16px] font-bold text-[#2B364B] dark:text-white/90 leading-tight flex items-center gap-1">
                                {title}
                                {isTotal && <span className="text-[9px] font-black opacity-30">[A]</span>}
                            </p>
                            {subtitle && (
                                <p className="text-[12px] text-zinc-400 font-medium pb-0.5">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                    <button className="p-1 text-zinc-300">
                        <MoreHorizontal className="size-5" />
                    </button>
                </div>

                <div className="space-y-1">
                    {isLoading && isStock ? (
                        <div className="h-10 w-40 bg-zinc-100 dark:bg-white/5 animate-pulse rounded-lg" />
                    ) : (
                        <>
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg font-bold text-[#2B364B]/30 dark:text-white/20">₩</span>
                                <h2 className="text-[32px] font-black tracking-tighter text-[#2B364B] dark:text-white leading-none">
                                    {displayValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </h2>
                            </div>

                            {isStock && stockPriceInfo && (
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

                {(isTotal || isStock) && (
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
                )}
            </Card>

            {stockAsset && (
                <StockDetailSheetV2
                    isOpen={isDetailOpen}
                    onClose={() => setIsDetailOpen(false)}
                    stockAsset={stockAsset}
                    currentPrice={stockPriceInfo?.price ?? null}
                    changePercent={stockPriceInfo?.changePercent ?? null}
                    exchangeRate={initialExchange?.rate || 1400}
                    totalNetWorth={isTotal ? (netWorth || 0) : 0}
                    title={title}
                />
            )}

            {isTotal && initialAssets && marketPrices && (
                <AssetGrowthDetailSheetV2
                    isOpen={isDetailOpen}
                    onClose={() => setIsDetailOpen(false)}
                    assets={initialAssets}
                    marketPrices={marketPrices}
                    totalNetWorth={netWorth || 0}
                />
            )}
        </>
    );
}
