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
import AssetBreakdownSheet from './AssetBreakdownSheet';
import StockDetailSheet from './StockDetailSheet';

// 톤다운되고 안정된 느낌의 세련된 색상 팔레트
const COLORS = [
    { name: '웜 그레이', class: 'bg-[#F5F5F7]', hex: '#F5F5F7' },
    { name: '소프트 슬레이트', class: 'bg-[#EBEDF0]', hex: '#EBEDF0' },
    { name: '딥 슬레이트', class: 'bg-[#3A3F47]', hex: '#3A3F47' },
    { name: '차콜', class: 'bg-[#2C2C2E]', hex: '#2C2C2E' },

    { name: '뮤트 블루', class: 'bg-[#6B8EAD]', hex: '#6B8EAD' },
    { name: '더스티 블루', class: 'bg-[#8E9AAF]', hex: '#8E9AAF' },
    { name: '미드나잇 블루', class: 'bg-[#1C2A3A]', hex: '#1C2A3A' },
    { name: '딥 로얄', class: 'bg-[#2E3A59]', hex: '#2E3A59' },

    { name: '세이지 그린', class: 'bg-[#84A59D]', hex: '#84A59D' },
    { name: '올리브 드랍', class: 'bg-[#6B705C]', hex: '#6B705C' },
    { name: '딥 포레스트', class: 'bg-[#2D3A3A]', hex: '#2D3A3A' },
    { name: '뮤트 모스', class: 'bg-[#A5A58D]', hex: '#A5A58D' },

    { name: '더스티 로즈', class: 'bg-[#B5838D]', hex: '#B5838D' },
    { name: '뮤트 테라코타', class: 'bg-[#A26769]', hex: '#A26769' },
    { name: '올드 로즈', class: 'bg-[#6D597A]', hex: '#6D597A' },
    { name: '버건디', class: 'bg-[#5F0F40]', hex: '#5F0F40' },

    { name: '파우더 블루', class: 'bg-[#DDE5ED]', hex: '#DDE5ED' },
    { name: '미스트', class: 'bg-[#F2F4F7]', hex: '#F2F4F7' },
    { name: '티 그린', class: 'bg-[#F0F4EF]', hex: '#F0F4EF' },
    { name: '샌드', class: 'bg-[#EAE2B7]', hex: '#EAE2B7' },

    { name: '에스프레소', class: 'bg-[#3D3131]', hex: '#3D3131' },
    { name: '네이비', class: 'bg-[#002147]', hex: '#002147' },
    { name: '아이언', class: 'bg-[#434343]', hex: '#434343' },
    { name: '옵시디언', class: 'bg-[#1A1A1A]', hex: '#1A1A1A' },

    { name: '화이트 실크', class: 'bg-white border-zinc-100', hex: '#FFFFFF' },
    { name: '아이보리', class: 'bg-[#FFFFF0]', hex: '#FFFFF0' },
    { name: '클라우드', class: 'bg-[#F8F9FA]', hex: '#F8F9FA' },
    { name: '페블', class: 'bg-[#D1D5DB]', hex: '#D1D5DB' },
];

export const BG_THEMES = [
    { name: 'Premium Dark', hex: '#121214', label: '다크' },
    { name: 'White Silk', hex: '#F5F5F7', label: '실크' },
    { name: 'Midnight Blue', hex: '#0A111F', label: '미드나잇' },
];

/**
 * 색상의 밝기를 계산하여 어두운 색상인지 여부를 반환합니다. (WCAG 기준 상대적 밝기 수준 적용)
 * @param hex Hex 색상 코드 (예: #FFFFFF)
 * @returns 어두운 색상이면 true, 밝은 색상이면 false (Threshold: 0.5)
 */
