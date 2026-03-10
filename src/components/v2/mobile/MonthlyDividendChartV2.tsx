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
    Rectangle,
    LabelList
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
    const currentMonth = new Date().getMonth();
    const isCurrentYear = year === new Date().getFullYear();
    
    return (
        <div className="w-full" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 25, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-zinc-100 dark:text-white/5" />
                    <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fontWeight: 700, fill: 'currentColor' }}
                        className="text-zinc-400"
                        tickFormatter={(value) => `${value + 1}`}
                    />
                    <YAxis 
                        hide
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
                        barSize={18}
                        activeBar={<Rectangle fillOpacity={0.8} />}
                    >
                        <LabelList 
                            dataKey="amount" 
                            position="top" 
                            formatter={(value: any) => {
                                if (typeof value !== 'number' || value === 0) return '';
                                return `${(value / 10000).toFixed(0)}만`;
                            }}
                            style={{ fontSize: '10px', fontWeight: 700, fill: 'currentColor' }}
                            className="text-zinc-400"
                        />
                        {data.map((entry, index) => {
                            const isCurrent = isCurrentYear && index === currentMonth;
                            return (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={isCurrent ? "#FF4F60" : "#4A2226"}
                                    className={cn(isCurrent ? "fill-[#FF4F60]" : "fill-[#4A2226] dark:fill-[#321619]")}
                                />
                            );
                        })}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
