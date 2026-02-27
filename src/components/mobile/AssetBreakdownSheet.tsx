'use client';

import React from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle
} from '@/components/ui/sheet';
import {
    Wallet,
    DollarSign,
    Gem,
    TrendingUp,
    X,
    ArrowUpRight,
    MoreHorizontal
} from 'lucide-react';
import { AssetItem } from '@/lib/actions';
import { MarketPrices } from '@/lib/calculations';
import { cn } from '@/lib/utils';

interface AssetBreakdownSheetProps {
    isOpen: boolean;
    onClose: () => void;
    assets: AssetItem[];
    marketPrices: MarketPrices;
    totalNetWorth: number;
    bgColor?: string;
    isDark?: boolean;
}

export default function AssetBreakdownSheet({
    isOpen,
    onClose,
    assets,
    marketPrices,
    totalNetWorth,
    bgColor = '#1C1C1E',
    isDark = true
}: AssetBreakdownSheetProps) {
    const { usdKrw, goldUsd, stockPrices } = marketPrices;

    const getCategoryData = () => {
        const categories = [
            {
                id: 'krw',
                label: '원화 현금',
                icon: Wallet,
                color: 'bg-[#00D1FF]', // Cyan-ish
                amount: assets.filter(a => a.assetType === 'krw').reduce((sum, a) => sum + a.amount, 0)
            },
            {
                id: 'usd',
                label: '달러 현금',
                icon: DollarSign,
                color: 'bg-[#4ADE80]', // Emerald
                amount: assets.filter(a => a.assetType === 'usd').reduce((sum, a) => sum + a.amount, 0) * usdKrw
            },
            {
                id: 'gold',
                label: '금(Gold)',
                icon: Gem,
                color: 'bg-[#FBBF24]', // Amber
                amount: (assets.filter(a => a.assetType === 'gold').reduce((sum, a) => sum + a.amount, 0) / 31.1034768) * goldUsd * usdKrw
            },
            {
                id: 'stock-krw',
                label: '한국 주식',
                icon: TrendingUp,
                color: 'bg-[#FF4B91]', // Vibrant Pink/Rose
                amount: assets
                    .filter(a => a.assetType === 'stock' && (a.currency === 'KRW' || stockPrices[a.assetSymbol!]?.currency === 'KRW'))
                    .reduce((sum, a) => {
                        const price = stockPrices[a.assetSymbol!]?.price || a.avgPrice || 0;
                        return sum + (a.amount * price);
                    }, 0)
            },
            {
                id: 'stock-usd',
                label: '해외 주식',
                icon: ArrowUpRight,
                color: 'bg-[#6366F1]', // Indigo
                amount: assets
                    .filter(a => a.assetType === 'stock' && (a.currency !== 'KRW' && stockPrices[a.assetSymbol!]?.currency !== 'KRW'))
                    .reduce((sum, a) => {
                        const price = stockPrices[a.assetSymbol!]?.price || a.avgPrice || 0;
                        return sum + (a.amount * price * usdKrw);
                    }, 0)
            }
        ];

        return categories.filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);
    };

    const categoryData = getCategoryData();

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent
                side="bottom"
                className="h-[90vh] rounded-t-[40px] p-0 overflow-hidden border-none shadow-2xl transition-colors duration-500 bg-white"
            >
                {/* Handle Bar */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full z-20 bg-zinc-200" />

                <div className="flex items-center justify-between px-6 py-6 border-b transition-colors duration-500 border-zinc-100 bg-white">
                    <div className="w-8" /> {/* Spacer */}
                    <SheetTitle className="text-xl font-bold transition-colors duration-500 text-zinc-900">계좌</SheetTitle>
                    <button onClick={onClose} className="p-1 active:scale-95 transition-all text-zinc-400">
                        <X className="size-6" />
                    </button>
                </div>

                <div className="p-6 pt-2 space-y-6 overflow-y-auto h-full hide-scrollbar pb-24">
                    {/* Summary Card - Styled like the reference image */}
                    <div
                        className="p-7 rounded-[32px] shadow-sm relative overflow-hidden transition-all duration-500 ring-1 bg-zinc-50 ring-zinc-100"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                            <TrendingUp className="size-24 text-zinc-900" />
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="size-10 rounded-2xl bg-[#32D74B] flex items-center justify-center">
                                <TrendingUp className="size-6 text-black" />
                            </div>
                            <p className="text-sm font-bold transition-colors duration-500 text-zinc-500">총 자산</p>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <h2 className="text-3xl font-black tracking-tighter transition-colors duration-500 text-zinc-900">
                                {totalNetWorth.toLocaleString()}
                            </h2>
                            <span className="text-xl font-bold transition-colors duration-500 text-zinc-900 opacity-30">원</span>
                        </div>
                    </div>

                    {/* Category List */}
                    <div className="space-y-6">
                        <div className="grid gap-6 px-1">
                            {categoryData.length > 0 ? (
                                categoryData.map((category) => (
                                    <div
                                        key={category.id}
                                        className="flex items-center justify-between group active:opacity-70 transition-opacity"
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Circular Icon with subtle style */}
                                            <div className="size-14 rounded-full flex items-center justify-center bg-zinc-50 text-zinc-500 shadow-sm ring-1 ring-zinc-100">
                                                <category.icon className="size-7" />
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <p className="text-[15px] font-bold leading-tight transition-colors duration-500 text-zinc-500">{category.label}</p>
                                                <div className="flex items-baseline gap-0.5">
                                                    <p className="text-xl font-black tracking-tight transition-colors duration-500 text-zinc-900">
                                                        {category.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                    </p>
                                                    <span className="text-sm font-bold transition-colors duration-500 text-zinc-900 opacity-30">원</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button className="p-2 active:scale-90 transition-transform text-zinc-300">
                                            <MoreHorizontal className="size-6" />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-zinc-600 py-10 font-medium tracking-tight">자산 데이터가 없습니다.</p>
                            )}
                        </div>
                    </div>

                    {/* Bottom Action Area Style (Optional) */}
                    <div className="pt-4 space-y-4 border-t mx-1 transition-colors duration-500 border-zinc-100">
                        <div className="flex items-center gap-4 px-2 py-1 active:opacity-60 transition-all cursor-pointer text-zinc-500">
                            <TrendingUp className="size-6" />
                            <span className="font-bold text-[16px]">계좌별 수익률</span>
                        </div>
                        <div className="flex items-center gap-4 px-2 py-1 active:opacity-60 transition-all cursor-pointer text-zinc-500">
                            <Wallet className="size-6" />
                            <span className="font-bold text-[16px]">계좌 관리</span>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
