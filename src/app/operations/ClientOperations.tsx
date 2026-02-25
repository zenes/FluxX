'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import AssetModal from '@/components/AssetModal';
import { AssetItem } from '@/lib/actions';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Plus, Building2, UserCircle2, Hash } from 'lucide-react';

import StockEntryForm from '@/components/StockEntryForm';
import { deleteStockEntry } from '@/lib/actions';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function ClientOperations({
    assets,
    predefinedAccounts = []
}: {
    assets: AssetItem[],
    predefinedAccounts?: any[]
}) {
    const accounts = predefinedAccounts; // assign prop to local variable to match previous usage
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

    const handleDeleteEntry = async (entryId: string, symbol: string) => {
        if (!confirm('Are you sure you want to delete this account entry?')) return;
        try {
            await deleteStockEntry(entryId, symbol);
            window.location.reload();
        } catch (e) {
            console.error(e);
            alert('Failed to delete entry');
        }
    };
    const [modalState, setModalState] = useState<{ isOpen: boolean, type: string, amount: number, label: string, unit: string }>({
        isOpen: false,
        type: '',
        amount: 0,
        label: '',
        unit: ''
    });

    const [globalStockSheetOpen, setGlobalStockSheetOpen] = useState(false);
    const [stockPrices, setStockPrices] = useState<Record<string, { price: number, change: number, changePercent: number, shortName: string, currency: string }>>({});

    const [rates, setRates] = useState({ usdKrw: 1400, goldUsd: 2600 });
    const [loadingRates, setLoadingRates] = useState(true);

    useEffect(() => {
        // Fetch live rates from our backend APIs for Net Worth calculation
        const fetchRates = async () => {
            try {
                const stockSymbols = assets.filter(a => a.assetType === 'stock' && a.assetSymbol).map(a => a.assetSymbol).join(',');

                const fetchPromises: Promise<any>[] = [
                    fetch('/api/exchange-rate').then(r => r.json()).catch(() => ({})),
                    fetch('/api/gold-price?market=global').then(r => r.json()).catch(() => ({}))
                ];

                if (stockSymbols) {
                    fetchPromises.push(fetch(`/api/stock-price?symbols=${stockSymbols}`).then(r => r.json()).catch(() => ({})));
                } else {
                    fetchPromises.push(Promise.resolve({}));
                }

                const [fxData, goldData, stockData] = await Promise.all(fetchPromises);

                let newUsdKrw = 1400;
                let newGoldUsd = 2600;

                if (fxData && fxData.rate) newUsdKrw = fxData.rate;
                if (goldData && goldData.price) newGoldUsd = goldData.price;

                setRates({ usdKrw: newUsdKrw, goldUsd: newGoldUsd });
                if (stockData && stockData.quotes) {
                    setStockPrices(stockData.quotes);
                }
            } catch (e) {
                console.error('Failed to fetch live rates, using defaults', e);
            } finally {
                setLoadingRates(false);
            }
        };
        fetchRates();
    }, []);

    // Helper to extract amounts
    const getAmount = (type: string) => assets.find(a => a.assetType === type)?.amount || 0;

    const goldAmount = getAmount('gold');
    const usdAmount = getAmount('usd');
    const krwAmount = getAmount('krw');

    // Convert Gold(g) to Troy Ounces for Dollar valuation (1 oz = 31.1034768 g)
    const goldOz = goldAmount / 31.1034768;
    const goldKrw = goldOz * rates.goldUsd * rates.usdKrw;
    const usdKrw = usdAmount * rates.usdKrw;

    // Evaluate Stocks
    const stocks = assets.filter(a => a.assetType === 'stock' && a.assetSymbol);
    let totalStockKrw = 0;
    stocks.forEach(stock => {
        const symbol = stock.assetSymbol!;
        const priceData = stockPrices[symbol];
        const currentPrice = priceData ? priceData.price : (stock.avgPrice || 0);
        const currency = stock.currency || priceData?.currency || 'USD';

        const valueInOriginalCurrency = stock.amount * currentPrice;

        if (currency === 'KRW') {
            totalStockKrw += valueInOriginalCurrency;
        } else {
            totalStockKrw += valueInOriginalCurrency * rates.usdKrw;
        }
    });

    const netWorth = goldKrw + usdKrw + krwAmount + totalStockKrw;

    const chartData = [
        { name: 'Gold Reserve', value: goldKrw, color: 'hsl(var(--chart-1))' },
        { name: 'Foreign Currency', value: usdKrw, color: 'hsl(var(--chart-2))' },
        { name: 'Local Currency', value: krwAmount, color: 'hsl(var(--chart-3))' },
        { name: 'Stock Assets', value: totalStockKrw, color: 'hsl(var(--chart-4))' },
    ].filter(item => item.value > 0);

    const openModal = (type: string, amount: number, label: string, unit: string) => {
        setModalState({ isOpen: true, type, amount, label, unit });
    };

    return (
        <div className="flex-1 p-6 md:p-8 xl:p-12 h-full overflow-y-auto w-full bg-background">
            <div className="mb-10 max-w-screen-xl mx-auto">
                <h1 className="text-3xl font-bold tracking-tighter uppercase text-primary flex items-center gap-3">
                    <span className="h-6 w-2 bg-primary animate-pulse"></span>
                    Operations Portfolio
                </h1>
                <div className="flex justify-between items-center mt-2 pl-5">
                    <p className="text-sm font-mono text-muted-foreground opacity-70">
                        SECURE PERSONAL ASSET MANAGEMENT & INTELLIGENCE
                    </p>
                    <button
                        onClick={() => setGlobalStockSheetOpen(true)}
                        className="text-xs font-bold tracking-widest text-primary bg-primary/10 border border-primary/20 px-4 py-2 rounded-sm hover:bg-primary/20 uppercase transition-colors flex items-center gap-2"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Add Global Stock
                    </button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3 mb-10 max-w-screen-xl mx-auto">
                {/* Net Worth Summary Card */}
                <div className="md:col-span-2 bg-gradient-to-br from-card to-card/50 border border-primary/20 shadow-[0_0_30px_rgba(59,130,246,0.05)] rounded-lg p-8 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                    </div>

                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Total Net Worth (Estimated KRW)</h2>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl md:text-6xl font-black tracking-tighter text-foreground font-mono">
                            ₩{netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                    </div>

                    <div className="mt-8 pt-6 border-t border-border flex flex-wrap gap-8 text-[11px] font-mono tracking-widest uppercase">
                        <div>
                            <span className="text-muted-foreground block mb-1">Live USD/KRW</span>
                            <span className="text-primary font-bold">{loadingRates ? '---' : `₩${rates.usdKrw.toLocaleString()}`}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block mb-1">Live Gold/oz</span>
                            <span className="text-foreground font-bold">{loadingRates ? '---' : `$${rates.goldUsd.toLocaleString()}`}</span>
                        </div>
                        <div className="ml-auto flex items-end">
                            <span className="text-muted-foreground opacity-50 flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-green-500"></span> SECURE SYNC
                            </span>
                        </div>
                    </div>
                </div>

                {/* Visual Chart Card */}
                <div className="bg-card border border-input shadow-lg rounded-lg p-6 flex flex-col items-center justify-center min-h-[350px]">
                    <h3 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground w-full text-center uppercase mb-6">Asset Distribution</h3>
                    {chartData.length > 0 ? (
                        <div className="w-full h-full flex-1 w-full min-h-[280px]">
                            {/* Chart Area */}
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                        labelLine={{ stroke: '#475569', strokeWidth: 1.5, strokeDasharray: '2 2' }}
                                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, fill }: any) => {
                                            if (!percent || percent < 0.02) return null;
                                            const RADIAN = Math.PI / 180;
                                            // Increase radius for label positioning
                                            const radius = innerRadius + (outerRadius - innerRadius) + 40;
                                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                            return (
                                                <text
                                                    x={x}
                                                    y={y}
                                                    fill={fill}
                                                    textAnchor={x > cx ? 'start' : 'end'}
                                                    dominantBaseline="central"
                                                    className="font-mono text-[11px] font-bold tracking-widest"
                                                >
                                                    {(percent * 100).toFixed(1)}%
                                                </text>
                                            );
                                        }}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        formatter={(value: any) => `₩${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '0', fontFamily: 'monospace', fontSize: '12px' }}
                                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>

                            {/* Explicit Legend */}
                            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 px-4">
                                {chartData.map((entry, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                                        <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase truncate">{entry.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-xs font-mono tracking-widest text-muted-foreground opacity-50 flex flex-col items-center justify-center h-full gap-2 min-h-[220px]">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4M12 20V4" /></svg>
                            NO ASSET DATA
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-screen-xl mx-auto">
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground mb-4">Classified Asset Inventory</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                    {/* KRW */}
                    <div className="bg-card border border-input rounded-md p-6 flex flex-col relative group overflow-hidden shadow-sm hover:border-foreground/30 hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openModal('krw', krwAmount, 'Local Currency', 'KRW')} className="text-[10px] font-bold tracking-widest text-foreground bg-muted border border-border px-3 py-1.5 rounded-sm hover:bg-muted/80 uppercase transition-colors">EDIT</button>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-chart-3"></span> Local Currency
                        </span>
                        <span className="text-3xl font-black text-foreground tracking-tight mt-1">₩{krwAmount.toLocaleString()}</span>
                        <div className="flex justify-between items-end mt-4">
                            <span className="text-[10px] font-mono text-muted-foreground opacity-70">LIQUIDITY RESERVE</span>
                            <span className="text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded-sm">{((krwAmount / netWorth) * 100).toFixed(1)}%</span>
                        </div>
                    </div>

                    {/* USD */}
                    <div className="bg-card border border-input rounded-md p-6 flex flex-col relative group overflow-hidden shadow-sm hover:border-foreground/30 hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openModal('usd', usdAmount, 'Foreign Currency', 'USD')} className="text-[10px] font-bold tracking-widest text-foreground bg-muted border border-border px-3 py-1.5 rounded-sm hover:bg-muted/80 uppercase transition-colors">EDIT</button>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-chart-2"></span> Foreign Currency
                        </span>
                        <span className="text-3xl font-black text-foreground tracking-tight mt-1">${usdAmount.toLocaleString()}</span>
                        <div className="mt-4 flex justify-between items-end">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-mono text-muted-foreground opacity-70">EST VALUE (KRW)</span>
                                <span className="text-xs font-mono font-medium text-foreground">₩{usdKrw.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                            <span className="text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded-sm">{((usdKrw / netWorth) * 100).toFixed(1)}%</span>
                        </div>
                    </div>

                    {/* Gold */}
                    <div className="bg-card border border-input rounded-md p-6 flex flex-col relative group overflow-hidden shadow-sm hover:border-foreground/30 hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openModal('gold', goldAmount, 'Gold Reserve', 'g')} className="text-[10px] font-bold tracking-widest text-foreground bg-muted border border-border px-3 py-1.5 rounded-sm hover:bg-muted/80 uppercase transition-colors">EDIT</button>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-chart-1"></span> Gold Reserve
                        </span>
                        <span className="text-3xl font-black text-foreground tracking-tight mt-1">{goldAmount.toLocaleString()} <span className="text-xl">g</span></span>
                        <div className="mt-4 flex justify-between items-end">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-mono text-muted-foreground opacity-70">EST VALUE (KRW)</span>
                                <span className="text-xs font-mono font-medium text-foreground">₩{goldKrw.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                            <span className="text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded-sm">{((goldKrw / netWorth) * 100).toFixed(1)}%</span>
                        </div>
                    </div>

                    {/* Global Equities Card */}
                    <div className="bg-card border border-input rounded-md p-6 flex flex-col relative group overflow-hidden shadow-sm hover:border-foreground/30 hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setGlobalStockSheetOpen(true)} className="text-[10px] font-bold tracking-widest text-foreground bg-muted border border-border px-3 py-1.5 rounded-sm hover:bg-muted/80 uppercase transition-colors">ADD</button>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-chart-4"></span> Global Equities
                        </span>
                        <span className="text-3xl font-black text-foreground tracking-tight mt-1">
                            ₩{totalStockKrw.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                        <div className="mt-4 flex justify-between items-end">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-mono text-muted-foreground opacity-70">SECURITIES TOTAL</span>
                                <span className="text-xs font-mono font-medium text-foreground">{stocks.length} SYMBOLS</span>
                            </div>
                            <span className="text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded-sm">
                                {((totalStockKrw / netWorth) * 100).toFixed(1)}%
                            </span>
                        </div>
                    </div>

                </div>
            </div>

            <div className="max-w-screen-xl mx-auto mt-10">
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground mb-4">Stock Intelligence (Global Marketplace)</h3>
                {stocks.length === 0 ? (
                    <div className="bg-card border border-input border-dashed rounded-md p-8 flex flex-col items-center justify-center text-muted-foreground font-mono text-xs opacity-50">
                        NO EQUITY ASSETS REGISTERED
                    </div>
                ) : (
                    <Accordion type="multiple" className="w-full max-w-4xl">
                        {stocks.map(stock => {
                            const symbol = stock.assetSymbol!;
                            const priceData = stockPrices[symbol];
                            const currentPrice = priceData ? priceData.price : (stock.avgPrice || 0);
                            const currency = stock.currency || priceData?.currency || 'USD'; // Prefer DB currency

                            const valueOriginal = stock.amount * currentPrice;
                            const valueKrw = currency === 'KRW' ? valueOriginal : valueOriginal * rates.usdKrw;
                            const valueUsd = currency === 'USD' ? valueOriginal : valueOriginal / rates.usdKrw;

                            const avgPrice = stock.avgPrice || 0;
                            const roi = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;
                            const isPositive = roi >= 0;

                            // Grayscale semantic colors
                            const roiColor = isPositive ? 'text-profit' : 'text-loss';

                            const entriesList = stock.entries || [];

                            return (
                                <AccordionItem key={stock.id} value={symbol} className="bg-card border border-input rounded-md shadow-sm overflow-hidden mb-4 px-6 transition-all hover:border-purple-500/30">
                                    <AccordionTrigger className="hover:no-underline py-6">
                                        <div className="flex justify-between items-center w-full pr-4 text-left">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl font-black text-foreground tracking-tight">{symbol}</span>
                                                    <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-sm border border-border">{stock.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} shares</span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground truncate max-w-[200px] mt-1">{priceData?.shortName || 'US Equity'}</span>
                                            </div>

                                            <div className="flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded-sm" title="[Weight in Stock Portfolio] / [Total Equity weight in Net Worth]">
                                                        {(totalStockKrw > 0 ? (valueKrw / totalStockKrw) * 100 : 0).toFixed(1)}% <span className="text-muted-foreground opacity-50 font-normal">/</span> {(netWorth > 0 ? (totalStockKrw / netWorth) * 100 : 0).toFixed(1)}%
                                                    </span>
                                                    <span className="text-lg font-black text-foreground tracking-tight">
                                                        {currency === 'KRW' ? '₩' : '$'}{valueOriginal.toLocaleString(undefined, { maximumFractionDigits: currency === 'KRW' ? 0 : 2 })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-muted-foreground">Avg: {currency === 'KRW' ? '₩' : '$'}{avgPrice.toLocaleString(undefined, { maximumFractionDigits: currency === 'KRW' ? 0 : 2 })}</span>
                                                    <span className={`text-xs font-bold ${roiColor}`}>{isPositive ? '+' : ''}{roi.toFixed(2)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-2 pb-6 border-t border-border/50">
                                        <div className="flex flex-col gap-3">
                                            <div className="grid grid-cols-12 text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 bg-muted/30 rounded-t-sm">
                                                <div className="col-span-3">Broker</div>
                                                <div className="col-span-3">Owner</div>
                                                <div className="col-span-2 text-right">Shares</div>
                                                <div className="col-span-2 text-right">Avg Cost</div>
                                                <div className="col-span-2 text-right pr-14">Total Cost</div>
                                            </div>

                                            {entriesList.length === 0 && (
                                                <div className="text-center py-6 text-muted-foreground text-xs font-mono opacity-50">
                                                    No broker accounts registered.
                                                </div>
                                            )}
                                            {entriesList.map((entry, idx) => (
                                                <div key={idx} className="grid grid-cols-12 text-xs font-mono items-center px-4 py-2 border-b border-border/50 hover:bg-muted/20 transition-colors">
                                                    <div className="col-span-3 flex items-center gap-2">
                                                        <Building2 size={12} className="text-muted-foreground" />
                                                        {entry.broker}
                                                    </div>
                                                    <div className="col-span-3 flex items-center gap-2 text-muted-foreground">
                                                        <UserCircle2 size={12} />
                                                        <span className="truncate">
                                                            {entry.owner} {entry.account ? `(${entry.account})` : ''}
                                                            {entry.predefinedAccountAlias && (
                                                                <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm border border-primary/20">
                                                                    {entry.predefinedAccountAlias}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="col-span-2 text-right font-medium">{entry.qty.toLocaleString()}</div>
                                                    <div className="col-span-2 text-right text-muted-foreground">{entry.currency === 'KRW' ? '₩' : '$'}{entry.qty > 0 ? (entry.totalCost / entry.qty).toLocaleString(undefined, { minimumFractionDigits: entry.currency === 'KRW' ? 0 : 2, maximumFractionDigits: 2 }) : '0.00'}</div>
                                                    <div className="col-span-2 flex justify-end items-center gap-3">
                                                        <span className="text-right">{entry.currency === 'KRW' ? '₩' : '$'}{entry.totalCost.toLocaleString(undefined, { minimumFractionDigits: entry.currency === 'KRW' ? 0 : 2, maximumFractionDigits: 2 })}</span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setEditingEntryId(entry.id); }}
                                                            className="text-blue-500 hover:text-blue-400 p-1 rounded-sm bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                                                            title="Edit Entry"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteEntry(entry.id, symbol); }}
                                                            className="text-red-500 hover:text-red-400 p-1 rounded-sm bg-red-500/10 hover:bg-red-500/20 transition-colors"
                                                            title="Delete Entry"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </div>
                                                    {editingEntryId === entry.id && (
                                                        <div className="col-span-12 mt-4 p-4 border border-input rounded-md bg-muted/20">
                                                            <StockEntryForm
                                                                symbol={symbol}
                                                                initialData={{
                                                                    id: entry.id,
                                                                    broker: entry.broker,
                                                                    owner: entry.owner,
                                                                    account: entry.account,
                                                                    qty: entry.qty,
                                                                    totalCost: entry.totalCost,
                                                                    currency: entry.currency,
                                                                    predefinedAccountId: entry.predefinedAccountId
                                                                }}
                                                                onSuccess={() => setEditingEntryId(null)}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            <div className="mt-4 px-4 flex justify-end">
                                                <Sheet>
                                                    <SheetTrigger asChild>
                                                        <button className="text-xs font-bold tracking-widest text-primary bg-primary/5 border border-primary/20 px-4 py-2 rounded-sm hover:bg-primary/20 uppercase transition-colors flex items-center gap-2">
                                                            <Plus size={14} /> Add Account for {symbol}
                                                        </button>
                                                    </SheetTrigger>
                                                    <SheetContent className="sm:max-w-md border-l border-primary/20 flex flex-col items-center justify-center">
                                                        <SheetHeader className="absolute top-6 left-6 text-left">
                                                            <SheetTitle className="text-2xl font-black tracking-tighter uppercase text-primary flex items-center gap-2">
                                                                <span className="h-5 w-1.5 bg-primary animate-pulse"></span>
                                                                Add {symbol} Entry
                                                            </SheetTitle>
                                                            <SheetDescription className="font-mono text-xs mt-2 uppercase tracking-widest">
                                                                Securely register new broker account holdings for {symbol}.
                                                            </SheetDescription>
                                                        </SheetHeader>

                                                        <div className="w-full h-full mt-24">
                                                            <StockEntryForm
                                                                symbol={symbol}
                                                                initialCurrency={currency} // Pass determined currency
                                                                onSuccess={() => {
                                                                    // Close sheet logic can be handled via key or parent state later
                                                                    window.location.reload(); // Simple refresh to see new entry for now
                                                                }}
                                                            />
                                                        </div>
                                                    </SheetContent>
                                                </Sheet>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                )}
            </div>

            {/* Edit Stock Entry Sheet */}
            {editingEntryId && (() => {
                // Find the entry details across all assets
                let foundEntryContext = null;
                for (const asset of assets) {
                    if (asset.entries) {
                        const entry = asset.entries.find(e => e.id === editingEntryId);
                        if (entry) {
                            foundEntryContext = { entry, symbol: asset.assetSymbol! };
                            break;
                        }
                    }
                }

                if (!foundEntryContext) return null;

                return (
                    <Sheet open={!!editingEntryId} onOpenChange={(open) => !open && setEditingEntryId(null)}>
                        <SheetContent className="sm:max-w-md border-l border-primary/20 flex flex-col items-center justify-center">
                            <SheetHeader className="absolute top-6 left-6 text-left">
                                <SheetTitle className="text-2xl font-black tracking-tighter uppercase text-primary flex items-center gap-2">
                                    <span className="h-5 w-1.5 bg-primary animate-pulse"></span>
                                    Edit {foundEntryContext.symbol} Entry
                                </SheetTitle>
                                <SheetDescription className="font-mono text-xs mt-2 uppercase tracking-widest">
                                    Update existing broker account holding records.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="w-full h-full mt-24">
                                <StockEntryForm
                                    symbol={foundEntryContext.symbol}
                                    onSuccess={() => {
                                        setEditingEntryId(null);
                                        window.location.reload();
                                    }}
                                    initialData={foundEntryContext.entry}
                                />
                            </div>
                        </SheetContent>
                    </Sheet>
                );
            })()}

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
                <SheetContent className="sm:max-w-md border-l border-primary/20 flex flex-col items-center justify-center">
                    <SheetHeader className="absolute top-6 left-6 text-left">
                        <SheetTitle className="text-2xl font-black tracking-tighter uppercase text-primary flex items-center gap-2">
                            <span className="h-5 w-1.5 bg-primary animate-pulse"></span>
                            Unified stock Entry
                        </SheetTitle>
                        <SheetDescription className="font-mono text-xs mt-2 uppercase tracking-widest">
                            Identify ticker and register broker account holdings.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="w-full h-full mt-24">
                        <StockEntryForm
                            onSuccess={() => {
                                setGlobalStockSheetOpen(false);
                                window.location.reload();
                            }}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
