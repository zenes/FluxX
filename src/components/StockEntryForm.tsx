'use client';

import { useState } from 'react';
import { Building2, UserCircle2, Hash, ArrowRight } from 'lucide-react';
import { addStockEntry, editStockEntry } from '@/lib/actions';

export default function StockEntryForm({
    symbol,
    onSuccess,
    initialData
}: {
    symbol: string;
    onSuccess: () => void;
    initialData?: {
        id: string;
        broker: string;
        owner: string;
        account: string;
        qty: number;
        totalCost: number;
    }
}) {
    const [loading, setLoading] = useState(false);
    const [broker, setBroker] = useState(initialData?.broker || '');
    const [owner, setOwner] = useState(initialData?.owner || '');
    const [accountNum, setAccountNum] = useState(initialData?.account || '');
    const [quantity, setQuantity] = useState(initialData?.qty.toString() || '');
    const [totalCost, setTotalCost] = useState(initialData?.totalCost.toString() || '');

    const isEditing = !!initialData;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEditing) {
                await editStockEntry(initialData!.id, {
                    brokerName: broker,
                    accountOwner: owner,
                    accountNumber: accountNum,
                    quantity: parseFloat(quantity),
                    totalPurchaseAmount: parseFloat(totalCost)
                }, symbol);
            } else {
                await addStockEntry({
                    tickerSymbol: symbol,
                    brokerName: broker,
                    accountOwner: owner,
                    accountNumber: accountNum,
                    quantity: parseFloat(quantity),
                    totalPurchaseAmount: parseFloat(totalCost)
                });
            }
            onSuccess();
        } catch (error) {
            console.error('Failed to save stock entry', error);
        } finally {
            setLoading(false);
        }
    };

    const parsedQty = parseFloat(quantity) || 0;
    const parsedCost = parseFloat(totalCost) || 0;
    const avgCost = parsedQty > 0 ? (parsedCost / parsedQty) : 0;

    return (
        <form onSubmit={handleSubmit} className="w-full h-full flex flex-col gap-6 font-mono text-sm py-4">
            {/* Account Info Section */}
            <div className="flex flex-col gap-4">
                <h3 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase border-b border-border/50 pb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Account Credentials
                </h3>

                <div className="grid gap-3">
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
                        <input
                            type="text"
                            required
                            placeholder="Broker Name (e.g. Toss, Kiwoom)"
                            value={broker}
                            onChange={e => setBroker(e.target.value)}
                            className="w-full bg-muted/30 border border-input rounded-sm pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary transition-colors text-xs"
                        />
                    </div>
                    <div className="relative">
                        <UserCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
                        <input
                            type="text"
                            required
                            placeholder="Account Owner Name"
                            value={owner}
                            onChange={e => setOwner(e.target.value)}
                            className="w-full bg-muted/30 border border-input rounded-sm pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary transition-colors text-xs"
                        />
                    </div>
                    <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
                        <input
                            type="text"
                            placeholder="Account Number (Optional)"
                            value={accountNum}
                            onChange={e => setAccountNum(e.target.value)}
                            className="w-full bg-muted/30 border border-input rounded-sm pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary transition-colors text-xs"
                        />
                    </div>
                </div>
            </div>

            {/* Asset Value Section */}
            <div className="flex flex-col gap-4 mt-4">
                <h3 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase border-b border-border/50 pb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Holding Valuation
                </h3>

                <div className="grid gap-3">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-muted-foreground uppercase tracking-widest pl-1">Quantity (Shares)</label>
                        <input
                            type="number"
                            step="any"
                            required
                            placeholder="0.0000"
                            value={quantity}
                            onChange={e => setQuantity(e.target.value)}
                            className="w-full bg-muted/30 border border-input rounded-sm px-4 py-2.5 focus:outline-none focus:border-primary transition-colors text-sm font-bold tracking-wider"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-muted-foreground uppercase tracking-widest pl-1">Total Purchase Amount (USD)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                            <input
                                type="number"
                                step="any"
                                required
                                placeholder="0.00"
                                value={totalCost}
                                onChange={e => setTotalCost(e.target.value)}
                                className="w-full bg-muted/30 border border-input rounded-sm pl-8 pr-4 py-2.5 focus:outline-none focus:border-primary transition-colors text-sm font-bold tracking-wider text-green-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Real-time calculated preview */}
                <div className="mt-2 bg-purple-500/5 border border-purple-500/20 rounded-md p-4 flex justify-between items-center text-xs">
                    <span className="text-[10px] font-bold text-purple-500 tracking-widest uppercase">Live Avg CostPreview</span>
                    <span className="font-bold text-foreground font-mono">
                        ${avgCost > 0 ? avgCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '0.00'} / share
                    </span>
                </div>
            </div>

            <div className="mt-auto pt-8">
                <button
                    type="submit"
                    disabled={loading || parsedQty <= 0 || parsedCost <= 0}
                    className="w-full bg-primary/20 text-primary border border-primary/50 py-3 rounded-sm font-bold uppercase tracking-widest text-xs hover:bg-primary/30 transition-all shadow-[0_0_15px_rgba(59,130,246,0.15)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? 'Processing...' : (isEditing ? 'Update Holding' : `Save ${symbol} Holding`)} <ArrowRight size={14} />
                </button>
            </div>
        </form>
    );
}
