'use client';

import { useState, useEffect, useRef } from 'react';
import { Building2, UserCircle2, Hash, ArrowRight, Bookmark, Search, Info } from 'lucide-react';
import { addStockEntry, editStockEntry, getPredefinedAccounts } from '@/lib/actions';
import { useDebounce } from 'use-debounce';

type SearchResult = {
    symbol: string;
    shortname: string;
    exchange: string;
};

export default function StockEntryForm({
    symbol: initialSymbol,
    onSuccess,
    initialData,
    initialCurrency // Added optional initialCurrency prop
}: {
    symbol?: string;
    onSuccess: () => void;
    initialData?: {
        id: string;
        broker: string;
        owner: string;
        account: string;
        qty: number;
        totalCost: number;
        currency?: string;
        predefinedAccountId?: string | null;
    };
    initialCurrency?: string;
}) {
    const [loading, setLoading] = useState(false);
    const [broker, setBroker] = useState(initialData?.broker || '');
    const [owner, setOwner] = useState(initialData?.owner || '');
    const [accountNum, setAccountNum] = useState(initialData?.account || '');
    const [quantity, setQuantity] = useState(initialData?.qty.toString() || '');
    const [totalCost, setTotalCost] = useState(initialData?.totalCost.toString() || '');

    // Heuristic for setting currency if symbol is provided but no initialData
    const getInitialCurrency = () => {
        if (initialData?.currency) return initialData.currency;
        if (initialCurrency) return initialCurrency;
        if (initialSymbol) {
            const isKR = initialSymbol.endsWith('.KS') || initialSymbol.endsWith('.KQ') || /^\d{6}$/.test(initialSymbol);
            return isKR ? 'KRW' : 'USD';
        }
        return 'USD';
    };

    const [currency, setCurrency] = useState(getInitialCurrency());
    const [presets, setPresets] = useState<any[]>([]);
    const [selectedPresetId, setSelectedPresetId] = useState<string>(initialData?.predefinedAccountId || '');

    // Ticker Search State for global entry
    const [ticker, setTicker] = useState(initialSymbol || '');
    const [debouncedTicker] = useDebounce(ticker, 500);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol || '');

    useEffect(() => {
        async function fetchPresets() {
            const data = await getPredefinedAccounts();
            setPresets(data);
        }
        fetchPresets();
    }, []);

    // Ticker Search logic
    useEffect(() => {
        const fetchTickers = async () => {
            if (debouncedTicker.length < 2 || initialSymbol) return;

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
    }, [debouncedTicker, initialSymbol]);

    const isEditing = !!initialData;

    const handleSelectPreset = (presetId: string) => {
        const selected = presets.find(p => p.id === presetId);
        if (selected) {
            setBroker(selected.broker);
            setOwner(selected.owner);
            setAccountNum(selected.accountNumber);
            setSelectedPresetId(presetId);
        } else {
            setSelectedPresetId('');
        }
    };

    const handleSelectTicker = (res: SearchResult) => {
        setTicker(res.symbol);
        setSelectedSymbol(res.symbol);
        setShowDropdown(false);
        // Basic heuristic for currency, can be improved with quote call if needed
        const isKR = res.exchange === 'KOE' || res.symbol.endsWith('.KS') || res.symbol.endsWith('.KQ');
        setCurrency(isKR ? 'KRW' : 'USD');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const finalSymbol = initialSymbol || selectedSymbol || ticker.trim();
        if (!finalSymbol) {
            alert('Please select or enter a valid ticker symbol');
            setLoading(false);
            return;
        }

        console.log('Submitting Stock Entry:', { finalSymbol, broker, owner, quantity, totalCost, currency });

        // Ensure currency is correct for manually entered tickers like 441640.KS
        let finalCurrency = currency;
        if (!isEditing && !selectedSymbol) {
            const isKR = finalSymbol.endsWith('.KS') || finalSymbol.endsWith('.KQ') || /^\d{6}$/.test(finalSymbol);
            finalCurrency = isKR ? 'KRW' : 'USD';
        }

        try {
            if (isEditing) {
                await editStockEntry(initialData!.id, {
                    brokerName: broker,
                    accountOwner: owner,
                    accountNumber: accountNum,
                    quantity: parseFloat(quantity),
                    totalPurchaseAmount: parseFloat(totalCost),
                    currency: finalCurrency,
                    predefinedAccountId: selectedPresetId || null
                }, finalSymbol);
            } else {
                await addStockEntry({
                    tickerSymbol: finalSymbol.toUpperCase(),
                    brokerName: broker,
                    accountOwner: owner,
                    accountNumber: accountNum,
                    quantity: parseFloat(quantity),
                    totalPurchaseAmount: parseFloat(totalCost),
                    currency: finalCurrency,
                    predefinedAccountId: selectedPresetId || undefined
                });
            }
            onSuccess();
        } catch (error: any) {
            console.error('Failed to save stock entry', error);
            alert(`Failed to save: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const parsedQty = parseFloat(quantity) || 0;
    const parsedCost = parseFloat(totalCost) || 0;
    const avgCost = parsedQty > 0 ? (parsedCost / parsedQty) : 0;

    return (
        <form onSubmit={handleSubmit} className="w-full h-full flex flex-col gap-6 font-mono text-sm py-4">
            {/* Ticker Section (Search or Fixed) */}
            <div className="flex flex-col gap-4">
                <h3 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase flex items-center gap-2 border-b border-border/50 pb-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span> Ticker Identification
                </h3>

                {initialSymbol ? (
                    <div className="flex items-center gap-3 px-4 py-3 bg-purple-500/5 border border-purple-500/20 rounded-sm">
                        <span className="text-xl font-black text-purple-500 tracking-tighter">{initialSymbol}</span>
                        <span className="text-[10px] text-muted-foreground uppercase py-0.5 px-2 bg-muted rounded-full">Active Context</span>
                    </div>
                ) : (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
                        <input
                            type="text"
                            required
                            placeholder="SEARCH TICKER (e.g. AAPL, NVDA)"
                            value={ticker}
                            onChange={e => {
                                setTicker(e.target.value.toUpperCase());
                                if (selectedSymbol) setSelectedSymbol('');
                            }}
                            className="w-full bg-muted/30 border border-input rounded-sm pl-10 pr-10 py-2.5 focus:outline-none focus:border-primary transition-colors text-xs font-bold tracking-widest"
                            autoComplete="off"
                        />
                        {isSearching && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        )}

                        {/* Dropdown Results */}
                        {showDropdown && searchResults.length > 0 && !selectedSymbol && (
                            <div className="absolute top-[110%] left-0 right-0 max-h-48 overflow-y-auto bg-card border border-primary/30 rounded-sm shadow-xl z-50 flex flex-col">
                                {searchResults.map((res) => (
                                    <button
                                        key={res.symbol}
                                        type="button"
                                        onClick={() => handleSelectTicker(res)}
                                        className="flex flex-col text-left px-4 py-2 hover:bg-primary/20 border-b border-border/50 last:border-0 transition-colors"
                                    >
                                        <span className="text-sm font-bold text-primary font-mono">{res.symbol}</span>
                                        <span className="text-[10px] text-muted-foreground truncate">{res.shortname} ({res.exchange})</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {selectedSymbol && (
                            <div className="mt-2 text-[10px] text-primary flex items-center gap-1.5 px-1 animation-pulse">
                                <Info size={12} /> Target identified: <span className="font-bold">{selectedSymbol}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Account Info Section */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <h3 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Account Credentials
                    </h3>
                    {presets.length > 0 && (
                        <div className="flex items-center gap-2">
                            <Bookmark size={12} className="text-primary" />
                            <select
                                onChange={(e) => handleSelectPreset(e.target.value)}
                                className="bg-transparent text-[10px] text-primary font-bold focus:outline-none cursor-pointer hover:underline"
                                value={selectedPresetId}
                            >
                                <option value=""> {isEditing ? 'CHANGE PRESET' : 'LOAD PRESET'}</option>
                                {presets.map(p => (
                                    <option key={p.id} value={p.id}>{p.alias}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

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
                        <label className="text-[10px] text-muted-foreground uppercase tracking-widest pl-1">Total Purchase Amount ({currency})</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">{currency === 'KRW' ? '₩' : '$'}</span>
                            <input
                                type="number"
                                step="any"
                                required
                                placeholder="0.00"
                                value={totalCost}
                                onChange={e => setTotalCost(e.target.value)}
                                className={`w-full bg-muted/30 border border-input rounded-sm ${currency === 'KRW' ? 'pl-9' : 'pl-8'} pr-4 py-2.5 focus:outline-none focus:border-primary transition-colors text-sm font-bold tracking-wider text-green-500`}
                            />
                        </div>
                    </div>
                </div>

                {/* Real-time calculated preview */}
                <div className="mt-2 bg-purple-500/5 border border-purple-500/20 rounded-md p-4 flex justify-between items-center text-xs">
                    <span className="text-[10px] font-bold text-purple-500 tracking-widest uppercase">Live Avg Cost Preview</span>
                    <span className="font-bold text-foreground font-mono">
                        {currency === 'KRW' ? '₩' : '$'}{avgCost > 0 ? avgCost.toLocaleString(undefined, { minimumFractionDigits: currency === 'KRW' ? 0 : 2, maximumFractionDigits: currency === 'KRW' ? 2 : 4 }) : '0.00'} / share
                    </span>
                </div>
            </div>

            <div className="mt-auto pt-8">
                <button
                    type="submit"
                    disabled={loading || parsedQty <= 0 || parsedCost <= 0 || (!initialSymbol && !selectedSymbol)}
                    className="w-full bg-primary/20 text-primary border border-primary/50 py-3 rounded-sm font-bold uppercase tracking-widest text-xs hover:bg-primary/30 transition-all shadow-[0_0_15px_rgba(59,130,246,0.15)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? 'Processing...' : (isEditing ? 'Update Holding' : `Save ${initialSymbol || selectedSymbol || 'Stock'} Holding`)} <ArrowRight size={14} />
                </button>
            </div>
        </form>
    );
}
