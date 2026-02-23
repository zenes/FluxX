"use client";

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface ChartProps {
    currentRate: number | null;
}

type RangeType = '1w' | '1m' | '3m' | '6m' | '1y' | '3y' | '5y' | '10y';

export default function ExchangeRateChart({ currentRate }: ChartProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState<RangeType>('1m'); // Default 1 month

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/exchange-rate/history?range=${range}`);
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
    }, [range]);

    // Format date for X-axis
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

    // Custom Tooltip for Dark Military Theme
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background border border-border p-3 rounded-md shadow-md text-xs">
                    <p className="text-muted-foreground mb-1">{formatDate(label)}</p>
                    <p className="text-foreground font-bold">
                        <span className="text-primary mr-2">KRW</span>
                        {payload[0].value.toFixed(2)}
                    </p>
                </div>
            );
        }
        return null;
    };

    // Calculate min and max for Y-axis domain to make chart more readable
    const minVal = data.length > 0 ? Math.min(...data.map(d => d.close)) * 0.995 : 0;
    const maxVal = data.length > 0 ? Math.max(...data.map(d => d.close)) * 1.005 : 0;

    return (
        <div className="w-full mt-4 border-t border-border pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-muted-foreground">Historical Trend</span>
                <div className="flex gap-2">
                    <button
                        onClick={() => setRange('1w')}
                        className={`text-[10px] px-2 py-1 rounded-sm border transition-colors ${range === '1w' ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-border hover:bg-muted'}`}
                    >
                        1W
                    </button>
                    <button
                        onClick={() => setRange('1m')}
                        className={`text-[10px] px-2 py-1 rounded-sm border transition-colors ${range === '1m' ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-border hover:bg-muted'}`}
                    >
                        1M
                    </button>
                    <button
                        onClick={() => setRange('3m')}
                        className={`text-[10px] px-2 py-1 rounded-sm border transition-colors ${range === '3m' ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-border hover:bg-muted'}`}
                    >
                        3M
                    </button>
                    <button
                        onClick={() => setRange('6m')}
                        className={`text-[10px] px-2 py-1 rounded-sm border transition-colors ${range === '6m' ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-border hover:bg-muted'}`}
                    >
                        6M
                    </button>
                    <button
                        onClick={() => setRange('1y')}
                        className={`text-[10px] px-2 py-1 rounded-sm border transition-colors ${range === '1y' ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-border hover:bg-muted'}`}
                    >
                        1Y
                    </button>
                    <button
                        onClick={() => setRange('3y')}
                        className={`text-[10px] px-2 py-1 rounded-sm border transition-colors ${range === '3y' ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-border hover:bg-muted'}`}
                    >
                        3Y
                    </button>
                    <button
                        onClick={() => setRange('5y')}
                        className={`text-[10px] px-2 py-1 rounded-sm border transition-colors ${range === '5y' ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-border hover:bg-muted'}`}
                    >
                        5Y
                    </button>
                    <button
                        onClick={() => setRange('10y')}
                        className={`text-[10px] px-2 py-1 rounded-sm border transition-colors ${range === '10y' ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-border hover:bg-muted'}`}
                    >
                        10Y
                    </button>
                </div>
            </div>

            <div className="h-[200px] w-full relative">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : data.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                        No data available for this range
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDate}
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={10}
                                tickMargin={10}
                                minTickGap={30}
                            />
                            <YAxis
                                domain={[minVal, maxVal]}
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={10}
                                tickFormatter={(val) => val.toFixed(0)}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            {currentRate && (
                                <ReferenceLine y={currentRate} stroke="hsl(var(--destructive))" strokeDasharray="3 3" opacity={0.5} />
                            )}
                            <Line
                                type="monotone"
                                dataKey="close"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, fill: "hsl(var(--background))", stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                                animationDuration={1000}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
