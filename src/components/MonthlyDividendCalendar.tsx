'use client';

import React, { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Wallet, ReceiptText, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DividendRecord {
    id: string;
    amount: number;
    currency: string;
    receivedAt: Date | string;
    tickerSymbol: string;
}

interface MonthlyDividendCalendarProps {
    monthIndex: number;
    year: number;
    records: DividendRecord[];
}

export default function MonthlyDividendCalendar({ monthIndex, year, records }: MonthlyDividendCalendarProps) {
    const monthDate = new Date(year, monthIndex);
    const startOfCurrentMonth = startOfMonth(monthDate);
    const endOfCurrentMonth = endOfMonth(monthDate);

    const daysInMonth = eachDayOfInterval({
        start: startOfCurrentMonth,
        end: endOfCurrentMonth,
    });

    const startDay = getDay(startOfCurrentMonth); // 0 (Sun) to 6 (Sat)

    // Add prefix empty days
    const prefixDays = Array.from({ length: startDay }, (_, i) => null);

    const getDayRecords = (day: Date) => {
        return records.filter(r => isSameDay(new Date(r.receivedAt), day));
    };

    const totalKRW = records.reduce((sum, r) => {
        const val = r.amount || 0;
        return sum + (r.currency === 'KRW' ? val : val * 1350); // Using heuristic 1350
    }, 0);

    return (
        <div className="flex flex-col gap-6 font-mono">
            {/* Header / Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/20 border border-border/50 rounded-sm">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Total Received</p>
                    <p className="text-lg font-black text-primary tracking-tighter">₩{Math.round(totalKRW).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-muted/20 border border-border/50 rounded-sm">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Payout Events</p>
                    <p className="text-lg font-black text-profit tracking-tighter">{records.length} RECORDS</p>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-muted/5 border border-border/40 rounded-sm p-4">
                <div className="grid grid-cols-7 mb-2 border-b border-border/30 pb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <div key={i} className="text-center text-[8px] font-black text-muted-foreground/60">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-px bg-border/20">
                    {prefixDays.map((_, i) => (
                        <div key={`prefix-${i}`} className="aspect-square bg-background/20" />
                    ))}
                    {daysInMonth.map((day, i) => {
                        const dayRecords = getDayRecords(day);
                        const hasDividends = dayRecords.length > 0;
                        const isToday = isSameDay(day, new Date());

                        return (
                            <div
                                key={i}
                                className={cn(
                                    "aspect-square bg-background relative flex items-center justify-center border border-border/10",
                                    hasDividends && "bg-profit/5"
                                )}
                            >
                                <span className={cn(
                                    "text-[10px] font-bold z-10",
                                    hasDividends ? "text-profit" : "text-muted-foreground/40",
                                    isToday && "text-primary underline"
                                )}>
                                    {format(day, 'd')}
                                </span>
                                {hasDividends && (
                                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                        <div className="w-4 h-4 rounded-full bg-profit animate-pulse" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Detailed List */}
            <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border/50 pb-2 flex items-center gap-2">
                    <ReceiptText size={12} />
                    Monthly Distribution Log
                </h3>

                {records.length === 0 ? (
                    <div className="py-8 text-center text-[10px] text-muted-foreground uppercase opacity-40">
                        No dividend data recorded for this month.
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        {[...records].sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()).map((r) => (
                            <div key={r.id} className="flex items-center justify-between p-2 bg-muted/10 border border-border/30 rounded-sm hover:bg-muted/20 transition-colors">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-primary">{r.tickerSymbol}</span>
                                    <span className="text-[8px] text-muted-foreground uppercase">{format(new Date(r.receivedAt), 'MMM dd')}</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-profit">
                                        {r.currency === 'KRW' ? '₩' : '$'}{r.amount.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
