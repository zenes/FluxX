'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { getStockDisplayName } from '@/lib/stock-utils';

interface DividendBreakdownItem {
    symbol: string;
    amount: number;
    amountUsd?: number;
    date?: string;
    shares: number;
    dividendPerShare: number;
    type?: string;
    isExpected?: boolean;
    frequency?: number;
    frequencyMonths?: string;
}

interface DividendBreakdownListV2Props {
    month: number;
    records: DividendBreakdownItem[];
    currencySymbol?: string;
    stockAliases?: Record<string, string>;
}

export default function DividendBreakdownListV2({ 
    month, 
    records, 
    currencySymbol = '₩',
    stockAliases = {}
}: DividendBreakdownListV2Props) {
    const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);

    if (records.length === 0) return null;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
                    {month + 1}월
                </h2>
                <p className="text-lg font-black text-zinc-900 dark:text-white">
                    {currencySymbol}{Math.round(totalAmount).toLocaleString()}
                </p>
            </div>

            <div className="flex flex-col">
                {records.map((record, idx) => (
                    <div 
                        key={`${record.symbol}-${idx}`} 
                        className={cn(
                            "flex items-center justify-between group py-4",
                            idx !== records.length - 1 && "border-b border-zinc-100 dark:border-white/5"
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden border border-white/5">
                                {/* Placeholder for Logo/Icon */}
                                <span className="text-[10px] font-black text-white">{record.symbol.slice(0, 2)}</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-zinc-900 dark:text-white leading-tight">
                                    {getStockDisplayName(record.symbol, undefined, undefined, stockAliases[record.symbol])}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-[11px] text-zinc-400 font-bold">
                                        {record.shares.toLocaleString()}주 · 주당 {record.symbol.endsWith('.K') ? Math.round(record.dividendPerShare).toLocaleString() : record.dividendPerShare.toLocaleString()}{record.symbol.endsWith('.K') ? '원' : '$'}
                                    </p>
                                    {record.type && (
                                        <span className="bg-zinc-100 dark:bg-white/5 text-zinc-400 text-[9px] px-1.5 py-0.5 rounded-md font-black">
                                            {record.type}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-black text-zinc-900 dark:text-white">
                                {currencySymbol}{Math.round(record.amount).toLocaleString()}
                            </p>
                            {record.amountUsd && record.amountUsd > 0 && (
                                <p className="text-[10px] text-zinc-400 font-bold">
                                    (${record.amountUsd.toFixed(2)})
                                </p>
                            )}
                            <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
                                {(() => {
                                    if (record.isExpected) return '예상';
                                    
                                    const freqMap: Record<number, string> = {
                                        12: '월배당',
                                        4: '분기배당',
                                        2: '반기배당',
                                        1: '연배당'
                                    };
                                    
                                    const freqText = record.frequency ? freqMap[record.frequency] : '';
                                    const monthsText = record.frequencyMonths ? ` (${record.frequencyMonths})` : '';
                                    
                                    return `${freqText}${monthsText}`;
                                })()}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            
        </div>
    );
}
