'use client';

import { useState } from 'react';
import { addDividendRecord } from '@/lib/actions';
import { Calendar, Coins, Percent } from 'lucide-react';

interface DividendRecordFormProps {
    tickerSymbol: string;
    currency: string;
    onSuccess: () => void;
    stockEntryId?: string;
}

export default function DividendRecordForm({ tickerSymbol, currency, onSuccess, stockEntryId }: DividendRecordFormProps) {
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState('');
    const [receivedAt, setReceivedAt] = useState(new Date().toISOString().split('T')[0]);
    const [taxAmount, setTaxAmount] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await addDividendRecord({
                tickerSymbol,
                amount: parseFloat(amount),
                currency,
                receivedAt,
                taxAmount: taxAmount ? parseFloat(taxAmount) : undefined,
                stockEntryId
            });
            onSuccess();
        } catch (error: any) {
            console.error('Failed to add dividend record', error);
            alert(`Failed to save record: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 font-mono text-sm py-4">
            <div className="flex flex-col gap-4">
                <h3 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase flex items-center gap-2 border-b border-border/50 pb-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span> Log Dividend Receipt: {tickerSymbol}
                </h3>

                <div className="grid gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-muted-foreground uppercase tracking-widest pl-1">Amount Received ({currency})</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">{currency === 'KRW' ? '₩' : '$'}</span>
                            <input
                                type="number"
                                step="any"
                                required
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full bg-muted/30 border border-input rounded-sm pl-8 pr-4 py-2.5 focus:outline-none focus:border-primary transition-colors text-xs font-bold"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-muted-foreground uppercase tracking-widest pl-1">Tax Amount ({currency})</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold opacity-50">{currency === 'KRW' ? '₩' : '$'}</span>
                            <input
                                type="number"
                                step="any"
                                value={taxAmount}
                                onChange={e => setTaxAmount(e.target.value)}
                                className="w-full bg-muted/30 border border-input rounded-sm pl-8 pr-4 py-2.5 focus:outline-none focus:border-primary transition-colors text-xs"
                                placeholder="Optional"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-muted-foreground uppercase tracking-widest pl-1">Date Received</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
                            <input
                                type="date"
                                required
                                value={receivedAt}
                                onChange={e => setReceivedAt(e.target.value)}
                                className="w-full bg-muted/30 border border-input rounded-sm pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary transition-colors text-xs font-bold"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-auto pt-6">
                <button
                    type="submit"
                    disabled={loading || !amount}
                    className="w-full bg-primary text-primary-foreground py-3 rounded-sm font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Processing...' : 'Record Receipt'}
                </button>
            </div>
        </form>
    );
}
