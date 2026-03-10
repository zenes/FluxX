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
                            "flex items-center justify-between group py-4 px-4 rounded-2xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors",
                            idx !== records.length - 1 && "border-b border-zinc-100 dark:border-white/5"
                        )}
                    >
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0 pr-2">
                            <h4 className="font-bold text-zinc-900 dark:text-white mb-0.5 leading-tight">
                                {getStockDisplayName(record.symbol, undefined, undefined, stockAliases[record.symbol])}
                            </h4>
                            <div className="flex items-center gap-2">
                                <span className="text-[12px] text-zinc-500 dark:text-zinc-400 line-clamp-1 break-all uppercase font-bold tracking-tighter">
                                    {record.shares.toLocaleString()}주 보유 • 주당 {record.symbol.endsWith('.K') ? Math.round(record.dividendPerShare).toLocaleString() : record.dividendPerShare.toLocaleString()}{record.symbol.endsWith('.K') ? '원' : '$'}
                                </span>
                                {record.type && (
                                    <span className="bg-zinc-100 dark:bg-white/5 text-zinc-400 text-[9px] px-1.5 py-0.5 rounded-md font-black">
                                        {record.type}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 min-w-[100px]">
                            <p className="text-[15px] font-black text-zinc-900 dark:text-white">
                                {currencySymbol}{Math.round(record.amount).toLocaleString()}
                            </p>
                            
                            <div className="flex flex-col items-end gap-1">
                                {record.amountUsd && record.amountUsd > 0 && (
                                    <p className="text-[10px] text-zinc-400 font-bold">
                                        (${record.amountUsd.toFixed(2)})
                                    </p>
                                )}
                                <div className="px-2 py-0.5 rounded-[6px] bg-zinc-100 dark:bg-white/5 text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
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
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Monthly Separator */}
            <div className="pt-2">
                <div className="h-px bg-zinc-200 dark:bg-white/10 w-full" />
            </div>
        </div>
    );
}
