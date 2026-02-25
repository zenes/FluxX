"use client";

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface ChartProps {
    currentRate: number | null;
    type: 'global' | 'krx';
}

type RangeType = '1w' | '1m' | '3m' | '6m' | '1y' | '3y' | '5y' | '10y';

export default function GoldPriceChart({ currentRate, type }: ChartProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState<RangeType>('1m');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/gold-price/history?type=${type}&range=${range}`);
                if (!res.ok) throw new Error('Failed to fetch historical data');
                const json = await res.json();
                setData(json.data || []);
            } catch (error) {
                console.error('Error fetching chart data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [range, type]);

    const formatDate = (dateString: string) => {
        try {
            const date = parseISO(dateString);
            if (range === '1w') return format(date, 'MM/dd HH:mm');
            if (['1m', '3m', '6m', '1y'].includes(range)) return format(date, 'MM/dd');
            return format(date, 'yy/MM');
        } catch (e) {
            return dateString;
        }
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background border border-border p-3 rounded-md shadow-md text-xs" style={{ fontFamily: 'var(--font-outfit)' }}>
                    <p className="text-muted-foreground mb-1">{formatDate(label)}</p>
                    <p className="text-foreground font-bold">
                        <span className="text-destructive mr-2">{type === 'global' ? 'USD' : 'KRW'}</span>
                        {type === 'krx' ? payload[0].value.toLocaleString() : payload[0].value.toFixed(2)}
                    </p>
                </div>
            );
        }
        return null;
    };

    const minVal = data.length > 0 ? Math.min(...data.map(d => d.close)) * 0.99 : 0;
    const maxVal = data.length > 0 ? Math.max(...data.map(d => d.close)) * 1.01 : 0;

    return (
        <div className="w-full mt-4 border-t border-border pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-muted-foreground">Historical Trend</span>
                <div className="flex gap-1 flex-wrap justify-end max-w-[200px]">
                    {['1w', '1m', '3m', '6m', '1y', '3y', '5y', '10y'].map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r as RangeType)}
                            className={`text-[10px] px-2 py-1 rounded-sm border transition-colors ${range === r ? 'bg-destructive text-destructive-foreground border-destructive' : 'bg-transparent text-muted-foreground border-border hover:bg-muted'}`}
                        >
                            {r.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[200px] w-full relative">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                        <Loader2 className="h-6 w-6 animate-spin text-destructive" />
                    </div>
                ) : data.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                        No data available for this range
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 5, left: type === 'krx' ? 0 : -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDate}
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={10}
                                tickMargin={10}
                                minTickGap={30}
                                style={{ fontFamily: 'var(--font-outfit)' }}
                            />
                            <YAxis
                                domain={[minVal, maxVal]}
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={10}
                                tickFormatter={(val) => type === 'krx' ? (val / 1000).toFixed(0) + 'k' : val.toFixed(0)}
                                axisLine={false}
                                tickLine={false}
                                style={{ fontFamily: 'var(--font-outfit)' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            {currentRate && (
                                <ReferenceLine y={currentRate} stroke="hsl(var(--primary))" strokeDasharray="3 3" opacity={0.5} />
                            )}
                            <Line
                                type="monotone"
                                dataKey="close"
                                stroke="hsl(var(--destructive))"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, fill: "hsl(var(--background))", stroke: "hsl(var(--destructive))", strokeWidth: 2 }}
                                animationDuration={1000}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
