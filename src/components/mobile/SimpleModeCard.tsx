'use client';

import React, { useState, useEffect } from 'react';
import { Settings2, Check, X, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { calculateNetWorth, MarketPrices } from '@/lib/calculations';
import { AssetItem } from '@/lib/actions';

// 톤다운되고 안정된 느낌의 세련된 색상 팔레트
const COLORS = [
    // Neutral & Soft
    { name: 'Warm Gray', class: 'bg-[#F5F5F7]', isDark: false },
    { name: 'Soft Slate', class: 'bg-[#EBEDF0]', isDark: false },
    { name: 'Deep Slate', class: 'bg-[#3A3F47]', isDark: true },
    { name: 'Charcoal', class: 'bg-[#2C2C2E]', isDark: true },

    // Muted Blues & Purples
    { name: 'Muted Blue', class: 'bg-[#6B8EAD]', isDark: true },
    { name: 'Dusty Blue', class: 'bg-[#8E9AAF]', isDark: true },
    { name: 'Midnight Blue', class: 'bg-[#1C2A3A]', isDark: true },
    { name: 'Deep Royal', class: 'bg-[#2E3A59]', isDark: true },

    // Muted Greens & Earth Tones
    { name: 'Sage Green', class: 'bg-[#84A59D]', isDark: true },
    { name: 'Olive Drab', class: 'bg-[#6B705C]', isDark: true },
    { name: 'Deep Forest', class: 'bg-[#2D3A3A]', isDark: true },
    { name: 'Muted Moss', class: 'bg-[#A5A58D]', isDark: true },

    // Warm Muted Tones
    { name: 'Dusty Rose', class: 'bg-[#B5838D]', isDark: true },
    { name: 'Muted Terracotta', class: 'bg-[#A26769]', isDark: true },
    { name: 'Old Rose', class: 'bg-[#6D597A]', isDark: true },
    { name: 'Burgundy', class: 'bg-[#5F0F40]', isDark: true },

    // Light & Airy Muted
    { name: 'Powder Blue', class: 'bg-[#DDE5ED]', isDark: false },
    { name: 'Mist', class: 'bg-[#F2F4F7]', isDark: false },
    { name: 'Tea Green', class: 'bg-[#F0F4EF]', isDark: false },
    { name: 'Sand', class: 'bg-[#EAE2B7]/30', isDark: false },

    // Deep & Stable
    { name: 'Espresso', class: 'bg-[#3D3131]', isDark: true },
    { name: 'Naval', class: 'bg-[#002147]', isDark: true },
    { name: 'Iron', class: 'bg-[#434343]', isDark: true },
    { name: 'Obsidian', class: 'bg-[#1A1A1A]', isDark: true },

    // Special Finishes
    { name: 'White Silk', class: 'bg-white border-zinc-100', isDark: false },
    { name: 'Ivory', class: 'bg-[#FFFFF0]', isDark: false },
    { name: 'Cloud', class: 'bg-[#F8F9FA]', isDark: false },
    { name: 'Pebble', class: 'bg-[#D1D5DB]/30', isDark: false },
];

interface SimpleModeCardProps {
    id: number;
    initialAssets?: AssetItem[];
    initialExchange?: { rate: number };
    initialGold?: { price: number };
    stockAsset?: AssetItem;
}

export default function SimpleModeCard({ id, initialAssets, initialExchange, initialGold, stockAsset }: SimpleModeCardProps) {
    const [selectedColor, setSelectedColor] = useState(COLORS[0]); // Default Warm Gray
    const [isOpen, setIsOpen] = useState(false);
    const [netWorth, setNetWorth] = useState<number | null>(null);
    const [stockPriceInfo, setStockPriceInfo] = useState<{ price: number; currency: string; change?: number; changePercent?: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const storageKey = `fluxx-card-color-${id}`;

    // 초기 상태 로드 (localStorage)
    useEffect(() => {
        const savedColorName = localStorage.getItem(storageKey);
        if (savedColorName) {
            const foundColor = COLORS.find(c => c.name === savedColorName);
            if (foundColor) setSelectedColor(foundColor);
        }
    }, [storageKey]);

    const handleColorSelect = (color: typeof COLORS[0]) => {
        setSelectedColor(color);
        localStorage.setItem(storageKey, color.name);
        setTimeout(() => setIsOpen(false), 300);
    };

    const isDark = selectedColor.isDark;

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
                } else if (id === 1 && initialAssets) {
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
                    setNetWorth(calculateNetWorth(initialAssets, prices));
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

    return (
        <Card className={cn("relative overflow-hidden transition-all duration-700 shadow-sm border-none rounded-[32px] ring-1 ring-black/5", selectedColor.class)}>
            <div className="absolute top-5 right-5 z-10">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <button className={cn(
                            "p-2 rounded-full active:scale-90 transition-all backdrop-blur-sm",
                            isDark ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10"
                        )}>
                            <Settings2 className={cn("size-5", isDark ? "text-white/40" : "text-zinc-400")} />
                        </button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[80vh] rounded-t-[40px] p-0 overflow-hidden border-none shadow-2xl bg-white">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-50">
                            <button onClick={() => setIsOpen(false)} className="text-zinc-400 p-1">
                                <X className="size-6" />
                            </button>
                            <SheetClose asChild>
                                <button className="text-sm font-bold text-zinc-900 px-4 py-2 bg-zinc-100 rounded-full">확인</button>
                            </SheetClose>
                        </div>

                        <div className="px-8 pt-10 pb-4">
                            <div className="flex items-center gap-2.5 mb-2">
                                <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">테마 설정</h3>
                                <div className="size-2 rounded-full bg-primary animate-pulse" />
                            </div>
                            <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                                카드의 분위기를 결정할 차분하고 세련된 톤의 팔레트입니다.
                            </p>
                        </div>

                        <div className="grid grid-cols-4 gap-y-7 gap-x-5 px-8 py-8 pb-32 max-h-[55vh] overflow-y-auto hide-scrollbar">
                            {COLORS.map((color) => {
                                const isSelected = selectedColor.class === color.class;
                                return (
                                    <div key={color.name} className="flex flex-col items-center gap-2">
                                        <button
                                            onClick={() => handleColorSelect(color)}
                                            className={cn(
                                                "size-16 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-inner",
                                                color.class,
                                                isSelected ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105"
                                            )}
                                        >
                                            {isSelected && <Check className={cn("size-6", color.isDark ? "text-white" : "text-zinc-900")} />}
                                        </button>
                                        <span className="text-[10px] text-zinc-400 font-medium whitespace-nowrap">{color.name}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-zinc-100 rounded-full" />
                    </SheetContent>
                </Sheet>
            </div>

            <div className="relative p-8 pt-10">
                {/* Header Section */}
                <div className="flex items-center gap-4 mb-8">
                    {stockAsset ? (
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "size-14 rounded-[20px] flex items-center justify-center text-xl font-black shadow-inner transition-all duration-700",
                                isDark ? "bg-white/10 text-white" : "bg-black/5 text-zinc-900"
                            )}>
                                {stockAsset.assetSymbol?.charAt(0)}
                            </div>
                            <div>
                                <p className={cn(
                                    "text-lg font-bold tracking-tight mb-0.5",
                                    isDark ? "text-white" : "text-zinc-900"
                                )}>
                                    {stockAsset.assetSymbol}
                                </p>
                                <p className={cn(
                                    "text-[13px] font-semibold opacity-50",
                                    isDark ? "text-white" : "text-zinc-500"
                                )}>
                                    {stockAsset.amount.toLocaleString()}주 보유
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className={cn("size-2 rounded-full", isDark ? "bg-white/40" : "bg-zinc-400")} />
                            <CardTitle className={cn(
                                "text-xs font-bold tracking-[0.1em] opacity-40 uppercase",
                                isDark ? "text-white" : "text-zinc-500"
                            )}>
                                {id === 1 ? "Integrated Portfolio" : `Test Module #${id}`}
                            </CardTitle>
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="space-y-1.5 mt-auto">
                    {isLoading ? (
                        <div className={cn("h-12 w-56 rounded-2xl animate-pulse", isDark ? "bg-white/10" : "bg-black/5")} />
                    ) : (
                        <>
                            <div className="flex items-baseline gap-1.5 ml-[-2px]">
                                <span className={cn("text-xl font-bold opacity-30", isDark ? "text-white" : "text-zinc-900")}>₩</span>
                                <p className={cn(
                                    "text-4xl font-black tracking-tighter transition-colors duration-700",
                                    isDark ? "text-white" : "text-zinc-900"
                                )}>
                                    {(stockAsset ? stockValue : (netWorth || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </p>
                            </div>

                            {stockAsset && stockPriceInfo && (
                                <div className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-2",
                                    (stockPriceInfo.changePercent || 0) >= 0
                                        ? (isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-600")
                                        : (isDark ? "bg-rose-500/20 text-rose-400" : "bg-rose-50 text-rose-600")
                                )}>
                                    {(stockPriceInfo.changePercent || 0) >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                                    {Math.abs(stockPriceInfo.changePercent || 0).toFixed(2)}%
                                    <span className="opacity-40 font-medium ml-0.5">({stockPriceInfo.currency})</span>
                                </div>
                            )}

                            <div className="flex items-center gap-2 mt-6">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                <span className={cn("text-[10px] font-black tracking-widest uppercase", isDark ? "text-white/30" : "text-zinc-300")}>Security Live</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Card>
    );
}
