'use client';

import React, { useMemo } from 'react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    Cell,
    Rectangle
} from 'recharts';
import { YearlyHistoricalDividend } from '@/lib/dividend-utils';
import { cn } from '@/lib/utils';

interface YearlyDividendChartV2Props {
    yearlyHistorical: YearlyHistoricalDividend[];
    height?: number | string;
}

export default function YearlyDividendChartV2({ 
    yearlyHistorical,
    height = 200
}: YearlyDividendChartV2Props) {
    
    // Sort years chronologically for the chart
    const chartData = useMemo(() => {
        const sorted = [...yearlyHistorical].sort((a, b) => a.year - b.year);
        
        // If we have minimal data, maybe pad it or show what we have
        if (sorted.length === 0) {
            const currentYear = new Date().getFullYear();
            return [{
                name: `${currentYear}년`,
                amount: 0,
                year: currentYear
            }];
        }
        
        // If only 1 or 2 years, we might want to show at least 3 bars for visual balance?
        // Let's just show what we have for now.
        return sorted.map(y => ({
            name: `${y.year}년`,
            amount: y.totalAmount,
            year: y.year
        }));
    }, [yearlyHistorical]);

    return (
        <div className="w-full" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-zinc-100 dark:text-white/5" />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor' }}
                        className="text-zinc-400"
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor' }}
                        className="text-zinc-400"
                        tickFormatter={(value) => value === 0 ? '0' : `₩${(value / 10000).toFixed(0)}만`}
                    />
                    <Tooltip 
                        cursor={{ fill: 'currentColor', opacity: 0.05 }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <div className="bg-zinc-900 dark:bg-zinc-800 rounded-2xl p-3 shadow-2xl border border-white/5">
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{data.year}년 총 배당금</p>
                                        <p className="text-sm font-black text-white">₩{data.amount.toLocaleString()}</p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Bar 
                        dataKey="amount" 
                        radius={[6, 6, 6, 6]}
                        barSize={24}
                        activeBar={<Rectangle fill="var(--primary)" fillOpacity={0.8} />}
                    >
                        {chartData.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={entry.amount > 0 ? "var(--primary)" : "currentColor"}
                                className={cn(entry.amount > 0 ? "fill-primary" : "text-zinc-100 dark:text-white/5")}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