const isColorDark = (hex: string): boolean => {
    const color = hex.replace('#', '');
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);

    // YIQ formula (https://en.wikipedia.org/wiki/YIQ)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128; // 128 is the middle point (0-255)
};

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
    const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [activeBgTheme, setActiveBgTheme] = useState(BG_THEMES[0].name);
    const [marketPrices, setMarketPrices] = useState<MarketPrices>({
        usdKrw: initialExchange?.rate || 1400,
        goldUsd: initialGold?.price || 2400,
        stockPrices: {}
    });

    const storageKey = `fluxx-card-color-${id}`;
    const bgStorageKey = 'fluxx-simple-bg-theme';

    useEffect(() => {
        const savedColorName = localStorage.getItem(storageKey);
        if (savedColorName) {
            const foundColor = COLORS.find(c => c.name === savedColorName);
            if (foundColor) setSelectedColor(foundColor);
        }

        const savedBgTheme = localStorage.getItem(bgStorageKey);
        if (savedBgTheme) {
            setActiveBgTheme(savedBgTheme);
        }
    }, [storageKey]);

    const handleColorSelect = (color: typeof COLORS[0]) => {
        setSelectedColor(color);
        localStorage.setItem(storageKey, color.name);
        setTimeout(() => setIsOpen(false), 300);
    };

    const handleBgThemeSelect = (themeName: string) => {
        setActiveBgTheme(themeName);
        localStorage.setItem(bgStorageKey, themeName);
        // Dispatch custom event for container to listen to
        window.dispatchEvent(new CustomEvent('fluxx-theme-change', { detail: { theme: themeName } }));
    };

    const isDark = isColorDark(selectedColor.hex);

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
        e.stopPropagation(); // Prevent triggering handleCardClick
        if (ignoreNextClick || isReorderMode) {
            e.preventDefault();
            e.stopPropagation();
            setIgnoreNextClick(false);
            return;
        }
        setIsOpen(true);
    };

    const handleCardClick = () => {
        if (isReorderMode) return;
        if (id === 'total' || id === 1) {
            setIsBreakdownOpen(true);
        } else if (stockAsset) {
            setIsDetailOpen(true);
        }
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
                onClick={handleCardClick}
                className={cn(
                    "relative overflow-hidden transition-all duration-700 border-none rounded-[32px] ring-1 ring-black/5 select-none animate-in fade-in slide-in-from-bottom-5",
                    selectedColor.class,
                    isReorderMode ? "shadow-2xl opacity-90 ring-primary/30" : "shadow-sm active:scale-[0.98] cursor-pointer"
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
                        <SheetContent
                            side="bottom"
                            className="h-[85vh] rounded-t-[40px] p-0 overflow-hidden border-none shadow-2xl bg-white flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-50 shrink-0">
                                <button onClick={() => setIsOpen(false)} className="text-zinc-400 p-1 active:scale-90 transition-transform">
                                    <X className="size-6" />
                                </button>
                                <SheetClose asChild>
                                    <button className="text-sm font-bold text-zinc-900 px-5 py-2.5 bg-zinc-100 rounded-full active:scale-95 transition-all">확인</button>
                                </SheetClose>
                            </div>

                            <div className="flex-1 overflow-y-auto hide-scrollbar">
                                <div className="px-8 pt-10 pb-4">
                                    <div className="flex items-center gap-2.5 mb-2">
                                        <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">테마 설정</h3>
                                        <div className="size-2 rounded-full bg-primary animate-pulse" />
                                    </div>
                                    <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                                        카드의 분위기를 결정할 차분하고 세련된 톤의 팔레트입니다.
                                    </p>
                                </div>

                                <div className="grid grid-cols-4 gap-y-7 gap-x-5 px-8 pt-4 pb-10">
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
                                                    {isSelected && <Check className={cn("size-6", isColorDark(color.hex) ? "text-white" : "text-zinc-900")} />}
                                                </button>
                                                <span className="text-[10px] text-zinc-400 font-medium whitespace-nowrap">{color.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="px-8 pt-10 pb-2 border-t border-zinc-100 bg-zinc-50/30">
                                    <div className="flex items-center gap-2.5 mb-2">
                                        <h3 className="text-xl font-bold text-zinc-900 tracking-tight">배경 테마</h3>
                                    </div>
                                    <p className="text-xs text-zinc-400 font-medium mb-6">
                                        심플 모드 전체에 적용되는 프리미엄 배경 스타일입니다.
                                    </p>

                                    <div className="flex gap-4 pb-12">
                                        {BG_THEMES.map((theme) => {
                                            const isSelected = activeBgTheme === theme.name;
                                            return (
                                                <button
                                                    key={theme.name}
                                                    onClick={() => handleBgThemeSelect(theme.name)}
                                                    className={cn(
                                                        "flex-1 py-4 rounded-[20px] flex flex-col items-center gap-2 border-2 transition-all active:scale-95",
                                                        isSelected ? "border-primary bg-primary/5" : "border-zinc-200 bg-white"
                                                    )}
                                                >
                                                    <div
                                                        className="size-10 rounded-full shadow-inner ring-1 ring-black/10"
                                                        style={{ backgroundColor: theme.hex }}
                                                    />
                                                    <span className={cn(
                                                        "text-[13px] font-bold",
                                                        isSelected ? "text-primary" : "text-zinc-500"
                                                    )}>
                                                        {theme.label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-zinc-100 rounded-full" />
                        </SheetContent>
                    </Sheet>
                </div>

                <div className="relative p-8 pt-10">
                    {/* Header Section */}
                    <div className="flex items-center gap-4 mb-2">
                        {stockAsset ? (
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "size-14 rounded-[20px] flex items-center justify-center text-xl font-black shadow-inner transition-all duration-700",
                                    isDark ? "bg-white/10 text-white" : "bg-black/5 text-zinc-900"
                                )}>
                                    {stockAsset.assetSymbol?.charAt(0)}
                                </div>
                                <div>
                                    {/* 티커를 주 타이틀로, 수량을 보조로 */}
                                    <p className={cn(
                                        "text-2xl font-black tracking-tight leading-tight",
                                        isDark ? "text-white" : "text-zinc-900"
                                    )}>
                                        {stockAsset.assetSymbol}
                                    </p>
                                    <p className={cn(
                                        "text-[12px] font-semibold mt-0.5",
                                        isDark ? "text-white/60" : "text-zinc-500"
                                    )}>
                                        {stockAsset.amount.toLocaleString()}주 보유
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className={cn("size-2 rounded-full", isDark ? "bg-white/40" : "bg-zinc-400")} />
                                <CardTitle className={cn(
                                    "text-xs font-bold tracking-[0.1em] uppercase",
                                    isDark ? "text-white/80" : "text-zinc-600"
                                )}>
                                    {id === 'total' || id === 1 || id === 'total' ? "통합 포트폴리오" : `테스트 모듈 #${id}`}
                                </CardTitle>
                            </div>
                        )}
                    </div>
                    {/* Divider */}
                    <div className={cn(
                        "h-px w-full mb-4",
                        isDark ? "bg-white/10" : "bg-black/[0.06]"
                    )} />

                    {/* Content Section */}
                    <div className="space-y-1.5">
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

                                {/* USD 원래 가격 보조 표기 */}
                                {stockAsset && stockPriceInfo && stockPriceInfo.currency === 'USD' && (
                                    <p className={cn(
                                        "text-sm font-semibold mt-0.5 ml-0.5",
                                        isDark ? "text-white/50" : "text-zinc-500"
                                    )}>
                                        ${(stockAsset.amount * stockPriceInfo.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </p>
                                )}

                                {stockAsset && stockPriceInfo && (
                                    <div className={cn(
                                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-2",
                                        (stockPriceInfo.changePercent || 0) >= 0
                                            ? (isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-600")
                                            : (isDark ? "bg-rose-500/20 text-rose-400" : "bg-rose-50 text-rose-600")
                                    )}>
                                        {(stockPriceInfo.changePercent || 0) >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                                        {(stockPriceInfo.changePercent || 0) >= 0 ? '+' : ''}{(stockPriceInfo.changePercent || 0).toFixed(2)}%
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </Card>

            {/* Asset Breakdown Sheet — total card only */}
            {(id === 'total' || id === 1) && initialAssets && (
                <AssetBreakdownSheet
                    isOpen={isBreakdownOpen}
                    onClose={() => setIsBreakdownOpen(false)}
                    assets={initialAssets}
                    marketPrices={marketPrices}
                    totalNetWorth={netWorth || 0}
                    bgColor={selectedColor.hex}
                    isDark={isDark}
                />
            )}

            {/* Stock Detail Sheet */}
            {stockAsset && (
                <StockDetailSheet
                    isOpen={isDetailOpen}
                    onClose={() => setIsDetailOpen(false)}
                    stockAsset={stockAsset}
                    currentPrice={stockPriceInfo?.price ?? null}
                    changePercent={stockPriceInfo?.changePercent ?? null}
                    exchangeRate={initialExchange?.rate || 1400}
                />
            )}
        </motion.div>
    );
}
