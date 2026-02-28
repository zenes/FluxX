'use client';

import React, { useState, useMemo } from 'react';
import {
    Sheet,
    SheetContent,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    X,
    TrendingUp,
    PieChart as PieChartIcon,
    Wallet,
    DollarSign,
    Gem,
    ArrowUpRight,
    TrendingDown,
} from 'lucide-react';
import { AssetItem } from '@/lib/actions';
import { MarketPrices } from '@/lib/calculations';
import { cn } from '@/lib/utils';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

interface AssetGrowthDetailSheetV2Props {
    isOpen: boolean;
    onClose: () => void;
    assets: AssetItem[];
    marketPrices: MarketPrices;
    totalNetWorth: number;
}

const VIEW_MODES = [
    { id: 'growth', label: '증감', icon: TrendingUp },
    { id: 'distribution', label: '분류', icon: PieChartIcon },
];

const COLORS = ['#38C798', '#FF4F60', '#2684FE', '#FBBF24', '#A855F7', '#6366F1'];

export default function AssetGrowthDetailSheetV2({
    isOpen,
    onClose,
    assets,
    marketPrices,
    totalNetWorth,
}: AssetGrowthDetailSheetV2Props) {
    const [viewMode, setViewMode] = useState<'growth' | 'distribution'>('growth');
    const { usdKrw, goldUsd, stockPrices } = marketPrices;

    // Dummy Growth Data (as requested)
    const growthData = useMemo(() => {
        const data = [];
        const now = new Date();
        const baseValue = totalNetWorth * 0.9;
        for (let i = 30; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const randomVolatility = 1 + (Math.random() * 0.1 - 0.03); // -3% to +7% trend
            data.push({
                date: `${date.getMonth() + 1}/${date.getDate()}`,
                value: Math.floor(baseValue * (1 + (30 - i) * 0.003) * randomVolatility),
            });
        }
        return data;
    }, [totalNetWorth]);

    // Real Distribution Data
    const distributionData = useMemo(() => {
        const categories = [
            {
                name: '원화 현금',
                value: assets.filter(a => a.assetType === 'krw').reduce((sum, a) => sum + a.amount, 0),
                color: '#00D1FF'
            },
            {
                name: '달러 현금',
                value: assets.filter(a => a.assetType === 'usd').reduce((sum, a) => sum + a.amount, 0) * usdKrw,
                color: '#4ADE80'
            },
            {
                name: '금(Gold)',
                value: (assets.filter(a => a.assetType === 'gold').reduce((sum, a) => sum + a.amount, 0) / 31.1034768) * goldUsd * usdKrw,
                color: '#FBBF24'
            },
            {
                name: '주식',
                value: assets
                    .filter(a => a.assetType === 'stock')
                    .reduce((sum, a) => {
                        const symbol = a.assetSymbol!;
                        const price = stockPrices[symbol]?.price || a.avgPrice || 0;
                        const currency = a.currency || stockPrices[symbol]?.currency || 'USD';
                        const value = a.amount * price;
                        return sum + (currency === 'KRW' ? value : value * usdKrw);
                    }, 0),
                color: '#38C798'
            }
        ].filter(c => c.value > 0);

        return categories.sort((a, b) => b.value - a.value);
    }, [assets, usdKrw, goldUsd, stockPrices]);

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
                        <span>Total Assets Analysis</span>
                        <button onClick={onClose} className="p-1 rounded-full bg-zinc-50 dark:bg-white/5 text-zinc-400">
                            <X className="size-4" />
                        </button>
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <SheetTitle className="text-2xl font-black text-[#2B364B] dark:text-white tracking-tight leading-none mb-1">
                                총 자산 현황
                            </SheetTitle>
                            <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Net Worth</p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-baseline gap-1 justify-end">
                                <span className="text-sm font-bold text-zinc-300">₩</span>
                                <span className="text-3xl font-black text-[#2B364B] dark:text-white tracking-tighter leading-none">
                                    {totalNetWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mode Toggle */}
                <div className="flex justify-center gap-1 mt-6 px-6">
                    {VIEW_MODES.map(mode => (
                        <button
                            key={mode.id}
                            onClick={() => setViewMode(mode.id as any)}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black transition-all",
                                viewMode === mode.id
                                    ? "bg-[#38C798] text-white shadow-lg shadow-[#38C798]/20"
                                    : "bg-zinc-100 dark:bg-white/5 text-zinc-400"
                            )}
                        >
                            <mode.icon className="size-4" />
                            {mode.label}
                        </button>
                    ))}
                </div>

                {/* Chart Area */}
                <div className="w-full h-72 mt-8 px-4 relative flex items-center justify-center">
                    {viewMode === 'growth' ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={growthData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#38C798" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#38C798" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888810" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#888' }}
                                    interval={6}
                                />
                                <YAxis hide domain={['dataMin - 1000000', 'dataMax + 1000000']} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [`₩${value.toLocaleString()}`, '자산']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#38C798"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="relative w-full h-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <defs>
                                        {distributionData.map((entry, index) => (
                                            <linearGradient key={`grad-${index}`} id={`grad-${index}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                                                <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <Pie
                                        data={distributionData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={68}
                                        outerRadius={88}
                                        paddingAngle={4}
                                        dataKey="value"
                                        strokeWidth={2}
                                        animationBegin={0}
                                        animationDuration={800}
                                    >
                                        {distributionData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={`url(#grad-${index})`}
                                                stroke={entry.color}
                                                className="hover:opacity-90 transition-opacity outline-none"
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: any) => [`₩${value.toLocaleString()}`, '자산']}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Central Label for richness */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Total</p>
                                <p className="text-xl font-black text-[#2B364B] dark:text-white tracking-tighter">
                                    <span className="text-xs mr-0.5 opacity-30">₩</span>
                                    {(totalNetWorth / 1000000).toFixed(1)}M
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Distribution Legend or Growth Info */}
                <div className="px-6 pb-12 pt-6 space-y-4 overflow-y-auto max-h-[40vh] hide-scrollbar">
                    {viewMode === 'distribution' ? (
                        <div className="space-y-3">
                            {distributionData.map((item, index) => (
                                <div key={index} className="flex items-center justify-between bg-zinc-50 dark:bg-white/5 p-4 rounded-3xl">
                                    <div className="flex items-center gap-3">
                                        <div className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-sm font-bold text-zinc-500">{item.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-[#2B364B] dark:text-white">
                                            {((item.value / totalNetWorth) * 100).toFixed(1)}%
                                        </p>
                                        <p className="text-[10px] text-zinc-400 font-bold">
                                            ₩{item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-zinc-50 dark:bg-white/5 p-6 rounded-[32px] border border-zinc-100 dark:border-white/5">
                            <p className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-widest">Growth Note</p>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                                현재 자산 증감 데이터가 충분하지 않아 임시 데이터로 추이를 보여드리고 있습니다. 매일 정해진 시간에 자산 현황을 기록하여 실제 증감 그래프를 구성할 예정입니다.
                            </p>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
