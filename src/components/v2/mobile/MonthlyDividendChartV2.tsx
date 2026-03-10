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
import { cn } from '@/lib/utils';

interface MonthlyDividendChartV2Props {
    data: { month: number; amount: number; name: string }[];
    height?: number | string;
    year?: number;
}

export default function MonthlyDividendChartV2({ 
    data,
    height = 200,
    year
}: MonthlyDividendChartV2Props) {
    
    return (
        <div className="w-full" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
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
                                const d = payload[0].payload;
                                return (
                                    <div className="bg-zinc-900 dark:bg-zinc-800 rounded-2xl p-3 shadow-2xl border border-white/5">
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{year ? `${year}년 ` : ''}{d.month + 1}월</p>
                                        <p className="text-sm font-black text-white">₩{d.amount.toLocaleString()}</p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Bar 
                        dataKey="amount" 
                        radius={[6, 6, 6, 6]}
                        barSize={12}
                        activeBar={<Rectangle fill="var(--primary)" fillOpacity={0.8} />}
                    >
                        {data.map((entry, index) => (
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
