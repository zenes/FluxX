'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, MoreHorizontal, Coins, CreditCard, DollarSign, Eye, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { calculateNetWorth, GOLD_TROY_OUNCE_GRAMS, MarketPrices } from '@/lib/calculations';
import { AssetItem } from '@/lib/actions';
import StockDetailSheetV2 from './StockDetailSheetV2';
import AssetGrowthDetailSheetV2 from './AssetGrowthDetailSheetV2';
import { getStockDisplayName, getQuoteFromResults } from '@/lib/stock-utils';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';

interface SimpleModeV2CardProps {
    id: string | number;
    initialAssets?: AssetItem[];
    initialExchange?: { rate: number };
    initialGold?: { price: number };
    stockAsset?: AssetItem;
    assetItem?: AssetItem; // For non-stock assets (krw, gold, usd)
    onClick?: () => void;
    isHidden?: boolean;
    onToggleHide?: () => void;
    forcedValue?: number;
    externalMarketPrices?: MarketPrices | null;
}

export default function SimpleModeV2Card({
    id,
    initialAssets,
    initialExchange,
    initialGold,
    stockAsset,
    assetItem,
    onClick,
    isHidden = false,
    onToggleHide,
    forcedValue,
    externalMarketPrices
}: SimpleModeV2CardProps) {
    const [netWorth, setNetWorth] = useState<number | null>(null);
    const [stockPriceInfo, setStockPriceInfo] = useState<{ price: number; currency: string; change?: number; changePercent?: number; shortName?: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [marketPrices, setMarketPrices] = useState<MarketPrices | null>(null);
    const { getUpColor, getDownColor } = useUserPreferences();

    const isTotal = id === 'total';
    const isStock = !!stockAsset;
    const isOtherAsset = !!assetItem;

    useEffect(() => {
        // 1. Use externalMarketPrices provided by parent (Single Source of Truth)
        if (externalMarketPrices) {
            const symbol = stockAsset?.assetSymbol || assetItem?.assetSymbol || '';
            const quote = getQuoteFromResults(symbol, externalMarketPrices.stockPrices);

            if (quote && quote.price > 0) {
                setStockPriceInfo({
                    price: quote.price,
                    currency: quote.currency || 'USD',
                    change: quote.change,
                    changePercent: quote.changePercent,
                    shortName: quote.shortName
                });
            }

            // Sync marketPrices for local calculations (Fx/Gold)
            setMarketPrices(externalMarketPrices);

            if (isTotal && forcedValue !== undefined) {
                setNetWorth(forcedValue);
            }

            setIsLoading(false);
            return;
        }

        // 2. If no external prices and its a total card with forced value
        if (forcedValue !== undefined && isTotal) {
            setNetWorth(forcedValue);
            setIsLoading(false);
        } else {
            // If no external prices and not a total card with forced value,
            // we can assume no specific price info is available for stocks
            // and rely on initial values for other assets.
            // Set loading to false as no fetch is happening.
            setIsLoading(false);
        }
    }, [externalMarketPrices, stockAsset?.assetSymbol, assetItem?.assetSymbol, forcedValue, isTotal]);

    let displayValue = 0;
    let title = "";
    let subtitle = "";
    let icon = null;

    // Helper to get exchange rate (prioritize external -> marketPrices -> default)
    const currentFxRate = externalMarketPrices?.usdKrw || marketPrices?.usdKrw || initialExchange?.rate || 1400;
    const currentGoldPrice = externalMarketPrices?.goldUsd || marketPrices?.goldUsd || initialGold?.price || 2600;

    if (isTotal) {
        displayValue = forcedValue || netWorth || 0;
        title = "총 자산 현황";
        icon = <div className="size-2 rounded-full bg-[#38C798]" />;
    } else if (isStock && stockAsset) {
        // Prioritize last known good price over 0
        const price = stockPriceInfo?.price || stockAsset.avgPrice || 0;
        const currency = stockPriceInfo?.currency || stockAsset.currency || 'KRW';

        displayValue = stockAsset.amount * price * (currency === 'USD' ? currentFxRate : 1);
        title = getStockDisplayName(stockAsset.assetSymbol, stockAsset.assetSymbol, stockPriceInfo);
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
            displayValue = assetItem.amount * currentFxRate;
            title = "달러 (USD)";
            subtitle = `$${assetItem.amount.toLocaleString()}`;
            icon = <div className="size-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center"><DollarSign className="size-5 text-green-500" /></div>;
        } else if (assetItem.assetType === 'gold') {
            displayValue = (assetItem.amount / GOLD_TROY_OUNCE_GRAMS) * currentGoldPrice * currentFxRate;
            title = "금 (Gold)";
            subtitle = `${assetItem.amount.toLocaleString()}g`;
            icon = <div className="size-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center"><Coins className="size-5 text-orange-500" /></div>;
        }
    }

    const changePercent = stockPriceInfo?.changePercent || 0;
    const isUp = changePercent >= 0;

    const COLOR_UP = getUpColor();
    const COLOR_DOWN = getDownColor();

    const formattedValue = displayValue.toLocaleString(undefined, {
        maximumFractionDigits: (isStock && !stockAsset?.assetSymbol?.endsWith('.KS') && !stockAsset?.assetSymbol?.endsWith('.KQ')) ? 2 : 0
    });

    return (
        <Card
            onClick={onClick}
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
                {isTotal ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleHide?.();
                        }}
                        className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors active:scale-90"
                    >
                        {isHidden ? (
                            <EyeOff className="size-5 text-zinc-400" />
                        ) : (
                            <Eye className="size-5 text-zinc-400" />
                        )}
                    </button>
                ) : (
                    <button className="p-1 text-zinc-300 pointer-events-none">
                        <MoreHorizontal className="size-5" />
                    </button>
                )}
            </div>

            <div className="space-y-1">
                {isLoading && isStock ? (
                    <div className="h-10 w-40 bg-zinc-100 dark:bg-white/5 animate-pulse rounded-lg" />
                ) : (
                    <>
                        <div className="flex items-baseline gap-1">
                            {!isHidden && <span className="text-lg font-bold text-[#2B364B]/30 dark:text-white/20">₩</span>}
                            <h2 className="text-[32px] font-black tracking-tighter text-[#2B364B] dark:text-white leading-none flex items-center">
                                {isHidden ? (
                                    <span className="text-[64px] tracking-[0.1em] text-zinc-300 dark:text-white/10 leading-[0] pt-3 select-none">******</span>
                                ) : (
                                    formattedValue
                                )}
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
    );
}
