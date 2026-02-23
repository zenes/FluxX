'use client';

import { useState, useEffect, useRef } from 'react';
import { upsertStockAsset } from '@/lib/actions';
import { useDebounce } from 'use-debounce';
import ConfirmModal from './ConfirmModal';

type SearchResult = {
    symbol: string;
    shortname: string;
    exchange: string;
};

export default function StockModal({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const [ticker, setTicker] = useState('');
    const [debouncedTicker] = useDebounce(ticker, 500);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const [shares, setShares] = useState<string>('');
    const [avgPrice, setAvgPrice] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when typing something new but wait for debounce
    useEffect(() => {
        if (!ticker) {
            setSearchResults([]);
            setShowDropdown(false);
        }
    }, [ticker]);

    // Reset confirm state when modal opens
    useEffect(() => {
        if (isOpen) {
            setShowConfirm(false);
        }
    }, [isOpen]);

    useEffect(() => {
        const fetchTickers = async () => {
            if (debouncedTicker.length < 2) return;

            setIsSearching(true);
            try {
                const res = await fetch(`/api/ticker-search?q=${encodeURIComponent(debouncedTicker)}`);
                const data = await res.json();
                setSearchResults(data.results || []);
                setShowDropdown(true);
            } catch (err) {
                console.error('Failed to search ticker', err);
            } finally {
                setIsSearching(false);
            }
        };

        fetchTickers();
    }, [debouncedTicker]);

    const handleSelectTicker = (symbol: string) => {
        setTicker(symbol);
        setShowDropdown(false);
    };

    const isDirty = ticker !== '' || shares !== '' || avgPrice !== '';

    const handleCloseRequest = (e?: React.MouseEvent | KeyboardEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // If confirm modal is already showing, don't trigger anything else from the parent
        if (showConfirm) return;

        if (isDirty) {
            setShowConfirm(true);
            return;
        }

        onClose();
    };

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleCloseRequest(e);
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, isDirty, showConfirm]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticker || !shares || !avgPrice) return;

        setLoading(true);
        try {
            await upsertStockAsset(ticker.toUpperCase(), Number(shares), Number(avgPrice));
            onClose();
        } catch (error) {
            console.error('Failed to update stock asset', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
                onClick={handleCloseRequest}
            >
                <div
                    className="w-full max-w-sm bg-card border border-primary/20 shadow-[0_0_20px_rgba(59,130,246,0.15)] rounded-md p-6 overflow-visible relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    <h2 className="text-lg font-bold tracking-widest text-foreground uppercase mb-6 flex items-center gap-2">
                        <span className="text-primary opacity-70">///</span> Register US Stock
                    </h2>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                        {/* Ticker Search Field */}
                        <div className="flex flex-col gap-2 relative">
                            <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
                                Ticker Symbol
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={ticker}
                                    onChange={(e) => setTicker(e.target.value)}
                                    placeholder="e.g. AAPL, TSLA"
                                    className="w-full px-4 py-3 bg-muted/40 border border-input rounded-sm text-sm font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all pr-10 text-foreground uppercase"
                                    required
                                    autoComplete="off"
                                />
                                {isSearching && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                )}
                            </div>

                            {/* Autocomplete Dropdown */}
                            {showDropdown && searchResults.length > 0 && (
                                <div
                                    ref={dropdownRef}
                                    className="absolute top-[65px] left-0 right-0 max-h-48 overflow-y-auto bg-card border border-primary/30 rounded-sm shadow-xl z-[60] flex flex-col"
                                >
                                    {searchResults.map((res) => (
                                        <button
                                            key={res.symbol}
                                            type="button"
                                            onClick={() => handleSelectTicker(res.symbol)}
                                            className="flex flex-col text-left px-4 py-2 hover:bg-primary/20 border-b border-border/50 last:border-0 transition-colors"
                                        >
                                            <span className="text-sm font-bold text-primary font-mono">{res.symbol}</span>
                                            <span className="text-[10px] text-muted-foreground truncate">{res.shortname} ({res.exchange})</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {/* Shares Field */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
                                    Shares (Qty)
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={shares}
                                    onChange={(e) => setShares(e.target.value)}
                                    className="w-full px-3 py-2 bg-muted/40 border border-input rounded-sm text-sm font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                                    required
                                />
                            </div>

                            {/* Average Price Field */}
                            <div className="flex flex-col gap-2 relative">
                                <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
                                    Avg Price ($)
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={avgPrice}
                                    onChange={(e) => setAvgPrice(e.target.value)}
                                    className="w-full px-3 py-2 bg-muted/40 border border-input rounded-sm text-sm font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                                    required
                                />
                            </div>
                        </div>

                        <p className="text-[10px] text-muted-foreground font-mono mt-1 opacity-70">
                            * Shares & Price data secured via AES-256.
                        </p>

                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                type="button"
                                onClick={handleCloseRequest}
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
                                {loading ? 'Processing...' : 'Add Stock'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Custom Confirmation Modal */}
            <ConfirmModal
                isOpen={showConfirm}
                onConfirm={() => {
                    setShowConfirm(false);
                    onClose();
                }}
                onCancel={() => setShowConfirm(false)}
            />
        </>
    );
}
