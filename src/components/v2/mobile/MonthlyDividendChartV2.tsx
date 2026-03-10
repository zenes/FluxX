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
                <BarChart data={data} margin={{ top: 25, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-zinc-100 dark:text-white/5" />
                    <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fontWeight: 700, fill: 'currentColor' }}
                        className="text-zinc-400"
                        tickFormatter={(value) => `${value + 1}`}
                        interval={0}
                    />
                    <YAxis 
                        hide
                        domain={[0, 'auto']}
                    />
                    <Tooltip 
                        cursor={{ fill: 'currentColor', opacity: 0.05 }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                if (d.amount === 0) return null;
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
                                if (typeof value !== 'number' || value <= 0) return '';
                                if (value >= 10000) return `${(value / 10000).toFixed(0)}만`;
                                return `${value.toLocaleString()}`;
                            }}
                            style={{ fontSize: '10px', fontWeight: 700, fill: 'currentColor' }}
                            className="text-zinc-400"
                            offset={8}
                        />
                        {data.map((entry, index) => {
                            const isCurrent = isCurrentYear && index === currentMonth;
                            // If it's not the current year, make all bars with data look "active" but maybe slightly different
                            // If it's the current year, highlight only the current month
                            let barColor = "#4A2226"; // Default "inactive"
                            let barClassName = "fill-[#4A2226] dark:fill-[#321619]";
                            
                            if (isCurrent) {
                                barColor = "#FF4F60";
                                barClassName = "fill-[#FF4F60]";
                            } else if (entry.amount > 0) {
                                if (!isCurrentYear) {
                                    // Past years: all data points look active but maybe slightly darker than current highlight
                                    barColor = "#8E353E"; 
                                    barClassName = "fill-[#8E353E] dark:fill-[#6A282F]";
                                } else if (index < currentMonth) {
                                    // Current year, but past months: look active
                                    barColor = "#8E353E";
                                    barClassName = "fill-[#8E353E] dark:fill-[#6A282F]";
                                }
                            }

                            return (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={barColor}
                                    className={cn(barClassName)}
                                />
                            );
                        })}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
