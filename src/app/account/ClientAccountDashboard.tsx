"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Landmark, Wallet, Layers, TrendingUp, AlertCircle, PieChart, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { AssetItem } from "@/lib/actions";

type PredefinedAccount = {
    id: string;
    alias: string;
    broker: string;
    accountNumber: string;
    owner: string;
};

interface Props {
    accounts: PredefinedAccount[];
    assets: AssetItem[];
}

export default function ClientAccountDashboard({ accounts, assets }: Props) {
    // Determine the active tab: either an account ID or 'global' for unassigned assets
    const [activeTab, setActiveTab] = useState<string>(accounts.length > 0 ? accounts[0].id : "global");

    // Memoize the derived data for the current view
    const viewData = useMemo(() => {
        let totalValueUsd = 0;
        let totalValueKrw = 0;
        const items: any[] = [];

        if (activeTab === "global") {
            // Unassigned/Global assets (Cash, Gold, etc.)
            assets.forEach(asset => {
                if (asset.assetType === "stock") {
                    // Find stock entries with NO predefinedAccountId
                    const unassignedEntries = asset.entries?.filter(e => !e.predefinedAccountId) || [];
                    unassignedEntries.forEach(entry => {
                        items.push({
                            type: "stock",
                            symbol: asset.assetSymbol,
                            name: asset.assetSymbol,
                            qty: entry.qty,
                            costFlow: entry.totalCost,
                            currency: entry.currency,
                        });
                        if (entry.currency === "USD") totalValueUsd += entry.totalCost;
                        else if (entry.currency === "KRW") totalValueKrw += entry.totalCost;
                    });
                } else {
                    // Pure Cash/Gold MUST have NO predefinedAccountId to show in Global
                    if (!asset.predefinedAccountId) {
                        items.push({
                            type: asset.assetType,
                            name: asset.assetType.toUpperCase(),
                            qty: asset.amount,
                            costFlow: asset.amount, // Approximate value for total
                            currency: asset.assetType === "usd" ? "USD" : asset.assetType === "krw" ? "KRW" : "N/A"
                        });
                        if (asset.assetType === "usd") totalValueUsd += asset.amount;
                        else if (asset.assetType === "krw") totalValueKrw += asset.amount;
                    }
                }
            });
        } else {
            // Selected Account Assets
            assets.forEach(asset => {
                if (asset.assetType === "stock") {
                    const accountEntries = asset.entries?.filter(e => e.predefinedAccountId === activeTab) || [];
                    accountEntries.forEach(entry => {
                        items.push({
                            type: "stock",
                            symbol: asset.assetSymbol,
                            name: asset.assetSymbol,
                            qty: entry.qty,
                            costFlow: entry.totalCost,
                            currency: entry.currency,
                        });
                        if (entry.currency === "USD") totalValueUsd += entry.totalCost;
                        else if (entry.currency === "KRW") totalValueKrw += entry.totalCost;
                    });
                } else {
                    // Cash/Gold MUST MATCH the selected account
                    if (asset.predefinedAccountId === activeTab) {
                        items.push({
                            type: asset.assetType,
                            name: asset.assetType.toUpperCase(),
                            qty: asset.amount,
                            costFlow: asset.amount,
                            currency: asset.assetType === "usd" ? "USD" : asset.assetType === "krw" ? "KRW" : "N/A"
                        });
                        if (asset.assetType === "usd") totalValueUsd += asset.amount;
                        else if (asset.assetType === "krw") totalValueKrw += asset.amount;
                    }
                }
            });
        }

        return { items, totalValueUsd, totalValueKrw };
    }, [activeTab, assets]);

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[500px]">
            {/* Sidebar / Tabs */}
            <div className="w-full lg:w-64 shrink-0 flex flex-col gap-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                    Portfolios View
                </div>

                <button
                    onClick={() => setActiveTab("global")}
                    className={cn(
                        "flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all border",
                        activeTab === "global"
                            ? "bg-primary/10 border-primary/20 text-foreground ring-1 ring-primary/30 shadow-sm"
                            : "bg-card border-border/50 text-muted-foreground hover:bg-muted/80"
                    )}
                >
                    <Layers className={cn("size-5", activeTab === "global" ? "text-primary" : "text-muted-foreground/70")} />
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold">Overall Assets</span>
                        <span className="text-[10px] sm:text-xs opacity-70">Cash, Gold & Misc</span>
                    </div>
                </button>

                <div className="my-2 border-t border-border/50"></div>

                {accounts.length === 0 && (
                    <div className="text-xs text-muted-foreground italic px-2 py-4 text-center border border-dashed rounded-lg bg-muted/30">
                        No accounts registered yet.
                    </div>
                )}

                {accounts.map(acc => (
                    <button
                        key={acc.id}
                        onClick={() => setActiveTab(acc.id)}
                        className={cn(
                            "flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all border",
                            activeTab === acc.id
                                ? "bg-primary/10 border-primary/20 text-foreground ring-1 ring-primary/30 shadow-sm"
                                : "bg-card border-border/50 text-muted-foreground hover:bg-muted/80"
                        )}
                    >
                        <Landmark className={cn("size-5", activeTab === acc.id ? "text-primary" : "text-muted-foreground/70")} />
                        <div className="flex flex-col truncate">
                            <span className="text-sm font-semibold truncate">{acc.alias}</span>
                            <span className="text-[10px] sm:text-xs opacity-70 truncate">{acc.broker} • {acc.accountNumber.slice(-4).padStart(acc.accountNumber.length, '*')}</span>
                        </div>
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col gap-6 w-full max-w-5xl">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="bg-card/40 backdrop-blur border-border/50 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between space-y-0 pb-2">
                                <p className="text-sm font-medium text-muted-foreground">Est. Total Value (USD)</p>
                                <Wallet className="h-4 w-4 text-profit" />
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground mt-2">
                                    <span className="text-xl md:text-2xl font-medium text-muted-foreground/50 mr-1">$</span>
                                    {viewData.totalValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </h2>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/40 backdrop-blur border-border/50 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between space-y-0 pb-2">
                                <p className="text-sm font-medium text-muted-foreground">Est. Total Value (KRW)</p>
                                <Coins className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground mt-2">
                                    <span className="text-xl md:text-2xl font-medium text-muted-foreground/50 mr-1">₩</span>
                                    {viewData.totalValueKrw.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </h2>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/40 backdrop-blur border-border/50 shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
                        <CardContent className="p-6 flex flex-col justify-center h-full">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-primary/10 rounded-full">
                                    <PieChart className="size-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Assets in View</p>
                                    <p className="text-2xl font-bold">{viewData.items.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Asset List Details */}
                <Card className="border-border/60 shadow-sm flex-1">
                    <CardHeader className="border-b bg-muted/20 pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="size-5 text-primary" />
                            {activeTab === "global" ? "Global Holdings" : "Account Holdings"}
                        </CardTitle>
                        <CardDescription>
                            List of assets currently tracked under this view.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {viewData.items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center h-64">
                                <div className="size-12 bg-muted rounded-full flex items-center justify-center mb-4">
                                    <AlertCircle className="size-6 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-medium">No assets found</h3>
                                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                                    {activeTab === "global"
                                        ? "There are no overall assets or cash holdings tracked here yet."
                                        : "This account currently holds no registered assets."}
                                </p>
                            </div>
                        ) : (
                            <div className="w-full overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase bg-muted/10 border-b">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">Asset / Symbol</th>
                                            <th className="px-6 py-4 font-semibold text-right">Quantity / Amount</th>
                                            <th className="px-6 py-4 font-semibold text-right">Cost Value</th>
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
                                                <td className="px-6 py-4 text-right font-medium">
                                                    {item.qty.toLocaleString(undefined, { maximumFractionDigits: 4 })}
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
        </div>
    );
}
