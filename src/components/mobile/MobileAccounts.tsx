'use client';

import { useMemo, useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ViewModeToggle } from '@/components/mobile/MobileLayout';
import { Wallet, Coins, Layers } from 'lucide-react';
import { AssetItem } from '@/lib/actions';
import { calculateNetWorth, MarketPrices } from '@/lib/calculations';

export default function MobileAccounts({ accounts, assets }: { accounts: any[]; assets: AssetItem[] }) {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<string>('global');
    const [prices, setPrices] = useState<MarketPrices>({ usdKrw: 1400, goldUsd: 2600, stockPrices: {} });

    const predefinedAccounts = accounts || [];

    // Fetch real-time prices
    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const stockSymbols = (assets || []).filter(a => a.assetType === 'stock' && a.assetSymbol).map(a => a.assetSymbol).join(',');
                const [fxRes, goldRes, stockRes] = await Promise.all([
                    fetch('/api/exchange-rate').then(r => r.json()).catch(() => ({})),
                    fetch('/api/gold-price?market=global').then(r => r.json()).catch(() => ({})),
                    stockSymbols ? fetch(`/api/stock-price?symbols=${stockSymbols}`).then(r => r.json()).catch(() => ({})) : Promise.resolve({})
                ]);
                setPrices({
                    usdKrw: fxRes?.rate || 1400,
                    goldUsd: goldRes?.price || 2600,
                    stockPrices: stockRes?.quotes || {}
                });
            } catch { }
        };
        fetchPrices();
    }, [assets]);

    // Get unique owners from entries
    const allOwners = useMemo(() => {
        const set = new Set<string>();
        (assets || []).forEach(a => {
            if (a.entries) {
                a.entries.forEach((e: any) => { if (e.owner) set.add(e.owner); });
            }
        });
        return Array.from(set);
    }, [assets]);

    // Build view data based on active tab
    const viewData = useMemo(() => {
        let filtered = assets || [];

        if (activeTab !== 'global') {
            const acc = predefinedAccounts.find(a => a.id === activeTab);
            if (acc) {
                filtered = (assets || []).filter(a => a.predefinedAccountId === acc.id);
            } else {
                // Filter by owner (check entries)
                filtered = (assets || []).filter(a =>
                    a.entries?.some((e: any) => e.owner === activeTab)
                );
            }
        }

        const totalKrw = calculateNetWorth(filtered, prices);

        return { items: filtered, totalValueKrw: totalKrw, totalValueUsd: totalKrw / prices.usdKrw };
    }, [activeTab, assets, predefinedAccounts, prices]);

    return (
        <div className="px-4 py-5 space-y-4">
            <h1 className="text-xl font-black tracking-tight">{t('accounts.title') || '계좌 현황'}</h1>

            {/* Tab Pills */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                <button
                    onClick={() => setActiveTab('global')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${activeTab === 'global'
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-muted text-muted-foreground'
                        }`}
                >
                    <Layers className="size-3.5" />{t('accounts.overall_assets') || '전체'}
                </button>
                {predefinedAccounts.map((acc: any) => (
                    <button
                        key={acc.id}
                        onClick={() => setActiveTab(acc.id)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${activeTab === acc.id
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'bg-muted text-muted-foreground'
                            }`}
                    >
                        {acc.alias || acc.id}
                    </button>
                ))}
                {allOwners.map(owner => (
                    <button
                        key={owner}
                        onClick={() => setActiveTab(owner)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${activeTab === owner
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'bg-muted text-muted-foreground'
                            }`}
                    >
                        {owner}
                    </button>
                ))}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Coins className="size-4 text-blue-500" />
                        <span className="text-[9px] font-bold text-muted-foreground tracking-wider uppercase">KRW</span>
                    </div>
                    <p className="text-xl font-bold tracking-tight">
                        <span className="text-sm text-muted-foreground/50 mr-0.5">₩</span>
                        {viewData.totalValueKrw.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Wallet className="size-4 text-green-500" />
                        <span className="text-[9px] font-bold text-muted-foreground tracking-wider uppercase">USD</span>
                    </div>
                    <p className="text-xl font-bold tracking-tight">
                        <span className="text-sm text-muted-foreground/50 mr-0.5">$</span>
                        {viewData.totalValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            {/* Asset List */}
            <div className="space-y-2">
                <h3 className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">
                    {viewData.items.length} {t('accounts.items') || '항목'}
                </h3>
                {viewData.items.length === 0 ? (
                    <div className="bg-card border border-border rounded-xl py-10 text-center text-sm text-muted-foreground/50">
                        자산이 없습니다
                    </div>
                ) : (
                    viewData.items.map((item: any) => {
                        const typeLabel = item.assetType === 'stock' ? item.assetSymbol : item.assetType?.toUpperCase();
                        const value = item.assetType === 'stock'
                            ? (() => {
                                const priceData = prices.stockPrices[item.assetSymbol];
                                const currentPrice = priceData ? priceData.price : (item.avgPrice || 0);
                                const currency = item.currency || priceData?.currency || 'USD';
                                return `${currency === 'KRW' ? '₩' : '$'}${(item.amount * currentPrice).toLocaleString(undefined, { maximumFractionDigits: currency === 'KRW' ? 0 : 2 })}`;
                            })()
                            : item.assetType === 'krw' ? `₩${item.amount.toLocaleString()}`
                                : item.assetType === 'usd' ? `$${item.amount.toLocaleString()}`
                                    : `${item.amount.toLocaleString()}g`;

                        return (
                            <div key={item.id} className="bg-card border border-border rounded-xl px-4 py-3.5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black ${item.assetType === 'stock' ? 'bg-primary/10 text-primary' :
                                            item.assetType === 'krw' ? 'bg-orange-500/10 text-orange-500' :
                                                item.assetType === 'usd' ? 'bg-green-500/10 text-green-500' :
                                                    'bg-yellow-500/10 text-yellow-500'
                                        }`}>
                                        {typeLabel?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">{typeLabel}</p>
                                        {item.assetType === 'stock' && (
                                            <p className="text-[11px] text-muted-foreground">{item.amount.toLocaleString()} shares</p>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm font-bold">{value}</p>
                            </div>
                        );
                    })
                )}
            </div>

            <ViewModeToggle />
        </div>
    );
}
