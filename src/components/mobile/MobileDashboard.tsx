'use client';

import { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ViewModeToggle } from '@/components/mobile/MobileLayout';
import { AssetItem } from '@/lib/actions';
import { calculateNetWorth, MarketPrices } from '@/lib/calculations';

export default function MobileDashboard({ initialAssets, initialExchange, initialGold, initialMemos, initialAssetMemos }: any) {
    const { t } = useLanguage();
    const [assets] = useState<AssetItem[]>(initialAssets || []);
    const [netWorth, setNetWorth] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const exchangeRate = initialExchange?.rate || 1400;
    const goldPrice = initialGold?.price || 2600;

    // Calculate net worth the same way desktop does
    useEffect(() => {
        const calcNetWorth = async () => {
            try {
                const stockSymbols = assets
                    .filter(a => a.assetType === 'stock' && a.assetSymbol)
                    .map(a => a.assetSymbol)
                    .join(',');

                let stockPrices: Record<string, { price: number; currency: string }> = {};
                if (stockSymbols) {
                    try {
                        const res = await fetch(`/api/stock-price?symbols=${stockSymbols}`);
                        const data = await res.json();
                        stockPrices = data.quotes || {};
                    } catch { }
                }

                const prices: MarketPrices = {
                    usdKrw: exchangeRate,
                    goldUsd: goldPrice,
                    stockPrices,
                };

                setNetWorth(calculateNetWorth(assets, prices));
            } catch {
                setNetWorth(0);
            }
            setIsLoading(false);
        };

        if (assets.length > 0) {
            calcNetWorth();
        } else {
            setNetWorth(0);
            setIsLoading(false);
        }
    }, [assets, exchangeRate, goldPrice]);

    // Summed asset values for display
    const krwAmount = useMemo(() =>
        assets.filter(a => a.assetType === 'krw').reduce((s, a) => s + a.amount, 0), [assets]);
    const usdAmount = useMemo(() =>
        assets.filter(a => a.assetType === 'usd').reduce((s, a) => s + a.amount, 0), [assets]);
    const goldAmount = useMemo(() =>
        assets.filter(a => a.assetType === 'gold').reduce((s, a) => s + a.amount, 0), [assets]);
    const stockAssets = useMemo(() =>
        assets.filter(a => a.assetType === 'stock'), [assets]);

    const allLogs = [
        ...(initialMemos || []).map((m: any) => ({ ...m, type: 'GLOBAL' as const })),
        ...(initialAssetMemos || []).map((m: any) => ({ ...m, type: 'ASSET' as const })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);

    return (
        <div className="px-4 py-5 space-y-5">
            {/* Total Asset Value */}
            <div className="bg-card border border-primary/20 rounded-2xl p-5 shadow-sm">
                <p className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase mb-2">
                    {t('dashboard.total_asset_value') || '총 자산 가치'}
                </p>
                {isLoading ? (
                    <div className="h-10 w-48 bg-muted/50 rounded animate-pulse" />
                ) : (
                    <p className="text-3xl font-black tracking-tighter text-foreground">
                        <span className="text-lg text-muted-foreground/50 mr-0.5">₩</span>
                        {(netWorth || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                )}
                <div className="mt-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-muted-foreground">{t('dashboard.live_sync') || '실시간 동기화'}</span>
                </div>
            </div>

            {/* Market Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-2">
                        {t('dashboard.gold_market_price') || 'Gold'}
                    </p>
                    <p className="text-xl font-bold tracking-tight text-foreground">
                        ${goldPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    {initialGold && (
                        <p className={`text-xs mt-1 font-medium ${(initialGold.change || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {(initialGold.change || 0) >= 0 ? '▲' : '▼'}
                            {Math.abs(initialGold.change || 0).toFixed(2)}
                            ({(initialGold.changePercent || 0).toFixed(2)}%)
                        </p>
                    )}
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-2">
                        USD/KRW
                    </p>
                    <p className="text-xl font-bold tracking-tight text-foreground">
                        ₩{exchangeRate?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    {initialExchange && (
                        <p className={`text-xs mt-1 font-medium ${(initialExchange.change || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {(initialExchange.change || 0) >= 0 ? '▲' : '▼'}
                            {Math.abs(initialExchange.change || 0).toFixed(2)}
                            ({(initialExchange.changePercent || 0).toFixed(2)}%)
                        </p>
                    )}
                </div>
            </div>

            {/* Asset Breakdown */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border/50">
                    <h3 className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">
                        자산 현황
                    </h3>
                </div>
                <div className="divide-y divide-border/30">
                    {krwAmount > 0 && (
                        <div className="px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center text-xs font-black">₩</div>
                                <span className="text-sm font-bold">KRW</span>
                            </div>
                            <span className="text-sm font-bold">₩{krwAmount.toLocaleString()}</span>
                        </div>
                    )}
                    {usdAmount > 0 && (
                        <div className="px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center text-xs font-black">$</div>
                                <span className="text-sm font-bold">USD</span>
                            </div>
                            <span className="text-sm font-bold">${usdAmount.toLocaleString()}</span>
                        </div>
                    )}
                    {goldAmount > 0 && (
                        <div className="px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center text-xs font-black">Au</div>
                                <span className="text-sm font-bold">Gold</span>
                            </div>
                            <span className="text-sm font-bold">{goldAmount.toLocaleString()}g</span>
                        </div>
                    )}
                    {stockAssets.map((stock: any) => (
                        <div key={stock.id} className="px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black">
                                    {stock.assetSymbol?.charAt(0) || 'S'}
                                </div>
                                <div>
                                    <p className="text-sm font-bold">{stock.assetSymbol}</p>
                                    <p className="text-[10px] text-muted-foreground">{stock.amount.toLocaleString()} shares</p>
                                </div>
                            </div>
                            <span className="text-sm font-bold">
                                {stock.currency === 'KRW' ? '₩' : '$'}
                                {(stock.amount * (stock.avgPrice || 0)).toLocaleString(undefined, { maximumFractionDigits: stock.currency === 'KRW' ? 0 : 2 })}
                            </span>
                        </div>
                    ))}
                    {assets.length === 0 && (
                        <div className="px-4 py-8 text-center text-sm text-muted-foreground/50">
                            등록된 자산이 없습니다
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border/50">
                    <h3 className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">
                        {t('dashboard.activity_log') || '활동 로그'}
                    </h3>
                </div>
                {allLogs.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground/50">
                        {t('dashboard.no_logs') || '로그가 없습니다'}
                    </div>
                ) : (
                    <div className="divide-y divide-border/30">
                        {allLogs.map((log: any) => (
                            <div key={`${log.type}-${log.id}`} className="px-4 py-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${log.type === 'ASSET' ? 'bg-blue-500/15 text-blue-500' : 'bg-primary/15 text-primary'
                                        }`}>
                                        {log.type === 'ASSET' ? log.tickerSymbol : 'MEMO'}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground/50 font-mono">
                                        {new Date(log.createdAt).toISOString().slice(0, 10)}
                                    </span>
                                </div>
                                <p className="text-sm text-foreground leading-relaxed">{log.content}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ViewModeToggle />
        </div>
    );
}
