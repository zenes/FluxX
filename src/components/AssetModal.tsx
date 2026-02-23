'use client';

import { useState, useEffect } from 'react';
import { upsertAsset } from '@/lib/actions';

export default function AssetModal({
    isOpen,
    onClose,
    assetType,
    currentAmount,
    label,
    unit
}: {
    isOpen: boolean;
    onClose: () => void;
    assetType: string;
    currentAmount: number;
    label: string;
    unit: string;
}) {
    const [amount, setAmount] = useState<string>(currentAmount.toString());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setAmount(currentAmount.toString());
    }, [currentAmount]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await upsertAsset(assetType, Number(amount));
            onClose(); // Parent component will trigger router.refresh or handle re-render through revalidatePath
        } catch (error) {
            console.error('Failed to update asset', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-card border border-primary/20 shadow-[0_0_20px_rgba(59,130,246,0.15)] rounded-md p-6">
                <h2 className="text-lg font-bold tracking-widest text-foreground uppercase mb-6 flex items-center gap-2">
                    <span className="text-primary opacity-70">///</span> Update {label}
                </h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
                            New Balance ({unit})
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                step="any"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full px-4 py-3 bg-muted/40 border border-input rounded-sm text-lg font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all pr-12 text-foreground"
                                required
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xs">{unit}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono mt-1 opacity-70">
                            * Data is secured via AES-256 encryption.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-xs font-medium border border-input rounded-sm hover:bg-muted transition-colors uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-primary/20 text-primary border border-primary/50 text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-primary/30 transition-colors shadow-[0_0_10px_rgba(59,130,246,0.3)] disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Confirm'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
