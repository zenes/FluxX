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
import { Plus, Building2, UserCircle2, Hash, Trash2 } from 'lucide-react';

import StockEntryForm from '@/components/StockEntryForm';
import TickerIcon from '@/components/TickerIcon';
import AnimatedNumber from '@/components/AnimatedNumber';
import { deleteStockEntry, addAssetMemo, getAssetMemos, deleteAssetMemo } from '@/lib/actions';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function ClientOperations({
    assets,
    predefinedAccounts = []
}: {
    assets: AssetItem[],
    predefinedAccounts?: any[]
}) {
    const { t } = useLanguage();
    const accounts = predefinedAccounts; // assign prop to local variable to match previous usage
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
    const [memosBySymbol, setMemosBySymbol] = useState<Record<string, any[]>>({});
    const [newMemoContent, setNewMemoContent] = useState<Record<string, string>>({});
    const [isSubmittingMemo, setIsSubmittingMemo] = useState<Record<string, boolean>>({});

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

    const loadMemos = async (symbol: string) => {
        try {
            const fetchedMemos = await getAssetMemos(symbol);
            setMemosBySymbol(prev => ({ ...prev, [symbol]: fetchedMemos }));
        } catch (e) {
            console.error('Failed to load memos for', symbol, e);
        }
    };

    const handleAddMemo = async (symbol: string) => {
        const content = newMemoContent[symbol]?.trim();
        if (!content) return;

        setIsSubmittingMemo(prev => ({ ...prev, [symbol]: true }));
        try {
            await addAssetMemo(symbol, content);
            setNewMemoContent(prev => ({ ...prev, [symbol]: '' }));
            await loadMemos(symbol);
        } catch (e) {
            console.error('Failed to add memo', e);
            alert('Failed to add memo');
        } finally {
            setIsSubmittingMemo(prev => ({ ...prev, [symbol]: false }));
        }
    };

    const handleDeleteMemo = async (symbol: string, memoId: string) => {
        if (!confirm('Are you sure you want to delete this memo?')) return;
        try {
            await deleteAssetMemo(memoId);
            await loadMemos(symbol);
        } catch (e) {
            console.error('Failed to delete memo', e);
            alert('Failed to delete memo');
        }
    };

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
        <div className="flex-1 p-4 md:p-8 h-full overflow-y-auto w-full bg-background">
            <div className="mb-10 max-w-screen-xl mx-auto">
                <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
                    <span className="h-6 w-1 bg-primary"></span>
                    {t('ops.title')}
                </h1>
                <div className="flex justify-between items-center mt-2 pl-5">
                    <p className="text-xs text-muted-foreground opacity-60">
                        {t('ops.subtitle')}
                    </p>
                    <button
                        onClick={() => setGlobalStockSheetOpen(true)}
                        className="text-xs font-bold tracking-widest text-primary bg-primary/10 border border-primary/20 px-4 py-2 rounded-sm hover:bg-primary/20 uppercase transition-colors flex items-center gap-2"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        {t('ops.add_global_stock')}
                    </button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3 mb-10 max-w-screen-xl mx-auto">
                {/* Net Worth Summary Card */}
                <div className="md:col-span-2 bg-gradient-to-br from-card to-card/50 border border-primary/20 shadow-[0_0_30px_rgba(59,130,246,0.05)] rounded-lg p-8 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                    </div>

                    <h2 className="text-[10px] font-bold tracking-wider text-muted-foreground mb-4 opacity-70">{t('ops.net_worth')}</h2>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl md:text-6xl font-bold tracking-tighter text-foreground">
                            <span className="text-2xl md:text-3xl font-medium text-muted-foreground/50 mr-1 italic">₩</span>
                            <AnimatedNumber
                                value={netWorth}
                                formatOptions={{ maximumFractionDigits: 0 }}
                                duration={900}
                                animateOnChange
                            />
                        </span>
                    </div>

                    <div className="mt-8 pt-6 border-t border-border flex flex-wrap gap-8 text-[10px] tracking-wider uppercase">
                        <div>
                            <span className="text-muted-foreground block mb-1">{t('ops.live_usd_krw')}</span>
                            <span className="text-primary font-bold">{loadingRates ? '---' : `₩${rates.usdKrw.toLocaleString()}`}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block mb-1">{t('ops.live_gold_oz')}</span>
                            <span className="text-foreground font-bold">{loadingRates ? '---' : `$${rates.goldUsd.toLocaleString()}`}</span>
                        </div>
                        <div className="ml-auto flex items-end">
                            <span className="text-muted-foreground opacity-40 flex items-center gap-1 font-medium">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span> {t('ops.secure_sync')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Visual Chart Card */}
                <div className="bg-card border border-input shadow-lg rounded-lg p-6 flex flex-col items-center justify-center min-h-[350px]">
                    <h3 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground w-full text-center uppercase mb-6">{t('ops.asset_distribution')}</h3>
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
                                                    className="text-[11px] font-bold tracking-wider"
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
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">{entry.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-xs tracking-wider text-muted-foreground opacity-50 flex flex-col items-center justify-center h-full gap-2 min-h-[220px]">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4M12 20V4" /></svg>
                            {t('ops.no_asset_data')}
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-screen-xl mx-auto">
                <h3 className="text-[10px] font-bold tracking-wider text-muted-foreground mb-4 opacity-70">{t('ops.inventory_title')}</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                    {/* KRW */}
                    <div className="bg-card border border-input rounded-md p-6 flex flex-col relative group overflow-hidden shadow-sm hover:border-foreground/30 hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openModal('krw', krwAmount, 'Local Currency', 'KRW')} className="text-[10px] font-bold tracking-widest text-foreground bg-muted border border-border px-3 py-1.5 rounded-sm hover:bg-muted/80 uppercase transition-colors">{t('ops.edit')}</button>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground tracking-wider mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-chart-3"></span> {t('ops.local_currency')}
                        </span>
                        <span className="text-3xl font-bold text-foreground tracking-tighter mt-1">₩{krwAmount.toLocaleString()}</span>
                        <div className="flex justify-between items-end mt-4">
                            <span className="text-[10px] text-muted-foreground opacity-60">{t('ops.liquidity_reserve')}</span>
                            <span className="text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded-sm">{((krwAmount / netWorth) * 100).toFixed(1)}%</span>
                        </div>
                    </div>

                    {/* USD */}
                    <div className="bg-card border border-input rounded-md p-6 flex flex-col relative group overflow-hidden shadow-sm hover:border-foreground/30 hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openModal('usd', usdAmount, 'Foreign Currency', 'USD')} className="text-[10px] font-bold tracking-widest text-foreground bg-muted border border-border px-3 py-1.5 rounded-sm hover:bg-muted/80 uppercase transition-colors">{t('ops.edit')}</button>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground tracking-wider mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-chart-2"></span> {t('ops.foreign_currency')}
                        </span>
                        <span className="text-3xl font-bold text-foreground tracking-tighter mt-1">${usdAmount.toLocaleString()}</span>
                        <div className="mt-4 flex justify-between items-end">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] text-muted-foreground opacity-60">{t('ops.est_value_krw')}</span>
                                <span className="text-xs font-medium text-foreground">₩{usdKrw.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                            <span className="text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded-sm">{((usdKrw / netWorth) * 100).toFixed(1)}%</span>
                        </div>
                    </div>

                    {/* Gold */}
                    <div className="bg-card border border-input rounded-md p-6 flex flex-col relative group overflow-hidden shadow-sm hover:border-foreground/30 hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openModal('gold', goldAmount, 'Gold Reserve', 'g')} className="text-[10px] font-bold tracking-widest text-foreground bg-muted border border-border px-3 py-1.5 rounded-sm hover:bg-muted/80 uppercase transition-colors">{t('ops.edit')}</button>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground tracking-wider mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-chart-1"></span> {t('ops.gold_reserve')}
                        </span>
                        <span className="text-3xl font-bold text-foreground tracking-tighter mt-1">{goldAmount.toLocaleString()} <span className="text-xl">g</span></span>
                        <div className="mt-4 flex justify-between items-end">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] text-muted-foreground opacity-60">{t('ops.est_value_krw')}</span>
                                <span className="text-xs font-medium text-foreground">₩{goldKrw.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                            <span className="text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded-sm">{((goldKrw / netWorth) * 100).toFixed(1)}%</span>
                        </div>
                    </div>

                    {/* Global Equities Card */}
                    <div className="bg-card border border-input rounded-md p-6 flex flex-col relative group overflow-hidden shadow-sm hover:border-foreground/30 hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setGlobalStockSheetOpen(true)} className="text-[10px] font-bold tracking-widest text-foreground bg-muted border border-border px-3 py-1.5 rounded-sm hover:bg-muted/80 uppercase transition-colors">{t('ops.add')}</button>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground tracking-wider mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-chart-4"></span> {t('ops.global_equities')}
                        </span>
                        <span className="text-3xl font-bold text-foreground tracking-tighter mt-1">
                            ₩{totalStockKrw.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                        <div className="mt-4 flex justify-between items-end">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] text-muted-foreground opacity-60">{t('ops.securities_total')}</span>
                                <span className="text-xs font-medium text-foreground">{stocks.length} {t('ops.symbols')}</span>
                            </div>
                            <span className="text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded-sm">
                                {((totalStockKrw / netWorth) * 100).toFixed(1)}%
                            </span>
                        </div>
                    </div>

                </div>
            </div>

            <div className="max-w-screen-xl mx-auto mt-10">
                <h3 className="text-xs font-bold tracking-widest text-muted-foreground mb-4 uppercase flex items-center gap-2">
                    <span className="w-4 h-px bg-primary/60 inline-block"></span>
                    {t('ops.intelligence_title')}
                </h3>
                {stocks.length === 0 ? (
                    <div className="bg-card border border-input border-dashed rounded-md p-8 flex flex-col items-center justify-center text-muted-foreground font-mono text-xs opacity-50">
                        {t('ops.no_equity_assets')}
                    </div>
                ) : (
                    <Accordion type="multiple" className="w-full space-y-3">
                        {Object.values(stocks.reduce((acc, stock) => {
                            const symbol = stock.assetSymbol!;
                            if (!acc[symbol]) {
                                acc[symbol] = {
                                    id: `group-${symbol}`,
                                    assetSymbol: symbol,
                                    amount: 0,
                                    avgPrice: 0,
                                    totalCost: 0,
                                    currency: stock.currency,
                                    entries: []
                                };
                            }
                            acc[symbol].amount += stock.amount;
                            acc[symbol].totalCost += stock.amount * (stock.avgPrice || 0);
                            acc[symbol].entries.push(...(stock.entries || []));
                            // Use first available currency as default
                            if (!acc[symbol].currency) acc[symbol].currency = stock.currency;
                            return acc;
                        }, {} as Record<string, any>)).map(stock => {
                            const symbol = stock.assetSymbol!;
                            const avgPrice = stock.amount > 0 ? stock.totalCost / stock.amount : 0;

                            const priceData = stockPrices[symbol];
                            const currentPrice = priceData ? priceData.price : avgPrice;
                            const currency = stock.currency || priceData?.currency || 'USD';

                            const valueOriginal = stock.amount * currentPrice;
                            const valueKrw = currency === 'KRW' ? valueOriginal : valueOriginal * rates.usdKrw;

                            const roi = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;
                            const isPositive = roi >= 0;

                            // Grayscale semantic colors
                            const roiColor = isPositive ? 'text-profit' : 'text-loss';

                            const entriesList = stock.entries || [];

                            return (
                                <AccordionItem key={stock.id} value={symbol} className="bg-card border border-border rounded-lg shadow-sm overflow-hidden transition-all hover:border-primary/30 hover:shadow-md">
                                    <AccordionTrigger className="hover:no-underline px-5 py-4" onClick={() => {
                                        if (!memosBySymbol[symbol]) {
                                            loadMemos(symbol);
                                        }
                                    }}>
                                        <div className="flex justify-between items-center w-full pr-3 text-left gap-4">
                                            {/* Left: Icon + Names */}
                                            <div className="flex items-center gap-3 min-w-0">
                                                <TickerIcon symbol={symbol} size={44} className="shrink-0" />
                                                <div className="flex flex-col gap-0.5 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-base font-bold text-foreground tracking-tight">{symbol}</span>
                                                        <span className="text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border shrink-0">
                                                            {stock.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {t('ops.shares')}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground/70 truncate max-w-[220px]">
                                                        {priceData?.shortName || 'Equity Asset'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Right: Value + ROI */}
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                {/* Primary: current value */}
                                                <span className="text-lg font-bold text-foreground tracking-tight">
                                                    {currency === 'KRW' ? '₩' : '$'}{valueOriginal.toLocaleString(undefined, { maximumFractionDigits: currency === 'KRW' ? 0 : 2 })}
                                                </span>
                                                {/* Secondary row: weight + avg + ROI */}
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-muted-foreground/60 font-mono hidden sm:inline">
                                                        avg {currency === 'KRW' ? '₩' : '$'}{avgPrice.toLocaleString(undefined, { maximumFractionDigits: currency === 'KRW' ? 0 : 2 })}
                                                    </span>
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${isPositive
                                                        ? 'text-profit bg-profit/10 border border-profit/20'
                                                        : 'text-loss bg-loss/10 border border-loss/20'
                                                        }`}>
                                                        {isPositive ? '+' : ''}{roi.toFixed(2)}%
                                                    </span>
                                                    <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border hidden md:inline">
                                                        {(totalStockKrw > 0 ? (valueKrw / totalStockKrw) * 100 : 0).toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="border-t border-border/40">
                                        <div className="flex flex-col">
                                            {/* Table header */}
                                            <div className="grid grid-cols-12 text-[11px] font-bold text-muted-foreground tracking-wide px-5 py-2.5 bg-muted/20">
                                                <div className="col-span-3">{t('ops.broker')}</div>
                                                <div className="col-span-3">{t('ops.owner')}</div>
                                                <div className="col-span-2 text-right">{t('ops.shares_col')}</div>
                                                <div className="col-span-2 text-right">{t('ops.avg_cost_col')}</div>
                                                <div className="col-span-2 text-right pr-16">{t('ops.total_cost_col')}</div>
                                            </div>

                                            {entriesList.length === 0 && (
                                                <div className="text-center py-6 text-muted-foreground text-xs font-mono opacity-50">
                                                    {t('ops.no_broker_accounts')}
                                                </div>
                                            )}

                                            {(() => {
                                                const grouped = entriesList.reduce((acc, entry) => {
                                                    const key = entry.predefinedAccountId || `${entry.broker}-${entry.owner}-${entry.account || 'default'}`;
                                                    if (!acc[key]) {
                                                        acc[key] = {
                                                            key,
                                                            broker: entry.broker,
                                                            owner: entry.owner,
                                                            account: entry.account,
                                                            predefinedAccountAlias: entry.predefinedAccountAlias,
                                                            currency: entry.currency,
                                                            totalQty: 0,
                                                            totalCost: 0,
                                                            entries: []
                                                        };
                                                    }
                                                    acc[key].totalQty += entry.qty;
                                                    acc[key].totalCost += entry.totalCost;
                                                    acc[key].entries.push(entry);
                                                    return acc;
                                                }, {} as Record<string, any>);

                                                return Object.values(grouped).map((group: any) => {
                                                    // For edit/delete on a grouped row, if there are multiple entries, we might need a different UX
                                                    // But to keep it flat and functional according to the requirement, we will use the ID of the first entry for editing/deleting,
                                                    // or ideally they should just add more and delete the whole grouping. 
                                                    // Given the user just wanted it flattened without txs, we can put the edit/delete right on the row 
                                                    // and have them operate on the primary/first entry, or disable if mixed.
                                                    // For now, we will map over them and just render them as single aggregated lines.
                                                    // If they added multiple, deleting one might be complex without the expanded view. 
                                                    // Wait, the user said "동일 계좌는 추가 입력해도 합상 되는건 유지하고".
                                                    // We can just render the grouped row with no edit/delete, or keep edit/delete for the group?
                                                    // The simplest is to pick the first entry's ID, but that only deletes that one entry.
                                                    // Let's just leave the edit/delete out of the aggregated row for now, or use the first entry.
                                                    // Let's use the first entry, as it's the most common case.
                                                    const primaryEntry = group.entries[0];

                                                    return (
                                                        <div key={group.key} className={`grid grid-cols-12 text-xs items-center px-5 py-3 border-b border-border/30 hover:bg-muted/20 transition-colors ${Object.values(grouped).indexOf(group) % 2 === 0 ? '' : 'bg-muted/5'
                                                            }`}>
                                                            <div className="col-span-3 flex items-center gap-2">
                                                                <Building2 size={12} className="text-muted-foreground font-bold" />
                                                                <span>{group.broker}</span>
                                                            </div>
                                                            <div className="col-span-3 flex items-center gap-2 text-muted-foreground">
                                                                <UserCircle2 size={12} />
                                                                <span className="truncate">
                                                                    {group.owner} {group.account ? `(${group.account})` : ''}
                                                                    {group.predefinedAccountAlias && (
                                                                        <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm border border-primary/20">
                                                                            {group.predefinedAccountAlias}
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div className="col-span-2 text-right font-medium">
                                                                {group.totalQty.toLocaleString()}
                                                            </div>
                                                            <div className="col-span-2 text-right text-muted-foreground">
                                                                {group.currency === 'KRW' ? '₩' : '$'}{group.totalQty > 0 ? (group.totalCost / group.totalQty).toLocaleString(undefined, { minimumFractionDigits: group.currency === 'KRW' ? 0 : 2, maximumFractionDigits: 2 }) : '0.00'}
                                                            </div>
                                                            <div className="col-span-2 flex justify-end items-center gap-3">
                                                                <span className="text-right text-foreground">{group.currency === 'KRW' ? '₩' : '$'}{group.totalCost.toLocaleString(undefined, { minimumFractionDigits: group.currency === 'KRW' ? 0 : 2, maximumFractionDigits: 2 })}</span>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setEditingEntryId(primaryEntry.id); }}
                                                                    className="text-blue-500 hover:text-blue-400 p-1 rounded-sm bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                                                                    title={group.entries.length > 1 ? "Edit primary entry" : "Edit Entry"}
                                                                >
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteEntry(primaryEntry.id, symbol); }}
                                                                    className="text-red-500 hover:text-red-400 p-1 rounded-sm bg-red-500/10 hover:bg-red-500/20 transition-colors"
                                                                    title={group.entries.length > 1 ? "Delete primary entry" : "Delete Entry"}
                                                                >
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                </button>
                                                            </div>

                                                            {editingEntryId === primaryEntry.id && (
                                                                <div className="col-span-12 mt-4 p-4 border border-input rounded-md bg-muted/20">
                                                                    <StockEntryForm
                                                                        symbol={symbol}
                                                                        initialData={{
                                                                            id: primaryEntry.id,
                                                                            broker: primaryEntry.broker,
                                                                            owner: primaryEntry.owner,
                                                                            account: primaryEntry.account,
                                                                            qty: primaryEntry.qty,
                                                                            totalCost: primaryEntry.totalCost,
                                                                            currency: primaryEntry.currency,
                                                                            predefinedAccountId: primaryEntry.predefinedAccountId
                                                                        }}
                                                                        onSuccess={() => setEditingEntryId(null)}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                });
                                            })()}

                                            <div className="mt-4 px-4 flex justify-end">
                                                <Sheet>
                                                    <SheetTrigger asChild>
                                                        <button className="text-xs font-bold tracking-widest text-primary bg-primary/5 border border-primary/20 px-4 py-2 rounded-sm hover:bg-primary/20 uppercase transition-colors flex items-center gap-2">
                                                            <Plus size={14} /> {t('ops.add_account_for')} {symbol}
                                                        </button>
                                                    </SheetTrigger>
                                                    <SheetContent className="sm:max-w-md border-l border-primary/20 flex flex-col overflow-y-auto pr-6">
                                                        <SheetHeader className="mb-8 text-left">
                                                            <SheetTitle className="text-2xl font-black tracking-tighter uppercase text-primary flex items-center gap-2">
                                                                <span className="h-5 w-1.5 bg-primary animate-pulse"></span>
                                                                {t('ops.add_entry')}
                                                            </SheetTitle>
                                                            <SheetDescription className="font-mono text-xs mt-2 uppercase tracking-widest">
                                                                {t('ops.add_entry_desc')} {symbol}.
                                                            </SheetDescription>
                                                        </SheetHeader>

                                                        <div className="w-full pb-8">
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

                                            {/* Asset Memos Section */}
                                            <div className="mt-8 px-4">
                                                <h4 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase flex items-center gap-2 mb-4 border-b border-border/50 pb-2">
                                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> {t('ops.asset_intelligence') || 'Asset Intelligence'}
                                                </h4>

                                                <div className="bg-muted/10 border border-input rounded-md p-4 mb-4">
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder={t('ops.write_memo_placeholder') || `Record insights or reasons for holding ${symbol}...`}
                                                            value={newMemoContent[symbol] || ''}
                                                            onChange={e => setNewMemoContent(prev => ({ ...prev, [symbol]: e.target.value }))}
                                                            disabled={isSubmittingMemo[symbol]}
                                                            className="flex-1 bg-background border border-input rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter' && !isSubmittingMemo[symbol]) handleAddMemo(symbol);
                                                            }}
                                                        />
                                                        <button
                                                            onClick={() => handleAddMemo(symbol)}
                                                            disabled={!newMemoContent[symbol]?.trim() || isSubmittingMemo[symbol]}
                                                            className="bg-primary/20 text-primary border border-primary/50 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider hover:bg-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                                        >
                                                            {isSubmittingMemo[symbol] ? 'Saving...' : (t('ops.save_memo') || 'Save')}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    {(() => {
                                                        const memos = memosBySymbol[symbol];
                                                        if (memos === undefined) return <div className="text-center py-4 text-xs text-muted-foreground animate-pulse">Loading memos...</div>;
                                                        if (memos.length === 0) return <div className="text-center py-4 text-xs text-muted-foreground opacity-50 italic">No memos recorded for this asset yet.</div>;

                                                        // Group memos that are within 2 seconds of each other
                                                        const groupedMemos: any[][] = [];
                                                        let currentGroup: any[] = [];

                                                        memos.forEach((memo, index) => {
                                                            if (currentGroup.length === 0) {
                                                                currentGroup.push(memo);
                                                            } else {
                                                                const lastMemo = currentGroup[currentGroup.length - 1];
                                                                const diff = Math.abs(new Date(lastMemo.createdAt).getTime() - new Date(memo.createdAt).getTime());
                                                                // 2 seconds window
                                                                if (diff <= 2000) {
                                                                    currentGroup.push(memo);
                                                                } else {
                                                                    groupedMemos.push([...currentGroup]);
                                                                    currentGroup = [memo];
                                                                }
                                                            }
                                                            if (index === memos.length - 1) {
                                                                groupedMemos.push(currentGroup);
                                                            }
                                                        });

                                                        return groupedMemos.map((group, groupIdx) => {
                                                            const isSystemMemo = (m: any) => m.content.startsWith('[SYSTEM]');

                                                            // If group has only 1 memo
                                                            if (group.length === 1) {
                                                                const memo = group[0];
                                                                const isSys = isSystemMemo(memo);
                                                                return (
                                                                    <div key={memo.id} className={`bg-background border ${isSys ? 'border-border/30 opacity-70 border-dashed bg-muted/5' : 'border-border/50'} rounded-sm p-3 hover:border-border transition-colors group relative`}>
                                                                        <button
                                                                            onClick={() => handleDeleteMemo(symbol, memo.id)}
                                                                            className="absolute top-2 right-2 text-muted-foreground/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all bg-background/80 p-1.5 rounded-sm"
                                                                            title="Delete memo"
                                                                        >
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                        <div className={`text-xs ${isSys ? 'text-muted-foreground font-mono' : 'text-foreground/90'} whitespace-pre-wrap leading-relaxed pr-6`}>
                                                                            {isSys ? memo.content.replace('[SYSTEM]', '⚙️ ') : memo.content}
                                                                        </div>
                                                                        <div className="text-[10px] text-muted-foreground mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                                            {format(new Date(memo.createdAt), 'yyyy-MM-dd HH:mm')}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }

                                                            // Linked Group
                                                            // We display user memo first, then system memos connected to it
                                                            const systemMemos = group.filter(isSystemMemo);
                                                            const userMemos = group.filter(m => !isSystemMemo(m));

                                                            // Linked Group
                                                            return (
                                                                <div key={`group-${groupIdx}`} className="relative flex flex-col gap-2">
                                                                    {userMemos.map(memo => (
                                                                        <div key={memo.id} className="relative z-10 bg-background border border-border/50 rounded-sm p-3 hover:border-border transition-colors group/user shadow-sm">
                                                                            <button
                                                                                onClick={() => handleDeleteMemo(symbol, memo.id)}
                                                                                className="absolute top-2 right-2 text-muted-foreground/30 hover:text-destructive opacity-0 group-hover/user:opacity-100 transition-all p-1.5 rounded-sm bg-background/80"
                                                                                title="Delete user memo"
                                                                            >
                                                                                <Trash2 size={12} />
                                                                            </button>
                                                                            <div className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed pr-6">{memo.content}</div>
                                                                            <div className="text-[10px] text-muted-foreground mt-2 opacity-60 group-hover/user:opacity-100 transition-opacity">
                                                                                {format(new Date(memo.createdAt), 'yyyy-MM-dd HH:mm')}
                                                                            </div>
                                                                        </div>
                                                                    ))}

                                                                    {systemMemos.map((memo, idx) => (
                                                                        <div key={memo.id} className="relative flex pl-6">
                                                                            {/* Smooth curve connector from user memo to system memo */}
                                                                            {userMemos.length > 0 && (
                                                                                <div className="absolute left-[15px] top-[-8px] bottom-1/2 w-[9px] border-l-2 border-b-2 border-muted-foreground/20 rounded-bl-xl pointer-events-none z-0"></div>
                                                                            )}

                                                                            <div className="relative z-10 w-full bg-muted/10 border border-muted-foreground/10 rounded-sm p-3 hover:border-muted-foreground/30 transition-colors group/sys shadow-sm flex items-start gap-2">
                                                                                <span className="text-xs text-muted-foreground/40 mt-[1px]">↳</span>
                                                                                <div className="flex-1">
                                                                                    <div className="text-xs text-muted-foreground/80 font-medium pr-6 leading-relaxed">
                                                                                        {memo.content.replace('[SYSTEM]', '').trim()}
                                                                                    </div>
                                                                                    {userMemos.length === 0 && (
                                                                                        <div className="text-[10px] text-muted-foreground mt-2 opacity-50 group-hover/sys:opacity-100 transition-opacity">
                                                                                            {format(new Date(memo.createdAt), 'yyyy-MM-dd HH:mm')}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                </div>
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
            {
                editingEntryId && (() => {
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
                            <SheetContent className="sm:max-w-md border-l border-primary/20 flex flex-col overflow-y-auto pr-6">
                                <SheetHeader className="mb-8 text-left">
                                    <SheetTitle className="text-2xl font-black tracking-tighter uppercase text-primary flex items-center gap-2">
                                        <span className="h-5 w-1.5 bg-primary animate-pulse"></span>
                                        {t('ops.edit_entry_title')} - {foundEntryContext.symbol}
                                    </SheetTitle>
                                    <SheetDescription className="font-mono text-xs mt-2 uppercase tracking-widest">
                                        {t('ops.edit_entry_desc')}
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="w-full pb-8">
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
                })()
            }

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
                    <SheetHeader className="mb-8 text-left">
                        <SheetTitle className="text-2xl font-black tracking-tighter uppercase text-primary flex items-center gap-2">
                            <span className="h-5 w-1.5 bg-primary animate-pulse"></span>
                            {t('ops.unified_stock_entry')}
                        </SheetTitle>
                        <SheetDescription className="font-mono text-xs mt-2 uppercase tracking-widest">
                            {t('ops.unified_stock_entry_desc')}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="w-full pb-8">
                        <StockEntryForm
                            onSuccess={() => {
                                setGlobalStockSheetOpen(false);
                                window.location.reload();
                            }}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </div >
    );
}
