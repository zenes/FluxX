'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MonthlyDividend, YearlyHistoricalDividend } from '@/lib/dividend-utils';
import { cn } from '@/lib/utils';
import { X, TrendingUp, ArrowRight } from 'lucide-react';
import YearlyDividendChartV2 from './YearlyDividendChartV2';

interface DividendDetailSheetV2Props {
    isOpen: boolean;
    onClose: () => void;
    monthlyData: MonthlyDividend[];
    historicalMonthlyData: MonthlyDividend[];
    annualTotal: number;
    historicalAnnualTotal: number;
    allTimeTotal: number;
    yearlyHistorical: YearlyHistoricalDividend[];
}

export default function DividendDetailSheetV2({ 
    isOpen, 
    onClose, 
    monthlyData, 
    historicalMonthlyData, 
    annualTotal, 
    historicalAnnualTotal, 
    allTimeTotal, 
    yearlyHistorical 
}: DividendDetailSheetV2Props) {
    const [expandedYears, setExpandedYears] = React.useState<number[]>([]);

    const toggleYear = (year: number) => {
        setExpandedYears(prev => 
            prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
        );
    };

    // Auto-expand the most recent year if none expanded
    React.useEffect(() => {
        if (isOpen && yearlyHistorical.length > 0 && expandedYears.length === 0) {
            setExpandedYears([yearlyHistorical[0].year]);
        }
    }, [isOpen, yearlyHistorical]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-0 bg-[#F4F7F9] dark:bg-[#09090B] z-[101] flex flex-col shadow-2xl overflow-hidden"
                    >
                        {/* Unified Scroll Area */}
                        <div className="flex-1 overflow-y-auto px-6 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-10 space-y-8 scroll-smooth no-scrollbar">
                            {/* Header Section */}
                            <div className="pt-2">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                                            누적 배당 내역
                                        </h2>
                                        <p className="text-sm text-zinc-500 font-bold">기록된 전체 배당금 분석</p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/10 shadow-sm active:scale-90 transition-transform"
                                    >
                                        <X className="size-6 text-zinc-900 dark:text-white" />
                                    </button>
                                </div>

                                {/* Summary Card */}
                                <div className="bg-zinc-900 dark:bg-[#1A1A1E] rounded-[32px] p-6 shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-colors" />
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center">
                                            <TrendingUp className="size-3 text-primary" />
                                        </div>
                                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">All-time Cumulative</span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl font-bold text-primary/50">₩</span>
                                        <span className="text-4xl font-black text-white tracking-tighter">
                                            {allTimeTotal.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="mt-4 flex items-center gap-4 border-t border-white/5 pt-4">
                                        <div>
                                            <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-0.5">Actual (YTD)</div>
                                            <div className="text-sm font-black text-[#38C798]">₩{historicalAnnualTotal.toLocaleString()}</div>
                                        </div>
                                        <div className="w-px h-8 bg-white/5" />
                                        <div>
                                            <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-0.5">Achievement</div>
                                            <div className="text-sm font-black text-white/90">
                                                {annualTotal > 0 ? Math.round((historicalAnnualTotal / annualTotal) * 100) : 0}%
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-black text-zinc-900 dark:text-white">
                                            연도별 배당 추위
                                        </h3>
                                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest text-[#FF4F60]">Growth Trend</p>
                                    </div>

                                    <div className="bg-white dark:bg-[#121214] rounded-[32px] p-6 border border-zinc-100 dark:border-white/5 shadow-sm">
                                        <YearlyDividendChartV2 
                                            yearlyHistorical={yearlyHistorical} 
                                            height={200} 
                                        />
                                        
                                        <div className="mt-4 flex justify-center items-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest gap-2">
                                            <div className="size-2 rounded-full bg-[#FF4F60]" />
                                            <span>Annual Dividend Growth</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Yearly Accordion List */}
                            <section className="space-y-4">
                                {yearlyHistorical.map((yearData) => (
                                    <div key={yearData.year} className="bg-white dark:bg-[#121214] rounded-[32px] border border-zinc-100 dark:border-white/5 shadow-sm overflow-hidden">
                                        <button 
                                            onClick={() => toggleYear(yearData.year)}
                                            className="w-full px-6 py-5 flex items-center justify-between active:bg-zinc-50 dark:active:bg-white/5 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="size-12 rounded-2xl bg-zinc-900 dark:bg-zinc-800 flex items-center justify-center text-white font-black text-lg">
                                                    {yearData.year.toString().slice(-2)}
                                                </div>
                                                <div className="text-left">
                                                    <h3 className="text-base font-black text-zinc-900 dark:text-white">{yearData.year}년</h3>
                                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                                                        {yearData.months.filter(m => m.amount > 0).length} Months recorded
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right flex items-center gap-3">
                                                <div>
                                                    <div className="text-sm font-black text-zinc-900 dark:text-white">₩{yearData.totalAmount.toLocaleString()}</div>
                                                    <div className="text-[10px] font-bold text-zinc-400">yearly total</div>
                                                </div>
                                                <motion.div
                                                    animate={{ rotate: expandedYears.includes(yearData.year) ? 90 : 0 }}
                                                    className="size-8 rounded-xl bg-zinc-50 dark:bg-white/5 flex items-center justify-center border border-zinc-100 dark:border-white/5"
                                                >
                                                    <ArrowRight className="size-4 text-zinc-400" />
                                                </motion.div>
                                            </div>
                                        </button>

                                        <AnimatePresence>
                                            {expandedYears.includes(yearData.year) && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="px-6 pb-6 overflow-hidden"
                                                >
                                                    <div className="pt-2 space-y-3">
                                                        {yearData.months.filter(m => m.amount > 0).reverse().map((data, mIdx) => (
                                                            <div 
                                                                key={mIdx} 
                                                                className="bg-zinc-50 dark:bg-white/[0.03] rounded-[24px] p-4 border border-zinc-100 dark:border-white/5"
                                                            >
                                                                <div className="flex justify-between items-center mb-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="text-sm font-black text-zinc-900 dark:text-white">{data.month + 1}월</div>
                                                                        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">
                                                                            ({data.stocks.length} stocks)
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-sm font-black text-[#38C798]">
                                                                        ₩{data.amount.toLocaleString()}
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {data.stocks.map((stock, sIdx) => (
                                                                        <div key={sIdx} className="bg-white dark:bg-white/5 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 border border-zinc-100 dark:border-white/5">
                                                                            <span className="text-[10px] font-black text-zinc-900 dark:text-white">{stock.symbol}</span>
                                                                            <div className="w-px h-2.5 bg-zinc-200 dark:bg-white/10" />
                                                                            <span className="text-[10px] font-bold text-primary">₩{stock.amount.toLocaleString()}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </section>

                            {/* Empty State */}
                            {yearlyHistorical.length === 0 && (
                                <div className="py-20 flex flex-col items-center justify-center text-center">
                                    <div className="size-16 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                                        <TrendingUp className="size-8 text-zinc-400" />
                                    </div>
                                    <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-1">기록된 배당금이 없습니다</h3>
                                    <p className="text-sm text-zinc-500 font-medium">배당금을 입력하여 히스토리를 관리해보세요.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
