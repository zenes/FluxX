"use client";

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface MonthlyDividendChartProps {
    data: { name: string; amount: number }[];
}

export default function MonthlyDividendChart({ data }: MonthlyDividendChartProps) {
    // 찾기 쉬운 최대값을 기준으로 강조 표시를 하거나 색상을 지정할 수 있습니다.
    const maxAmount = useMemo(() => {
        return Math.max(...data.map(d => d.amount), 0);
    }, [data]);

    const formatYAxis = (tickItem: number) => {
        if (tickItem === 0) return '0';
        if (tickItem >= 10000) {
            return `₩${(tickItem / 10000).toLocaleString(undefined, { maximumFractionDigits: 1 })}만`;
        }
        return `₩${tickItem.toLocaleString()}`;
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background/95 border border-primary/20 p-3 rounded-md shadow-lg backdrop-blur-sm">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-lg font-black text-primary tracking-tighter">
                        ₩{payload[0].value.toLocaleString()}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-[300px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{
                        top: 20,
                        right: 10,
                        left: 10,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.1)" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 'bold' }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        tickFormatter={formatYAxis}
                        dx={-10}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--primary)/0.05)' }} />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={50}>
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.amount === maxAmount && maxAmount > 0 ? 'hsl(var(--primary))' : 'hsl(var(--primary)/0.4)'}
                                className="transition-all duration-300 hover:opacity-80"
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
