'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Settings2, Check, X, TrendingUp, TrendingDown, GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardTitle } from '@/components/ui/card';
import {
    Sheet,
    SheetContent,
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
    { name: '웜 그레이', class: 'bg-[#F5F5F7]', isDark: false },
    { name: '소프트 슬레이트', class: 'bg-[#EBEDF0]', isDark: false },
    { name: '딥 슬레이트', class: 'bg-[#3A3F47]', isDark: true },
    { name: '차콜', class: 'bg-[#2C2C2E]', isDark: true },

    { name: '뮤트 블루', class: 'bg-[#6B8EAD]', isDark: true },
    { name: '더스티 블루', class: 'bg-[#8E9AAF]', isDark: true },
    { name: '미드나잇 블루', class: 'bg-[#1C2A3A]', isDark: true },
    { name: '딥 로얄', class: 'bg-[#2E3A59]', isDark: true },

    { name: '세이지 그린', class: 'bg-[#84A59D]', isDark: true },
    { name: '올리브 드랍', class: 'bg-[#6B705C]', isDark: true },
    { name: '딥 포레스트', class: 'bg-[#2D3A3A]', isDark: true },
    { name: '뮤트 모스', class: 'bg-[#A5A58D]', isDark: true },

    { name: '더스티 로즈', class: 'bg-[#B5838D]', isDark: true },
    { name: '뮤트 테라코타', class: 'bg-[#A26769]', isDark: true },
    { name: '올드 로즈', class: 'bg-[#6D597A]', isDark: true },
    { name: '버건디', class: 'bg-[#5F0F40]', isDark: true },

    { name: '파우더 블루', class: 'bg-[#DDE5ED]', isDark: false },
    { name: '미스트', class: 'bg-[#F2F4F7]', isDark: false },
    { name: '티 그린', class: 'bg-[#F0F4EF]', isDark: false },
    { name: '샌드', class: 'bg-[#EAE2B7]/30', isDark: false },

    { name: '에스프레소', class: 'bg-[#3D3131]', isDark: true },
    { name: '네이비', class: 'bg-[#002147]', isDark: true },
    { name: '아이언', class: 'bg-[#434343]', isDark: true },
    { name: '옵시디언', class: 'bg-[#1A1A1A]', isDark: true },

    { name: '화이트 실크', class: 'bg-white border-zinc-100', isDark: false },
    { name: '아이보리', class: 'bg-[#FFFFF0]', isDark: false },
    { name: '클라우드', class: 'bg-[#F8F9FA]', isDark: false },
    { name: '페블', class: 'bg-[#D1D5DB]/30', isDark: false },
];

interface SimpleModeCardProps {
    id: string | number;
    initialAssets?: AssetItem[];
    initialExchange?: { rate: number };
    initialGold?: { price: number };
    stockAsset?: AssetItem;
    isReorderMode?: boolean;
    onLongPress?: () => void;
}

export default function SimpleModeCard({
    id,
    initialAssets,
    initialExchange,
    initialGold,
    stockAsset,
    isReorderMode,
    onLongPress
}: SimpleModeCardProps) {
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [isOpen, setIsOpen] = useState(false);
    const [netWorth, setNetWorth] = useState<number | null>(null);
    const [stockPriceInfo, setStockPriceInfo] = useState<{ price: number; currency: string; change?: number; changePercent?: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const storageKey = `fluxx-card-color-${id}`;

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
                } else if ((id === 'total' || id === 1) && initialAssets) {
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

    // Long Press Logic only for Settings button
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [ignoreNextClick, setIgnoreNextClick] = useState(false);

    const handleLongPressStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (isReorderMode) return;
        setIgnoreNextClick(false);
        timerRef.current = setTimeout(() => {
            onLongPress?.();
            setIgnoreNextClick(true);
        }, 3000);
    };

    const handleLongPressEnd = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    const handleSettingsClick = (e: React.MouseEvent) => {
        if (ignoreNextClick || isReorderMode) {
            e.preventDefault();
            e.stopPropagation();
            setIgnoreNextClick(false);
            return;
        }
        setIsOpen(true);
    };

    return (
        <motion.div
            animate={isReorderMode ? {
                scale: 1.02,
                y: -5,
                transition: { type: 'spring', stiffness: 300, damping: 20 }
            } : { scale: 1, y: 0 }}
            className="w-full"
        >
            <Card
                className={cn(
                    "relative overflow-hidden transition-all duration-700 border-none rounded-[32px] ring-1 ring-black/5 select-none",
                    selectedColor.class,
                    isReorderMode ? "shadow-2xl opacity-90 ring-primary/30" : "shadow-sm"
                )}
            >
                {isReorderMode && (
                    <div className="absolute top-5 left-5 z-10 animate-in fade-in duration-500">
                        <div className={cn(
                            "p-2 rounded-full backdrop-blur-sm",
                            isDark ? "bg-white/10 text-white" : "bg-black/5 text-zinc-900"
                        )}>
                            <GripVertical className="size-5 opacity-50" />
                        </div>
                    </div>
                )}

                <div className="absolute top-5 right-5 z-10 transition-opacity duration-300" style={{ opacity: isReorderMode ? 0.3 : 1 }}>
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <button
                                onMouseDown={handleLongPressStart}
                                onMouseUp={handleLongPressEnd}
                                onMouseLeave={handleLongPressEnd}
                                onTouchStart={handleLongPressStart}
                                onTouchEnd={handleLongPressEnd}
                                onClick={handleSettingsClick}
                                className={cn(
                                    "p-2 rounded-full active:scale-90 transition-all backdrop-blur-sm relative",
                                    isDark ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10"
                                )}
                            >
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
                                    {id === 'total' || id === 1 ? "통합 포트폴리오" : `테스트 모듈 #${id}`}
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
                                    <span className={cn("text-[10px] font-black tracking-widest uppercase", isDark ? "text-white/30" : "text-zinc-300")}>보안 실시간 동기화</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
