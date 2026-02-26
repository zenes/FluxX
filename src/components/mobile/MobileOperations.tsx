'use client';

import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ViewModeToggle } from '@/components/mobile/MobileLayout';
import { ChevronDown, ChevronUp, Plus, Pencil, Trash2 } from 'lucide-react';
import { AssetItem, deleteStockEntry } from '@/lib/actions';
import { calculateNetWorth, MarketPrices } from '@/lib/calculations';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import StockEntryForm from '@/components/StockEntryForm';
import AssetModal from '@/components/AssetModal';

export default function MobileOperations({ assets, predefinedAccounts }: { assets: AssetItem[]; predefinedAccounts: any }) {
    const { t } = useLanguage();
    const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
    const [globalStockSheetOpen, setGlobalStockSheetOpen] = useState(false);
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
    const [modalState, setModalState] = useState({ isOpen: false, type: '' as any, amount: 0, label: '', unit: '' });

    const accounts = predefinedAccounts || [];

    // Parse assets using correct field names from getAssets()
    const getAmount = (type: string) => assets.find(a => a.assetType === type)?.amount || 0;

    const krwAmount = getAmount('krw');
    const usdAmount = getAmount('usd');
    const goldAmount = getAmount('gold');
    const stockAssets = useMemo(() => assets.filter(a => a.assetType === 'stock' && a.assetSymbol), [assets]);

    // Group stocks by symbol
    const stocksBySymbol = useMemo(() => {
        const map: Record<string, AssetItem[]> = {};
        stockAssets.forEach(a => {
            const sym = a.assetSymbol || 'UNKNOWN';
            if (!map[sym]) map[sym] = [];
            map[sym].push(a);
        });
        return map;
    }, [stockAssets]);

    // Net worth calculation (same as desktop)
    const [netWorth, setNetWorth] = useState(0);
    const [stockPrices, setStockPrices] = useState<Record<string, { price: number; currency: string }>>({});

    useEffect(() => {
        const fetchRates = async () => {
            try {
                const stockSymbols = stockAssets.map(a => a.assetSymbol).join(',');
                const [fxRes, goldRes, stockRes] = await Promise.all([
                    fetch('/api/exchange-rate').then(r => r.json()).catch(() => ({})),
                    fetch('/api/gold-price?market=global').then(r => r.json()).catch(() => ({})),
                    stockSymbols ? fetch(`/api/stock-price?symbols=${stockSymbols}`).then(r => r.json()).catch(() => ({})) : Promise.resolve({})
                ]);

                const prices: MarketPrices = {
                    usdKrw: fxRes?.rate || 1400,
                    goldUsd: goldRes?.price || 2600,
                    stockPrices: stockRes?.quotes || {}
                };
                setStockPrices(stockRes?.quotes || {});
                setNetWorth(calculateNetWorth(assets, prices));
            } catch { }
        };
        if (assets.length > 0) fetchRates();
    }, [assets, stockAssets]);

    const openModal = (type: string, amount: number, label: string, unit: string) => {
        setModalState({ isOpen: true, type, amount, label, unit });
    };

    const handleDeleteEntry = async (id: string, symbol: string) => {
        if (confirm('Delete this entry?')) {
            await deleteStockEntry(id, symbol);
            window.location.reload();
        }
    };

    return (
        <div className="px-4 py-5 space-y-4">
            {/* Page Title */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black tracking-tight">{t('ops.title') || 'Operations'}</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('ops.subtitle') || '자산 관리'}</p>
                </div>
                <button
                    onClick={() => setGlobalStockSheetOpen(true)}
                    className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-xs font-bold"
                >
                    <Plus className="size-3.5" />
                    {t('ops.add') || 'ADD'}
                </button>
            </div>

            {/* Net Worth Card */}
            <div className="bg-card border border-primary/20 rounded-2xl p-5 shadow-sm">
                <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-1">{t('ops.net_worth') || '총 자산'}</p>
                <p className="text-3xl font-black tracking-tighter">
                    <span className="text-lg text-muted-foreground/50 mr-0.5">₩</span>
                    {netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
            </div>

            {/* Asset Cards */}
            <div className="grid grid-cols-2 gap-3">
                <button onClick={() => openModal('krw', krwAmount, 'KRW', 'KRW')} className="bg-card border border-border rounded-xl p-4 text-left active:scale-[0.98] transition-transform">
                    <p className="text-[9px] font-bold text-muted-foreground tracking-wider uppercase mb-1">{t('ops.local_currency') || '원화'}</p>
                    <p className="text-lg font-bold tracking-tight">₩{krwAmount.toLocaleString()}</p>
                </button>
                <button onClick={() => openModal('usd', usdAmount, 'USD', 'USD')} className="bg-card border border-border rounded-xl p-4 text-left active:scale-[0.98] transition-transform">
                    <p className="text-[9px] font-bold text-muted-foreground tracking-wider uppercase mb-1">{t('ops.foreign_currency') || '달러'}</p>
                    <p className="text-lg font-bold tracking-tight">${usdAmount.toLocaleString()}</p>
                </button>
                <button onClick={() => openModal('gold', goldAmount, 'Gold', 'g')} className="bg-card border border-border rounded-xl p-4 text-left active:scale-[0.98] transition-transform">
                    <p className="text-[9px] font-bold text-muted-foreground tracking-wider uppercase mb-1">{t('ops.gold_reserve') || '금'}</p>
                    <p className="text-lg font-bold tracking-tight">{goldAmount.toLocaleString()}g</p>
                </button>
                <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-[9px] font-bold text-muted-foreground tracking-wider uppercase mb-1">{t('ops.global_equities') || '주식'}</p>
                    <p className="text-lg font-bold tracking-tight">{stockAssets.length} 종목</p>
                </div>
            </div>

            {/* Stock List */}
            <div className="space-y-2">
                <h3 className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">{t('ops.equities_title') || '보유 주식'}</h3>
                {Object.entries(stocksBySymbol).length === 0 ? (
                    <div className="bg-card border border-border rounded-xl py-10 text-center text-sm text-muted-foreground/50">
                        {t('ops.no_equities') || '보유 주식이 없습니다'}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {Object.entries(stocksBySymbol).map(([symbol, entries]) => {
                            const totalQty = entries.reduce((s, e) => s + e.amount, 0);
                            const currency = entries[0]?.currency || 'USD';
                            const priceData = stockPrices[symbol];
                            const currentPrice = priceData ? priceData.price : (entries[0]?.avgPrice || 0);
                            const totalValue = totalQty * currentPrice;
                            const isExpanded = expandedSymbol === symbol;

                            // Flatten sub-entries for detail view
                            const allSubEntries = entries.flatMap(e => e.entries || []);

                            return (
                                <div key={symbol} className="bg-card border border-border rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setExpandedSymbol(isExpanded ? null : symbol)}
                                        className="w-full flex items-center justify-between px-4 py-3.5 active:bg-muted/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                                                <span className="text-sm font-black text-primary">{symbol.charAt(0)}</span>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold">{symbol}</p>
                                                <p className="text-[11px] text-muted-foreground">{totalQty.toLocaleString()} shares</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-right">
                                                {currency === 'KRW' ? '₩' : '$'}{totalValue.toLocaleString(undefined, { maximumFractionDigits: currency === 'KRW' ? 0 : 2 })}
                                            </p>
                                            {isExpanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                                        </div>
                                    </button>

                                    {isExpanded && allSubEntries.length > 0 && (
                                        <div className="border-t border-border/50 divide-y divide-border/30">
                                            {allSubEntries.map((entry: any) => {
                                                return (
                                                    <div key={entry.id} className="px-4 py-3 flex items-center justify-between">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-medium truncate">{entry.broker || 'N/A'}</p>
                                                            <p className="text-[11px] text-muted-foreground truncate">
                                                                {entry.owner || ''} {entry.predefinedAccountAlias ? `· ${entry.predefinedAccountAlias}` : ''}
                                                            </p>
                                                            <p className="text-[11px] text-muted-foreground">
                                                                {entry.qty?.toLocaleString()} shares · {currency === 'KRW' ? '₩' : '$'}{entry.totalCost?.toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 ml-3">
                                                            <button
                                                                onClick={() => setEditingEntryId(entry.id)}
                                                                className="p-2 rounded-lg bg-blue-500/10 text-blue-500 active:bg-blue-500/20"
                                                            >
                                                                <Pencil className="size-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteEntry(entry.id, symbol)}
                                                                className="p-2 rounded-lg bg-red-500/10 text-red-500 active:bg-red-500/20"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <ViewModeToggle />

            {/* Modals & Sheets */}
            <AssetModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState(s => ({ ...s, isOpen: false }))}
                assetType={modalState.type}
                currentAmount={modalState.amount}
                label={modalState.label}
                unit={modalState.unit}
                predefinedAccounts={accounts}
            />

            <Sheet open={globalStockSheetOpen} onOpenChange={setGlobalStockSheetOpen}>
                <SheetContent className="sm:max-w-md border-l border-primary/20 flex flex-col overflow-y-auto pr-6">
                    <SheetHeader className="mb-6 text-left">
                        <SheetTitle className="text-xl font-black tracking-tight text-primary">{t('ops.unified_stock_entry') || '주식 추가'}</SheetTitle>
                        <SheetDescription className="text-xs">{t('ops.unified_stock_entry_desc') || '새로운 주식을 추가합니다'}</SheetDescription>
                    </SheetHeader>
                    <StockEntryForm onSuccess={() => { setGlobalStockSheetOpen(false); window.location.reload(); }} />
                </SheetContent>
            </Sheet>

            {editingEntryId && (() => {
                const allEntries = stockAssets.flatMap(a => (a.entries || []).map((e: any) => ({ ...e, parentSymbol: a.assetSymbol })));
                const entry = allEntries.find((e: any) => e.id === editingEntryId);
                if (!entry) return null;
                return (
                    <Sheet open={!!editingEntryId} onOpenChange={(open) => !open && setEditingEntryId(null)}>
                        <SheetContent className="sm:max-w-md border-l border-primary/20 flex flex-col overflow-y-auto pr-6">
                            <SheetHeader className="mb-6 text-left">
                                <SheetTitle className="text-xl font-black tracking-tight text-primary">{t('ops.edit_entry_title') || '항목 수정'}</SheetTitle>
                            </SheetHeader>
                            <StockEntryForm
                                symbol={entry.parentSymbol}
                                initialData={entry}
                                onSuccess={() => { setEditingEntryId(null); window.location.reload(); }}
                            />
                        </SheetContent>
                    </Sheet>
                );
            })()}
        </div>
    );
}
