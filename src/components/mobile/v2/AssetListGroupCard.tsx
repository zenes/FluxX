'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { AssetItem } from '@/lib/actions';
import { Building2, Plus, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Sparkline } from './Sparkline';
import { MarketPrices } from '@/lib/calculations';

interface AssetListGroupCardProps {
    title: string;
    icon: React.ElementType;
    assets: AssetItem[];
    onAssetClick?: (asset: AssetItem) => void;
    exchangeRate: number;
    type: 'stock' | 'other';
    marketPrices?: MarketPrices | null;
    debugLabel?: string;
}

export default function AssetListGroupCard({
    title,
    icon: Icon,
    assets,
    onAssetClick,
    exchangeRate,
    type,
    marketPrices,
    debugLabel
}: AssetListGroupCardProps) {
    if (assets.length === 0) return null;

    const formatPrice = (currency: string, price: number) => {
        return price.toLocaleString(undefined, {
            minimumFractionDigits: currency === 'KRW' ? 0 : 2,
            maximumFractionDigits: 2
        });
    };

    return (
        <div className="bg-white dark:bg-[#1A1A1E] rounded-[32px] shadow-sm border border-zinc-100 dark:border-white/5 overflow-hidden flex flex-col">
            <header className="px-6 pt-5 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400">
                        <Icon className="size-4" />
                    </div>
                    <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                        {title}
                        {debugLabel && <span className="text-[10px] font-black opacity-30 ml-1">[{debugLabel}]</span>}
                    </span>
                </div>
                <span className="text-[10px] font-black text-zinc-300 dark:text-zinc-600 bg-zinc-50 dark:bg-white/5 px-2 py-0.5 rounded-full">
                    {assets.length} ITEMS
                </span>
            </header>

            <div className="flex flex-col px-2 pb-2">
                {assets.map((asset, index) => {
                    const isStock = asset.assetType === 'stock';
                    const isUSD = asset.currency === 'USD';

                    const priceData = isStock ? marketPrices?.stockPrices?.[asset.assetSymbol || ''] : null;
                    const currentPrice = priceData?.price || asset.avgPrice || 0;
                    const changeRate = priceData?.changePercent || 0;
                    const isUp = changeRate >= 0;
                    const sign = isUp ? "+" : "";
                    const themeColorClass = isUp ? "bg-[#FF3B2F]" : "bg-[#35C759]";

                    // For stock, we show ticker as primary. For others, we show assetType or symbol.
                    const mainLabel = isStock ? asset.assetSymbol : (asset.assetType === 'krw' ? '현금 (KRW)' : (asset.assetType === 'usd' ? '현금 (USD)' : asset.assetType.toUpperCase()));

                    if (isStock) {
                        const avgPrice = asset.avgPrice || 0;
                        const bookValue = avgPrice * asset.amount;
                        const marketValue = currentPrice * asset.amount;
                        const unrealizedPnl = marketValue - bookValue;
                        const returnRate = bookValue > 0 ? (unrealizedPnl / bookValue) * 100 : 0;
                        const isPersonalUp = unrealizedPnl >= 0;
                        const personalSign = isPersonalUp ? "+" : "";
                        const personalThemeColorClass = isPersonalUp ? "bg-[#FF3B2F]" : "bg-[#35C759]";

                        return (
                            <button
                                key={asset.id || index}
                                onClick={() => onAssetClick?.(asset)}
                                className={cn(
                                    "flex items-center justify-between py-4 px-4 w-full text-left active:opacity-60 transition-opacity rounded-2xl hover:bg-zinc-50 dark:hover:bg-white/5",
                                    index !== assets.length - 1 && "border-b border-zinc-100 dark:border-white/5"
                                )}
                            >
                                {/* Left: Ticker & Name */}
                                <div className="flex flex-col gap-0.5 flex-1 min-w-0 pr-2">
                                    <span className="text-[15px] font-bold text-zinc-900 dark:text-white uppercase tracking-tight truncate">
                                        {asset.assetSymbol}
                                    </span>
                                    <span className="text-[12px] text-zinc-500 dark:text-zinc-400 line-clamp-1 break-all uppercase font-bold tracking-tighter">
                                        {asset.amount.toLocaleString()} SHARES
                                    </span>
                                </div>

                                {/* Right Group: Sparkline + Profit & ROI Badge */}
                                <div className="flex items-center gap-4">
                                    <Sparkline isUp={isUp} data={(priceData as any)?.sparkline} />
                                    <div className="flex flex-col items-end gap-1.5 min-w-[80px]">
                                        <span className={cn(
                                            "text-[14px] font-bold",
                                            isPersonalUp ? "text-[#FF3B2F]" : "text-[#35C759]"
                                        )}>
                                            {isUSD ? '$' : '₩'}{formatPrice(asset.currency || 'USD', Math.abs(unrealizedPnl))}
                                        </span>
                                        <div className={cn(
                                            "px-2 py-0.5 rounded-[6px] text-[11px] font-bold text-white min-w-[60px] text-center",
                                            personalThemeColorClass
                                        )}>
                                            {personalSign}{returnRate.toFixed(2)}%
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    }

                    return (
                        <button
                            key={asset.id || index}
                            onClick={() => onAssetClick?.(asset)}
                            className={cn(
                                "flex items-center justify-between p-4 w-full text-left active:opacity-60 transition-opacity rounded-2xl hover:bg-zinc-50 dark:hover:bg-white/5",
                            )}
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                                <div className="size-10 rounded-xl bg-zinc-50 dark:bg-white/5 flex items-center justify-center">
                                    {isStock ? (
                                        <span className="text-[10px] font-black text-zinc-400 uppercase">{asset.assetSymbol?.slice(0, 2)}</span>
                                    ) : (
                                        <Building2 className="size-5 text-zinc-300" />
                                    )}
                                </div>
                                <div className="flex flex-col gap-0.5 min-w-0">
                                    <span className="text-[15px] font-black text-zinc-900 dark:text-white uppercase tracking-tight truncate">
                                        {mainLabel}
                                    </span>
                                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-tighter truncate">
                                        {asset.amount.toLocaleString()} {isStock ? 'Shares' : (asset.assetType === 'gold' ? 'g' : '')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-0.5">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-[15px] font-black text-zinc-900 dark:text-white">
                                        {type === 'stock' ? (
                                            // Real price would come from marketPrices, but here we show estimate or evaluation
                                            '상세보기'
                                        ) : (
                                            asset.amount.toLocaleString()
                                        )}
                                    </span>
                                    {type !== 'stock' && (
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase">{asset.assetType === 'krw' ? '원' : (asset.assetType === 'usd' ? '$' : 'g')}</span>
                                    )}
                                </div>
                                {type === 'stock' ? (
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-[#38C798]">
                                        <span>구조 분석 완료</span>
                                        <ChevronRight className="size-3" />
                                    </div>
                                ) : (
                                    <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Available</p>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
