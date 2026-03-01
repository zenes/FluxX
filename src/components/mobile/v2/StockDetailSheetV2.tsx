'use client';

import React, { useState, useEffect } from 'react';
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
    Trash2,
} from 'lucide-react';
import { AssetItem, deleteStockAssetAllEntries, deleteStockEntry } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
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
import { useRouter } from 'next/navigation';

interface StockDetailSheetV2Props {
    isOpen: boolean;
    onClose: () => void;
    stockAsset: AssetItem | null;
    currentPrice: number | null;
    changePercent: number | null;
    exchangeRate: number;
    totalNetWorth: number;
    title?: string;
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
    title,
}: StockDetailSheetV2Props) {
    const [activeRange, setActiveRange] = useState('1M');
    const [chartData, setChartData] = useState<any[]>([]);
    const [isLoadingChart, setIsLoadingChart] = useState(false);
    const [hoveredData, setHoveredData] = useState<{ price: number; time: string } | null>(null);

    // Verification Modal State
    const [verification, setVerification] = useState<{
        isOpen: boolean;
        entryId: string | null;
        targetPin: string;
        currentInput: string;
        isDeleting: boolean;
    }>({
        isOpen: false,
        entryId: null,
        targetPin: '',
        currentInput: '',
        isDeleting: false,
    });

    const router = useRouter();

    const openVerification = (entryId: string) => {
        const pin = Math.floor(1000 + Math.random() * 9000).toString();
        setVerification({
            isOpen: true,
            entryId,
            targetPin: pin,
            currentInput: '',
            isDeleting: false,
        });
    };

    const handlePinInput = (digit: string) => {
        if (verification.currentInput.length >= 4) return;
        const newInput = verification.currentInput + digit;

        setVerification(prev => ({ ...prev, currentInput: newInput }));

        if (newInput.length === 4) {
            console.log(`handlePinInput: PIN complete. Entered: ${newInput}, Target: ${verification.targetPin}`);
            if (newInput === verification.targetPin) {
                if (verification.entryId) {
                    confirmDeletion(verification.entryId);
                } else {
                    console.error("handlePinInput: No entryId found in verification state!");
                }
            } else {
                console.log("handlePinInput: PIN mismatch.");
                // Reset after a short delay if wrong
                setTimeout(() => {
                    setVerification(p => ({ ...p, currentInput: '' }));
                }, 500);
            }
        }
    };

    const confirmDeletion = async (entryId: string) => {
        if (!stockAsset?.assetSymbol) return;
        setVerification(prev => ({ ...prev, isDeleting: true }));

        try {
            const res = await deleteStockEntry(entryId, stockAsset.assetSymbol);
            if (res.success) {
                setVerification({ isOpen: false, entryId: null, targetPin: '', currentInput: '', isDeleting: false });
                router.refresh();
            } else {
                setVerification(prev => ({ ...prev, isDeleting: false }));
            }
        } catch (err) {
            console.error("Failed to delete entry:", err);
            setVerification(prev => ({ ...prev, isDeleting: false }));
            alert("기록 삭제 중 오류가 발생했습니다.");
        }
    };

    const handleDeleteEntry = (entryId: string) => {
        openVerification(entryId);
    };

    // Robust Currency Detection
    const isKRStock = stockAsset?.assetSymbol?.endsWith('.KS') || stockAsset?.assetSymbol?.endsWith('.KQ') || stockAsset?.currency === 'KRW';
    const isUSD = !isKRStock;

    useEffect(() => {
        if (!isOpen || !stockAsset?.assetSymbol) return;

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
    }, [isOpen, stockAsset?.assetSymbol, activeRange, isKRStock]);

    const handleDelete = async () => {
        if (!stockAsset?.assetSymbol) return;

        const confirmed = window.confirm(`정말 ${title || stockAsset.assetSymbol} 자산의 모든 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`);
        if (!confirmed) return;

        try {
            const res = await deleteStockAssetAllEntries(stockAsset.assetSymbol);
            if (res.success) {
                onClose();
                window.location.reload();
            }
        } catch (err) {
            console.error("Failed to delete asset:", err);
            alert("자산 삭제 중 오류가 발생했습니다.");
        }
    };


    const currentPriceInKrw = currentPrice
        ? (isUSD ? currentPrice * exchangeRate : currentPrice)
        : 0;

    // Display price: if hovering, show that. Otherwise show current.
    const displayPriceKrw = hoveredData
        ? (isUSD ? hoveredData.price * exchangeRate : hoveredData.price)
        : currentPriceInKrw;

    const totalValueKrw = currentPriceInKrw * (stockAsset?.amount || 0);

    const computedAvgPrice = (() => {
        if (stockAsset?.entries && stockAsset.entries.length > 0) {
            const totalCost = stockAsset.entries.reduce((s, e) => s + e.totalCost, 0);
            const totalQty = stockAsset.entries.reduce((s, e) => s + e.qty, 0);
            return totalQty > 0 ? totalCost / totalQty : (stockAsset.avgPrice || 0);
        }
        return stockAsset?.avgPrice || 0;
    })();

    const avgPriceKrw = isUSD ? computedAvgPrice * exchangeRate : computedAvgPrice;
    const bookValue = avgPriceKrw * (stockAsset?.amount || 0);
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
                            <span className="text-[13px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                                {stockAsset?.assetSymbol || '---'}
                                <span className="text-[10px] font-black opacity-30">[F]</span>
                            </span>
                            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                                {title || stockAsset?.assetSymbol || '---'}
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
                                { label: '보유 수량', value: `${(stockAsset?.amount || 0).toLocaleString()}주` },
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

                    {/* Purchase History Section */}
                    {stockAsset?.entries && stockAsset.entries.length > 0 && (
                        <div className="px-6 mt-10">
                            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 px-1">매수 이력</h3>
                            <div className="space-y-3">
                                {stockAsset.entries.map((entry, idx) => {
                                    const entryAvgPrice = entry.qty > 0 ? entry.totalCost / entry.qty : 0;
                                    const entryAvgPriceInKrw = isUSD ? entryAvgPrice * exchangeRate : entryAvgPrice;
                                    const entryCurrentValueInKrw = (isUSD ? (currentPrice || 0) * exchangeRate : (currentPrice || 0)) * entry.qty;
                                    const entryTotalCostInKrw = isUSD ? entry.totalCost * exchangeRate : entry.totalCost;
                                    const entryPnl = entryCurrentValueInKrw - entryTotalCostInKrw;
                                    const entryReturnRate = entryTotalCostInKrw > 0 ? (entryPnl / entryTotalCostInKrw) * 100 : 0;
                                    const isEntryPositive = entryPnl >= 0;

                                    return (
                                        <div key={entry.id || idx} className="relative group overflow-hidden rounded-3xl">
                                            {/* Delete Button (Background) */}
                                            <div className="absolute inset-0 bg-[#FF3B2F] flex justify-end items-center px-6">
                                                <button
                                                    onClick={() => handleDeleteEntry(entry.id)}
                                                    className="flex flex-col items-center gap-1 text-white active:scale-90 transition-transform"
                                                >
                                                    <Trash2 className="size-6" />
                                                    <span className="text-[10px] font-black uppercase tracking-tighter">삭제</span>
                                                </button>
                                            </div>

                                            {/* Foreground Item */}
                                            <motion.div
                                                drag="x"
                                                dragConstraints={{ left: -80, right: 0 }}
                                                dragElastic={0.1}
                                                dragSnapToOrigin={false}
                                                onDragEnd={(e, info) => {
                                                    // If dragged more than 40px left, keep it open, otherwise snap back
                                                    if (info.offset.x > -40) {
                                                        // This part is tricky with motion.div without a controlled X.
                                                        // But dragSnapToOrigin={false} with constraints works for basic reveal.
                                                    }
                                                }}
                                                className="bg-zinc-50 dark:bg-white/5 p-4 relative z-10 border border-zinc-100 dark:border-white/5"
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="size-8 rounded-xl bg-zinc-200 dark:bg-white/10 flex items-center justify-center">
                                                            <Building2 className="size-4 text-zinc-500" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[13px] font-black text-zinc-900 dark:text-white">
                                                                {entry.predefinedAccountAlias || entry.broker}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                                                {entry.owner} {entry.account ? `• ${entry.account}` : ''}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[14px] font-black text-zinc-900 dark:text-white">
                                                            {entry.qty.toLocaleString()}주
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-zinc-100 dark:border-white/5">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-bold text-zinc-400 uppercase mb-0.5">매수 평단</span>
                                                        <span className="text-[13px] font-black text-zinc-900 dark:text-white">
                                                            {isUSD ? '$' : '₩'}{entryAvgPrice.toLocaleString(undefined, { maximumFractionDigits: isKRStock ? 0 : 2 })}
                                                        </span>
                                                        {isUSD && (
                                                            <span className="text-[10px] font-bold text-zinc-400">
                                                                ₩{entryAvgPriceInKrw.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] font-bold text-zinc-400 uppercase mb-0.5">평가 손익</span>
                                                        <span className={cn(
                                                            "text-[13px] font-black",
                                                            isEntryPositive ? "text-[#FF4F60]" : "text-[#2684FE]"
                                                        )}>
                                                            {isEntryPositive ? '+' : ''}₩{entryPnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                        </span>
                                                        <span className={cn(
                                                            "text-[10px] font-bold",
                                                            isEntryPositive ? "text-[#FF4F60]/70" : "text-[#2684FE]/70"
                                                        )}>
                                                            ({entryReturnRate.toFixed(2)}%)
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="px-6 mt-10 mb-20">
                        <button
                            onClick={handleDelete}
                            className="w-full py-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-dashed border-zinc-200 dark:border-white/10 flex items-center justify-center gap-2 group active:scale-[0.98] transition-all hover:bg-red-50 dark:hover:bg-red-900/10 hover:border-red-200 dark:hover:border-red-900/20"
                        >
                            <div className="size-6 rounded-full bg-zinc-200 dark:bg-white/10 text-zinc-500 group-hover:bg-red-500 group-hover:text-white transition-all flex items-center justify-center">
                                <Trash2 className="size-3.5" />
                            </div>
                            <span className="text-[13px] font-black text-zinc-400 group-hover:text-red-500 transition-colors uppercase tracking-tight">자산 삭제</span>
                        </button>
                    </div>

                    {/* Verification Modal Overlay (Moved inside SheetContent for correct event handling) */}
                    <AnimatePresence>
                        {verification.isOpen && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl px-6"
                            >
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                    className="w-full max-w-sm bg-white dark:bg-[#1C1C21] rounded-[40px] p-8 shadow-2xl flex flex-col items-center"
                                >
                                    <div className="size-16 rounded-3xl bg-red-500/10 flex items-center justify-center mb-6">
                                        <Trash2 className="size-8 text-red-500" />
                                    </div>

                                    <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2 text-center">정말 삭제하시겠습니까?</h3>
                                    <p className="text-zinc-500 text-sm font-bold mb-8 text-center px-4">
                                        기록을 유지하려면 아래 숫자 <span className="text-red-500 font-black">{verification.targetPin}</span>를 입력해 주세요.
                                    </p>

                                    {/* PIN Display */}
                                    <div className="flex gap-4 mb-10">
                                        {[0, 1, 2, 3].map((idx) => {
                                            const char = verification.currentInput[idx];
                                            return (
                                                <div
                                                    key={idx}
                                                    className={cn(
                                                        "size-14 rounded-2xl flex items-center justify-center text-2xl font-black transition-all border-2",
                                                        char
                                                            ? "bg-zinc-900 border-zinc-900 text-white dark:bg-white dark:border-white dark:text-zinc-900"
                                                            : "bg-transparent border-zinc-100 dark:border-white/10 text-transparent"
                                                    )}
                                                >
                                                    {verification.isDeleting && idx === verification.currentInput.length - 1 ? (
                                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        char || "•"
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Custom Keypad */}
                                    <div className={cn("grid grid-cols-3 gap-3 w-full max-w-[280px]", verification.isDeleting && "opacity-50 pointer-events-none")}>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePinInput(num.toString());
                                                }}
                                                disabled={verification.isDeleting}
                                                className="h-14 rounded-2xl bg-zinc-50 dark:bg-white/5 flex items-center justify-center text-xl font-black text-zinc-900 dark:text-white active:scale-90 active:bg-zinc-100 dark:active:bg-white/10 transition-all"
                                            >
                                                {num}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setVerification(prev => ({ ...prev, currentInput: "" }));
                                            }}
                                            disabled={verification.isDeleting}
                                            className="h-14 rounded-2xl bg-zinc-50 dark:bg-white/5 flex items-center justify-center text-sm font-black text-zinc-400 active:scale-90 transition-all"
                                        >
                                            C
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePinInput("0");
                                            }}
                                            disabled={verification.isDeleting}
                                            className="h-14 rounded-2xl bg-zinc-50 dark:bg-white/5 flex items-center justify-center text-xl font-black text-zinc-900 dark:text-white active:scale-90 transition-all"
                                        >
                                            0
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setVerification(v => ({ ...v, isOpen: false }));
                                            }}
                                            disabled={verification.isDeleting}
                                            className="h-14 rounded-2xl bg-red-500 flex items-center justify-center text-white active:scale-90 transition-all"
                                        >
                                            <X className="size-6" />
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </SheetContent>

        </Sheet>
    );
}
