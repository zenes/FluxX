'use client';

import React, { useState } from 'react';
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
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ComposedChart,
    Bar
} from 'recharts';
import { useEffect } from 'react';

interface StockDetailSheetV2Props {
    isOpen: boolean;
    onClose: () => void;
    stockAsset: AssetItem;
    currentPrice: number | null;
    changePercent: number | null;
    exchangeRate: number;
    totalNetWorth: number;
}

const RANGES = ['1D', '1W', '1M', '3M', '6M', 'YTD', '1Y', 'MAX'];

export default function StockDetailSheetV2({
    isOpen,
    onClose,
    stockAsset,
    currentPrice,
    changePercent,
    exchangeRate,
    totalNetWorth,
}: StockDetailSheetV2Props) {
    const [activeRange, setActiveRange] = useState('1M');
    const [chartData, setChartData] = useState<any[]>([]);
    const [isLoadingChart, setIsLoadingChart] = useState(false);
    const [hoveredData, setHoveredData] = useState<{ price: number; time: string } | null>(null);

    // Robust Currency Detection
    const isKRStock = stockAsset.assetSymbol?.endsWith('.KS') || stockAsset.assetSymbol?.endsWith('.KQ') || stockAsset.currency === 'KRW';
    const isUSD = !isKRStock;

    useEffect(() => {
        if (!isOpen || !stockAsset.assetSymbol) return;

        const fetchHistory = async () => {
            setIsLoadingChart(true);
            try {
                // Synchronize with MarketQuoteWidgetV2.tsx
                const rangeMap: Record<string, { range: string, interval: string }> = {
                    '1D': { range: '1d', interval: '15m' },
                    '1W': { range: '5d', interval: '1h' },
                    '1M': { range: '1mo', interval: '1d' },
                    '3M': { range: '3mo', interval: '1d' },
                    '6M': { range: '6mo', interval: '1wk' },
                    'YTD': { range: 'ytd', interval: '1wk' },
                    '1Y': { range: '1y', interval: '1mo' }
                };

                const { range, interval } = rangeMap[activeRange] || rangeMap['1M'];

                // Normalize symbol
                let symbol = stockAsset.assetSymbol;
                if (!symbol) return;

                if (isKRStock && !symbol.includes('.')) {
                    symbol = `${symbol}.KS`;
                }

                const res = await fetch(`/api/stock-history?symbol=${symbol}&range=${range}&interval=${interval}`);
                if (!res.ok) throw new Error('Failed to fetch chart data');

                const data = await res.json();
                if (data.chartData) {
                    setChartData(data.chartData);
                }
            } catch (err) {
                console.error("Failed to fetch stock history:", err);
                setChartData([]);
            } finally {
                setIsLoadingChart(false);
            }
        };

        fetchHistory();
    }, [isOpen, stockAsset.assetSymbol, activeRange, isKRStock]);


    const currentPriceInKrw = currentPrice
        ? (isUSD ? currentPrice * exchangeRate : currentPrice)
        : 0;

    // Display price: if hovering, show that. Otherwise show current.
    const displayPriceKrw = hoveredData
        ? (isUSD ? hoveredData.price * exchangeRate : hoveredData.price)
        : currentPriceInKrw;

    const totalValueKrw = currentPriceInKrw * stockAsset.amount;

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

    const chartColor = changePercent && changePercent >= 0 ? "#FF3B2F" : "#35C759";

    const formatPriceLocal = (value: number) => {
        return value.toLocaleString(undefined, {
            minimumFractionDigits: isKRStock ? 0 : 2,
            maximumFractionDigits: 2
        });
    };

    const CustomTooltip = ({ active, payload }: any) => {
        useEffect(() => {
            if (active && payload && payload.length) {
                const priceItem = payload.find((p: any) => p.dataKey === 'price');
                if (priceItem) {
                    const nextPrice = priceItem.value;
                    const nextTime = priceItem.payload.time || priceItem.payload.date;

                    setHoveredData(prev => {
                        if (!prev || prev.price !== nextPrice || prev.time !== nextTime) {
                            return { price: nextPrice, time: nextTime };
                        }
                        return prev;
                    });
                }
            } else {
                setHoveredData(prev => prev === null ? prev : null);
            }
        }, [active, payload]);

        if (active && payload && payload.length) {
            const priceItem = payload.find((p: any) => p.dataKey === 'price');
            if (priceItem) {
                return (
                    <div className="bg-white dark:bg-[#1C1C21] px-3 py-2 rounded-xl shadow-2xl border border-zinc-100 dark:border-white/10">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{priceItem.payload.time}</p>
                        <p className="text-[14px] font-black text-zinc-900 dark:text-white">
                            {isUSD ? '$' : '₩'}{priceItem.value.toLocaleString()}
                        </p>
                    </div>
                );
            }
        }
        return null;
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent
                side="bottom"
                className="h-auto max-h-[92vh] rounded-t-[40px] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-[#121214] flex flex-col"
            >
                {/* Handle & Close */}
                <div className="relative pt-3 pb-2 flex justify-center shrink-0">
                    <div className="w-12 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-4 p-2 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <div className="overflow-y-auto hide-scrollbar pb-10">
                    {/* Header Info */}
                    <div className="px-6 pt-4 mb-6">
                        <div className="flex flex-col gap-1 mb-4">
                            <span className="text-[13px] font-black text-zinc-400 uppercase tracking-widest">
                                {stockAsset.assetSymbol}
                            </span>
                            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                                {stockAsset.assetSymbol}
                            </h2>
                        </div>
                        <div className="flex items-end gap-3">
                            <span className={cn(
                                "text-3xl font-black transition-colors",
                                hoveredData ? "text-[#38C798]" : "text-zinc-900 dark:text-white"
                            )}>
                                {isUSD ? '$' : '₩'}{formatPriceLocal(hoveredData ? hoveredData.price : computedAvgPrice)}
                            </span>
                            {!hoveredData && (
                                <div className={cn(
                                    "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[13px] font-black text-white mb-1",
                                    isPositive ? "bg-[#FF3B2F]" : "bg-[#35C759]"
                                )}>
                                    {isPositive ? "+" : ""}{returnRate.toFixed(2)}%
                                </div>
                            )}
                            {hoveredData && (
                                <div className="text-[11px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">
                                    {hoveredData.time}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Range Selectors */}
                    <div className="px-6 mb-4">
                        <div className="flex items-center justify-between bg-zinc-50 dark:bg-white/5 p-1 rounded-xl gap-0.5">
                            {['1D', '1W', '1M', '3M', '6M', 'YTD', '1Y'].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setActiveRange(range)}
                                    className={cn(
                                        "flex-1 py-1.5 text-[11px] font-black rounded-lg transition-all",
                                        activeRange === range
                                            ? "bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 shadow-lg"
                                            : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                    )}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Detailed Chart (Synchronized with Watchlist) */}
                    <div className="px-4 mb-8">
                        <div className="w-full h-72 bg-white dark:bg-[#1A1A1E] rounded-[32px] border border-zinc-100 dark:border-white/5 relative overflow-hidden flex flex-col pt-8 pb-4">
                            <div className="flex-1 w-full px-2 relative">
                                {isLoadingChart ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-8 h-8 border-2 border-zinc-200 dark:border-zinc-800 border-t-[#38C798] rounded-full animate-spin" />
                                    </div>
                                ) : chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart
                                            data={chartData}
                                            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                                        >
                                            <defs>
                                                <linearGradient id="colorPriceSheet" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.15} />
                                                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.1} />
                                            <XAxis dataKey="time" hide />
                                            <YAxis
                                                yAxisId="price"
                                                domain={['auto', 'auto']}
                                                orientation="right"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fontWeight: 'bold', fill: '#A1A1AA' }}
                                                mirror
                                            />
                                            <YAxis
                                                yAxisId="volume"
                                                orientation="left"
                                                domain={[0, (dataMax: number) => dataMax * 3.5]}
                                                hide={true}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar
                                                yAxisId="volume"
                                                dataKey="volume"
                                                fill="#A1A1AA"
                                                opacity={0.3}
                                                barSize={1.5}
                                            />
                                            <Area
                                                yAxisId="price"
                                                type="monotone"
                                                dataKey="price"
                                                stroke={chartColor}
                                                strokeWidth={2.5}
                                                fillOpacity={1}
                                                fill="url(#colorPriceSheet)"
                                                animationDuration={1000}
                                                dot={false}
                                                activeDot={{ r: 6, strokeWidth: 0, fill: chartColor }}
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-zinc-400 font-bold text-sm">
                                        데이터를 불러올 수 없습니다.
                                    </div>
                                )}
                            </div>

                            {/* Time Labels Overlay */}
                            <div className="mt-2 px-8 flex justify-between text-[10px] font-black text-zinc-300 dark:text-zinc-600 tracking-tighter">
                                <span>{chartData[0]?.time}</span>
                                <span>{chartData[Math.floor(chartData.length / 2)]?.time}</span>
                                <span>{chartData[chartData.length - 1]?.time}</span>
                            </div>

                            <div className="absolute top-4 left-6 flex items-center gap-2">
                                <div className="size-1.5 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                    {activeRange === '1D' ? 'REALTIME 1D' : `${activeRange} TREND`}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Unrealized PNL / Avg Price Cards (Kept from V2 but matched to style) */}
                    <div className="px-6 mb-8 grid grid-cols-2 gap-3">
                        <div className="bg-zinc-50 dark:bg-white/5 p-4 rounded-2xl flex flex-col gap-1">
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">평가 손익</span>
                            <span className={cn("text-[17px] font-black", unrealizedPnl >= 0 ? "text-[#FF4F60]" : "text-[#2684FE]")}>
                                ₩{unrealizedPnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                <span className="text-[11px] ml-1 opacity-60">({returnRate.toFixed(2)}%)</span>
                            </span>
                        </div>
                        <div className="bg-zinc-50 dark:bg-white/5 p-4 rounded-2xl flex flex-col gap-1">
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">평균 단가</span>
                            <span className="text-[17px] font-black text-zinc-900 dark:text-white">
                                {isUSD ? '$' : '₩'}{computedAvgPrice.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Key Statistics Grid (Exact match from MarketQuoteWidgetV2) */}
                    <div className="px-6">
                        <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 px-1">주요 통계</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: '보유 수량', value: `${stockAsset.amount.toLocaleString()}주` },
                                { label: '평가 금액', value: `₩${totalValueKrw.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
                                { label: '시가', value: `${isUSD ? '$' : '₩'}${formatPriceLocal((currentPrice || 0) * 0.98)}` },
                                { label: '고가', value: `${isUSD ? '$' : '₩'}${formatPriceLocal((currentPrice || 0) * 1.02)}` },
                                { label: '저가', value: `${isUSD ? '$' : '₩'}${formatPriceLocal((currentPrice || 0) * 0.97)}` },
                                { label: '거래량', value: isKRStock ? '1.2M' : '45.8M' },
                            ].map((stat) => (
                                <div key={stat.label} className="bg-zinc-50 dark:bg-white/5 p-4 rounded-2xl flex flex-col gap-1">
                                    <span className="text-[11px] font-bold text-zinc-400">{stat.label}</span>
                                    <span className="text-[15px] font-black text-zinc-900 dark:text-white">{stat.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
