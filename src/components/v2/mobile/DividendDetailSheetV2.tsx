'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Calendar, ArrowRight, Wallet, PieChart } from 'lucide-react';
import { MonthlyDividend } from '@/lib/dividend-utils';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DividendDetailSheetV2Props {
    isOpen: boolean;
    onClose: () => void;
    monthlyData: MonthlyDividend[];
    historicalMonthlyData: MonthlyDividend[];
    annualTotal: number;
    historicalAnnualTotal: number;
}

export default function DividendDetailSheetV2({ isOpen, onClose, monthlyData, historicalMonthlyData, annualTotal, historicalAnnualTotal }: DividendDetailSheetV2Props) {
    const chartData = useMemo(() => {
        return monthlyData.map((d, i) => ({
            name: `${i + 1}월`,
            projected: d.amount,
            actual: historicalMonthlyData[i]?.amount || 0,
            stocks: d.stocks
        }));
    }, [monthlyData, historicalMonthlyData]);

    const cumulativeData = useMemo(() => {
        let cumulative = 0;
        return monthlyData.map((d, i) => {
            cumulative += d.amount;
            return {
                name: `${i + 1}월`,
                cumulative,
                monthly: d.amount
            };
        });
    }, [monthlyData]);

    const maxMonthlyAmount = Math.max(...monthlyData.map(d => d.amount), 1);

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
                        className="fixed inset-x-0 bottom-0 h-[85vh] bg-[#F4F7F9] dark:bg-[#09090B] rounded-t-[40px] z-[101] flex flex-col shadow-2xl overflow-hidden"
                    >
                        {/* Grab Handle */}
                        <div className="w-full h-1.5 flex justify-center pt-3 pb-6 shrink-0">
                            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-800 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="px-6 pb-4 shrink-0">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                                        배당 포트폴리오
                                    </h2>
                                    <p className="text-sm text-zinc-500 font-bold">연간 예상 배당금 흐름 분석</p>
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
                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Annual Est. Projection</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-bold text-primary/50">₩</span>
                                    <span className="text-4xl font-black text-white tracking-tighter">
                                        {annualTotal.toLocaleString()}
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
                        </div>

                        {/* Body / Scroll Area */}
                        <div className="flex-1 overflow-y-auto px-6 pb-10 space-y-8 scroll-smooth no-scrollbar">
                            
                            {/* Monthly Projection Chart */}
                            <section>
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                        <PieChart className="size-4 text-primary" />
                                        월별 배당 분포
                                    </h3>
                                </div>
                                <div className="bg-white dark:bg-[#121214] rounded-[32px] p-6 border border-zinc-100 dark:border-white/5 h-64 shadow-sm">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                                            <XAxis 
                                                dataKey="name" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#888', fontSize: 10, fontWeight: 700 }}
                                            />
                                            <YAxis hide domain={[0, 'dataMax + 10000']} />
                                            <Tooltip 
                                                cursor={{ fill: '#88888810' }}
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <div className="bg-zinc-900 p-3 rounded-2xl shadow-2xl border border-white/10 min-w-[140px]">
                                                                <p className="text-[10px] font-bold text-zinc-500 mb-2">{data.name}</p>
                                                                <div className="space-y-1 mb-3">
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-[10px] text-zinc-400 font-bold">Projected</span>
                                                                        <span className="text-[11px] text-white font-black">₩{data.projected.toLocaleString()}</span>
                                                                    </div>
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-[10px] text-zinc-400 font-bold">Actual</span>
                                                                        <span className="text-[11px] text-[#38C798] font-black">₩{data.actual.toLocaleString()}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="pt-2 border-t border-white/5 space-y-1">
                                                                    <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Stocks Paying</p>
                                                                    {data.stocks.slice(0, 3).map((s: any, idx: number) => (
                                                                        <div key={idx} className="flex justify-between items-center gap-4">
                                                                            <span className="text-[9px] font-bold text-zinc-400">{s.symbol}</span>
                                                                            <span className="text-[9px] font-black text-primary">₩{s.amount.toLocaleString()}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Bar dataKey="projected" radius={[4, 4, 0, 0]} barSize={12}>
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-proj-${index}`} fill="#88888820" />
                                                ))}
                                            </Bar>
                                            <Bar dataKey="actual" radius={[4, 4, 0, 0]} barSize={12}>
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-act-${index}`} fill="#38C798" />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </section>

                            {/* Monthly Details List */}
                            <section>
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                        <Calendar className="size-4 text-primary" />
                                        상세 월별 분석
                                    </h3>
                                    <div className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded-lg">CUMULATIVE_VIEW</div>
                                </div>
                                <div className="space-y-3">
                                    {monthlyData.map((data, idx) => (
                                        <div 
                                            key={idx} 
                                            className={cn(
                                                "bg-white dark:bg-[#121214] rounded-[28px] p-5 border shadow-sm transition-all duration-300",
                                                data.amount > 0 ? "border-[#38C798]/20" : "border-zinc-100 dark:border-white/5 opacity-60"
                                            )}
                                        >
                                            <div className="flex justify-between items-center mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "size-10 rounded-2xl flex items-center justify-center font-black text-sm",
                                                        data.amount > 0 ? "bg-primary text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                                                    )}>
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-zinc-900 dark:text-white">{idx + 1}월 배당금</h4>
                                                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">
                                                            {data.stocks.length} Stocks projecting
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[14px] font-black text-zinc-900 dark:text-white">₩{historicalMonthlyData[idx].amount.toLocaleString()}</span>
                                                        <span className="text-[10px] font-bold text-zinc-400">/ ₩{data.amount.toLocaleString()}</span>
                                                    </div>
                                                    <div className="text-[9px] font-bold text-zinc-400 mt-1">
                                                        누적: ₩{cumulativeData[idx].cumulative.toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>

                                            {data.amount > 0 && (
                                                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-zinc-100 dark:border-white/5">
                                                    {data.stocks.map((stock, sIdx) => (
                                                        <div key={sIdx} className="bg-zinc-50 dark:bg-white/5 rounded-xl px-3 py-1.5 flex items-center gap-2 border border-zinc-100 dark:border-white/5">
                                                            <span className="text-[10px] font-black text-zinc-900 dark:text-white">{stock.symbol}</span>
                                                            <div className="w-px h-2.5 bg-zinc-300 dark:bg-white/10" />
                                                            <span className="text-[10px] font-bold text-primary">₩{stock.amount.toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
