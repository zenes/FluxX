"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Landmark, Wallet, Layers, TrendingUp, AlertCircle, PieChart, Coins, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

import { cn } from "@/lib/utils";
import { AssetItem } from "@/lib/actions";

type PredefinedAccount = {
    id: string;
    alias: string;
    broker: string;
    accountNumber: string;
    owner: string;
};

type ViewMode = 'account' | 'owner';

interface Props {
    accounts: PredefinedAccount[];
    assets: AssetItem[];
}

export default function ClientAccountDashboard({ accounts, assets }: Props) {
    const { t } = useLanguage();

    const [viewMode, setViewMode] = useState<ViewMode>('account');
    const [activeTab, setActiveTab] = useState<string>(accounts.length > 0 ? accounts[0].id : "global");

    // Derive unique owners from accounts list
    const uniqueOwners = useMemo(() => {
        const owners = Array.from(new Set(accounts.map(a => a.owner).filter(Boolean)));
        return owners;
    }, [accounts]);

    const handleViewModeChange = (mode: ViewMode) => {
        setViewMode(mode);
        setActiveTab('global');
    };

    // Memoize the derived data for the current view
    const viewData = useMemo(() => {
        let totalValueUsd = 0;
        let totalValueKrw = 0;
        const stockGroups: Record<string, any> = {};
        const otherGroups: Record<string, any> = {};

        // Determine which account IDs are in scope
        const accountIdsInScope: Set<string> | null = (() => {
            if (activeTab === 'global') return null; // null = all
            if (viewMode === 'account') {
                return new Set([activeTab]);
            } else {
                // owner mode: collect all accounts belonging to this owner
                const ownerAccIds = accounts
                    .filter(a => a.owner === activeTab)
                    .map(a => a.id);
                return new Set(ownerAccIds);
            }
        })();

        assets.forEach(asset => {
            const matchesAccount = !accountIdsInScope || (asset.predefinedAccountId != null && accountIdsInScope.has(asset.predefinedAccountId));

            if (asset.assetType === 'stock') {
                const entries = asset.entries?.filter(e =>
                    !accountIdsInScope || (e.predefinedAccountId != null && accountIdsInScope.has(e.predefinedAccountId))
                ) || [];

                entries.forEach(entry => {
                    const symbol = asset.assetSymbol || 'Unknown';
                    if (!stockGroups[symbol]) {
                        stockGroups[symbol] = {
                            type: 'stock',
                            symbol: symbol,
                            name: symbol,
                            qty: 0,
                            costFlow: 0,
                            currency: entry.currency
                        };
                    }
                    stockGroups[symbol].qty += entry.qty;
                    stockGroups[symbol].costFlow += entry.totalCost;

                    if (entry.currency === "USD") totalValueUsd += entry.totalCost;
                    else if (entry.currency === "KRW") totalValueKrw += entry.totalCost;
                });
            } else {
                // Cash/Gold/etc. - These MUST match the selected view
                if (matchesAccount) {
                    const type = asset.assetType;
                    const currency = type === "usd" ? "USD" : type === "krw" ? "KRW" : "N/A";
                    if (!otherGroups[type]) {
                        otherGroups[type] = {
                            type: type,
                            name: type.toUpperCase(),
                            qty: 0,
                            costFlow: 0,
                            currency: currency
                        };
                    }
                    otherGroups[type].qty += asset.amount;
                    otherGroups[type].costFlow += asset.amount;

                    if (type === "usd") totalValueUsd += asset.amount;
                    else if (type === "krw") totalValueKrw += asset.amount;
                }
            }
        });

        // Combine groups and calculate final weighted avgPrice
        const items = [...Object.values(stockGroups), ...Object.values(otherGroups)].map(item => ({
            ...item,
            avgPrice: item.type === 'stock' && item.qty > 0 ? item.costFlow / item.qty : 0
        }));

        return { items, totalValueUsd, totalValueKrw };
    }, [activeTab, viewMode, accounts, assets]);

    return (
        <div className="flex flex-col gap-8 h-full w-full max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="mb-2">
                <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
                    <span className="h-6 w-1 bg-primary"></span>
                    {t('accounts.title')}
                </h1>
                <p className="text-xs text-muted-foreground mt-1 opacity-60">
                    {t('accounts.subtitle')}
                </p>
            </div>

            {/* Top Navigation: Account Selector */}
            <div className="w-full flex flex-col gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-3">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">
                        {t('accounts.portfolios_view')}
                    </div>
                    <div className="flex items-center gap-1 bg-muted/40 border border-border/50 rounded-full p-0.5 ml-auto">
                        <button
                            onClick={() => handleViewModeChange('account')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all",
                                viewMode === 'account'
                                    ? "bg-primary text-primary-foreground shadow"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Landmark className="size-3" />
                            {t('accounts.sort_by_account')}
                        </button>
                        <button
                            onClick={() => handleViewModeChange('owner')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all",
                                viewMode === 'owner'
                                    ? "bg-primary text-primary-foreground shadow"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <User className="size-3" />
                            {t('accounts.sort_by_owner')}
                        </button>
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
                    <button
                        onClick={() => setActiveTab("global")}
                        className={cn(
                            "flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-2.5 rounded-full transition-all border text-xs md:text-sm font-semibold whitespace-nowrap shrink-0",
                            activeTab === "global"
                                ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                                : "bg-card border-border/50 text-muted-foreground hover:bg-muted/80"
                        )}
                    >
                        <Layers className="size-3.5 md:size-4" />
                        <span>{t('accounts.overall_assets')}</span>
                    </button>

                    {viewMode === 'account' && accounts.map(acc => (
                        <button
                            key={acc.id}
                            onClick={() => setActiveTab(acc.id)}
                            className={cn(
                                "flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-2.5 rounded-full transition-all border text-xs md:text-sm font-semibold whitespace-nowrap shrink-0",
                                activeTab === acc.id
                                    ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                                    : "bg-card border-border/50 text-muted-foreground hover:bg-muted/80"
                            )}
                        >
                            <Landmark className="size-3.5 md:size-4" />
                            <span>{acc.alias}</span>
                        </button>
                    ))}

                    {viewMode === 'owner' && uniqueOwners.map(owner => (
                        <button
                            key={owner}
                            onClick={() => setActiveTab(owner)}
                            className={cn(
                                "flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-2.5 rounded-full transition-all border text-xs md:text-sm font-semibold whitespace-nowrap shrink-0",
                                activeTab === owner
                                    ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                                    : "bg-card border-border/50 text-muted-foreground hover:bg-muted/80"
                            )}
                        >
                            <User className="size-3.5 md:size-4" />
                            <span>{owner}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <Card className="bg-card/40 backdrop-blur border-border/50 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60">{t('accounts.est_total_value_usd')}</p>
                            <Wallet className="h-4 w-4 text-profit" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter text-foreground mt-1">
                                <span className="text-lg font-medium text-muted-foreground/30 mr-1">$</span>
                                {viewData.totalValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h2>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/40 backdrop-blur border-border/50 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60">{t('accounts.est_total_value_krw')}</p>
                            <Coins className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter text-foreground mt-1">
                                <span className="text-lg font-medium text-muted-foreground/30 mr-1">₩</span>
                                {viewData.totalValueKrw.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </h2>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/40 backdrop-blur border-border/50 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between space-y-0 pb-2 text-primary">
                            <p className="text-xs font-bold uppercase tracking-widest opacity-60">{t('accounts.assets_in_view')}</p>
                            <PieChart className="h-4 w-4" />
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                            <p className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter">{viewData.items.length}</p>
                            <span className="text-xs font-bold text-muted-foreground opacity-40 uppercase tracking-tighter">Items Discovered</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Asset List Details */}
            <Card className="border-border/40 shadow-xl shadow-black/5 flex-1 overflow-hidden">
                <CardHeader className="border-b bg-muted/10 pb-6 pt-8 px-8">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <CardTitle className="text-xl font-black tracking-tight flex items-center gap-3">
                                <div className="size-2 bg-primary rounded-full animate-pulse" />
                                {activeTab === "global" ? t('accounts.global_holdings') : t('accounts.account_holdings')}
                            </CardTitle>
                            <CardDescription className="text-xs font-medium opacity-60">
                                {t('accounts.list_of_assets')}
                            </CardDescription>
                        </div>
                        <div className="hidden sm:flex items-center gap-2">
                            <div className="px-3 py-1 bg-muted rounded-full border border-border/50 text-[10px] font-bold text-muted-foreground uppercase">
                                Verified
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {viewData.items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center h-64">
                            <div className="size-12 bg-muted rounded-full flex items-center justify-center mb-4">
                                <AlertCircle className="size-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium">{t('accounts.no_assets_found')}</h3>
                            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                                {activeTab === "global"
                                    ? t('accounts.no_assets_global')
                                    : t('accounts.no_assets_account')}
                            </p>
                        </div>
                    ) : (
                        <div className="w-full overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/10 border-b">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">{t('accounts.asset_symbol')}</th>
                                        <th className="px-6 py-4 font-semibold text-right">{t('accounts.quantity_amount')}</th>
                                        <th className="px-6 py-4 font-semibold text-right">{t('accounts.cost_value')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {viewData.items.map((item, i) => (
                                        <tr key={i} className="hover:bg-muted/10 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "size-8 rounded-full flex items-center justify-center font-bold text-xs uppercase",
                                                        item.type === 'stock' ? "bg-chart-1/10 text-chart-1" :
                                                            item.type === 'gold' ? "bg-chart-2/10 text-chart-2" :
                                                                "bg-chart-3/10 text-chart-3"
                                                    )}>
                                                        {item.type === 'stock' ? 'ST' : item.type === 'gold' ? 'AU' : '$'}
                                                    </div>
                                                    <span className="font-semibold">{item.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="font-medium">
                                                    {item.qty.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                                </div>
                                                {item.type === 'stock' && (
                                                    <div className="text-[10px] text-muted-foreground">
                                                        Avg: {item.currency === "KRW" ? "₩" : item.currency === "USD" ? "$" : ""}
                                                        {item.avgPrice.toLocaleString(undefined, {
                                                            minimumFractionDigits: item.currency === "USD" ? 2 : 0,
                                                            maximumFractionDigits: item.currency === "USD" ? 2 : 0
                                                        })}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="font-medium">
                                                    {item.currency === "KRW" ? "₩" : item.currency === "USD" ? "$" : ""}
                                                    {item.costFlow.toLocaleString(undefined, {
                                                        minimumFractionDigits: item.currency === "USD" ? 2 : 0,
                                                        maximumFractionDigits: item.currency === "USD" ? 2 : 0
                                                    })}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground uppercase">{item.currency}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
