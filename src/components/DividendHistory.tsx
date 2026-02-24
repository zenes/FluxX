'use client';

import React from 'react';
import { format } from 'date-fns';
import { Calendar, DollarSign, Percent } from 'lucide-react';

interface DividendRecord {
    id: string;
    amount: number;
    currency: string;
    receivedAt: Date | string;
    taxAmount?: number | null;
}

interface DividendHistoryProps {
    records: DividendRecord[];
    tickerSymbol: string;
}

export function DividendHistory({ records, tickerSymbol }: DividendHistoryProps) {
    if (records.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Calendar className="text-muted-foreground opacity-20" size={24} />
                </div>
                <h3 className="text-sm font-bold text-foreground">No Records Found</h3>
                <p className="text-xs text-muted-foreground mt-1">No dividend payments have been recorded for {tickerSymbol} yet.</p>
            </div>
        );
    }

    // Sort by date descending
    const sortedRecords = [...records].sort((a, b) =>
        new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Payment History</h3>
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                    {records.length} {records.length === 1 ? 'Entry' : 'Entries'}
                </span>
            </div>

            <div className="relative space-y-4 before:absolute before:inset-0 before:ml-2.5 before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-transparent before:via-border/50 before:to-transparent">
                {sortedRecords.map((record) => {
                    const receivedDate = new Date(record.receivedAt);
                    const netAmount = record.amount;
                    const taxAmount = record.taxAmount || 0;
                    const grossAmount = netAmount + taxAmount;
                    const taxRate = grossAmount > 0 ? (taxAmount / grossAmount) * 100 : 0;
                    const currencySymbol = record.currency === 'KRW' ? '₩' : '$';

                    return (
                        <div key={record.id} className="relative pl-8">
                            {/* Timeline dot */}
                            <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full bg-background border-2 border-primary/40 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            </div>

                            <div className="flex flex-col gap-2 p-3 bg-muted/20 border border-border/40 rounded-sm hover:bg-muted/30 transition-all hover:border-primary/20 group">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black tracking-tight text-foreground/80 group-hover:text-primary transition-colors">
                                        {format(receivedDate, 'MMM dd, yyyy')}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-mono font-black text-emerald-500">
                                            {currencySymbol}{netAmount.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 border-t border-border/50 pt-2 mt-1">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-1 opacity-40">
                                            <Percent size={8} />
                                            <span className="text-[8px] font-black uppercase tracking-wider">Withholding Tax</span>
                                        </div>
                                        <div className="text-[10px] font-mono font-bold text-red-500/80">
                                            {currencySymbol}{taxAmount.toLocaleString()} ({taxRate.toFixed(1)}%)
                                        </div>
                                    </div>
                                    <div className="space-y-0.5 text-right">
                                        <div className="flex items-center gap-1 opacity-40 justify-end">
                                            <DollarSign size={8} />
                                            <span className="text-[8px] font-black uppercase tracking-wider">Gross Amount</span>
                                        </div>
                                        <div className="text-[10px] font-mono font-bold opacity-60">
                                            {currencySymbol}{grossAmount.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
