'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import AssetModal from '@/components/AssetModal';
import StockModal from '@/components/StockModal';
import { AssetItem } from '@/lib/actions';

const COLORS = ['#eab308', '#22c55e', '#3b82f6']; // Gold, USD, KRW

export default function ClientOperations({ assets }: { assets: AssetItem[] }) {
    const [modalState, setModalState] = useState<{ isOpen: boolean, type: string, amount: number, label: string, unit: string }>({
        isOpen: false,
        type: '',
        amount: 0,
        label: '',
        unit: ''
    });

    const [stockModalOpen, setStockModalOpen] = useState(false);
    const [stockPrices, setStockPrices] = useState<Record<string, { price: number, change: number, changePercent: number, shortName: string }>>({});

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
        const valueUsd = stock.amount * currentPrice;
        totalStockKrw += valueUsd * rates.usdKrw;
    });

    const netWorth = goldKrw + usdKrw + krwAmount + totalStockKrw;

    const chartData = [
        { name: 'Gold Reserve', value: goldKrw, color: '#eab308' },
        { name: 'Foreign Currency', value: usdKrw, color: '#22c55e' },
        { name: 'Local Currency', value: krwAmount, color: '#3b82f6' },
        { name: 'US Equities', value: totalStockKrw, color: '#8b5cf6' },
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
                        onClick={() => setStockModalOpen(true)}
                        className="text-xs font-bold tracking-widest text-primary bg-primary/10 border border-primary/20 px-4 py-2 rounded-sm hover:bg-primary/20 uppercase transition-colors flex items-center gap-2"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Add US Stock
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
                            <span className="text-yellow-500 font-bold">{loadingRates ? '---' : `$${rates.goldUsd.toLocaleString()}`}</span>
                        </div>
                        <div className="ml-auto flex items-end">
                            <span className="text-muted-foreground opacity-50 flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-green-500"></span> SECURE SYNC
                            </span>
                        </div>
                    </div>
                </div>

                {/* Visual Chart Card */}
                <div className="bg-card border border-input shadow-lg rounded-lg p-6 flex flex-col items-center justify-center min-h-[300px]">
                    <h3 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground w-full text-center uppercase mb-2">Asset Distribution</h3>
                    {chartData.length > 0 ? (
                        <div className="w-full h-full flex-1 min-h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={95}
                                        paddingAngle={3}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        formatter={(value: any) => `₩${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '6px', fontFamily: 'monospace', fontSize: '12px' }}
                                        itemStyle={{ color: '#f8fafc' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="text-xs font-mono tracking-widest text-muted-foreground opacity-50 flex flex-col items-center justify-center h-full gap-2">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4M12 20V4" /></svg>
                            NO ASSET DATA
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-screen-xl mx-auto">
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground mb-4">Classified Asset Inventory</h3>
                <div className="grid gap-4 md:grid-cols-3">

                    {/* KRW */}
                    <div className="bg-card border border-input rounded-md p-6 flex flex-col relative group overflow-hidden shadow-sm hover:border-blue-500/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openModal('krw', krwAmount, 'Local Currency', 'KRW')} className="text-[10px] font-bold tracking-widest text-blue-500 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-sm hover:bg-blue-500/20 uppercase transition-colors">EDIT</button>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Local Currency
                        </span>
                        <span className="text-3xl font-black text-blue-500 tracking-tight mt-1">₩{krwAmount.toLocaleString()}</span>
                        <span className="text-[10px] font-mono text-muted-foreground mt-4 opacity-70">LIQUIDITY RESERVE</span>
                    </div>

                    {/* USD */}
                    <div className="bg-card border border-input rounded-md p-6 flex flex-col relative group overflow-hidden shadow-sm hover:border-green-500/30 hover:shadow-[0_0_15px_rgba(34,197,94,0.1)] transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openModal('usd', usdAmount, 'Foreign Currency', 'USD')} className="text-[10px] font-bold tracking-widest text-green-500 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-sm hover:bg-green-500/20 uppercase transition-colors">EDIT</button>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Foreign Currency
                        </span>
                        <span className="text-3xl font-black text-green-500 tracking-tight mt-1">${usdAmount.toLocaleString()}</span>
                        <div className="mt-4 flex flex-col gap-0.5">
                            <span className="text-[10px] font-mono text-muted-foreground opacity-70">EST VALUE (KRW)</span>
                            <span className="text-xs font-mono font-medium text-foreground">₩{usdKrw.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                    </div>

                    {/* Gold */}
                    <div className="bg-card border border-input rounded-md p-6 flex flex-col relative group overflow-hidden shadow-sm hover:border-yellow-500/30 hover:shadow-[0_0_15px_rgba(234,179,8,0.1)] transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openModal('gold', goldAmount, 'Gold Reserve', 'g')} className="text-[10px] font-bold tracking-widest text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-sm hover:bg-yellow-500/20 uppercase transition-colors">EDIT</button>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span> Gold Reserve
                        </span>
                        <span className="text-3xl font-black text-yellow-500 tracking-tight mt-1">{goldAmount.toLocaleString()} <span className="text-xl">g</span></span>
                        <div className="mt-4 flex flex-col gap-0.5">
                            <span className="text-[10px] font-mono text-muted-foreground opacity-70">EST VALUE (KRW)</span>
                            <span className="text-xs font-mono font-medium text-foreground">₩{goldKrw.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                    </div>

                </div>
            </div>

            <div className="max-w-screen-xl mx-auto mt-10">
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground mb-4">US Equities Intelligence</h3>
                {stocks.length === 0 ? (
                    <div className="bg-card border border-input border-dashed rounded-md p-8 flex flex-col items-center justify-center text-muted-foreground font-mono text-xs opacity-50">
                        NO EQUITY ASSETS REGISTERED
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {stocks.map(stock => {
                            const symbol = stock.assetSymbol!;
                            const priceData = stockPrices[symbol];
                            const currentPrice = priceData ? priceData.price : (stock.avgPrice || 0);
                            const avgPrice = stock.avgPrice || 0;
                            const roi = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;
                            const isPositive = roi >= 0;

                            // Asian standard: Red up, Blue down
                            const roiColor = isPositive ? 'text-red-500' : 'text-blue-500';

                            const valueUsd = stock.amount * currentPrice;
                            const valueKrw = valueUsd * rates.usdKrw;

                            return (
                                <div key={stock.id} className="bg-card border border-input rounded-md p-6 flex flex-col shadow-sm hover:border-purple-500/30 hover:shadow-[0_0_15px_rgba(139,92,246,0.1)] transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-col">
                                            <span className="text-xl font-black text-purple-500 tracking-tight">{symbol}</span>
                                            <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{priceData?.shortName || 'US Equity'}</span>
                                        </div>
                                        <div className={`flex flex-col items-end ${roiColor}`}>
                                            <span className="text-sm font-bold">{isPositive ? '+' : ''}{roi.toFixed(2)}%</span>
                                            <span className="text-[10px] opacity-70">ROI</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-4 border-b border-border/50 pb-4 text-foreground/80">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-muted-foreground opacity-70">SHARES</span>
                                            <span>{stock.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] text-muted-foreground opacity-70">AVG / CURR</span>
                                            <span>${avgPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })} / ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end mt-auto">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-mono text-muted-foreground opacity-70">EST VALUE (KRW)</span>
                                            <span className="text-sm font-mono font-medium text-foreground">₩{valueKrw.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                        </div>
                                        <span className="text-lg font-black text-purple-400 tracking-tight">
                                            ${valueUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <AssetModal
                isOpen={modalState.isOpen}
                onClose={() => {
                    setModalState(s => ({ ...s, isOpen: false }));
                }}
                assetType={modalState.type}
                currentAmount={modalState.amount}
                label={modalState.label}
                unit={modalState.unit}
            />

            <StockModal
                isOpen={stockModalOpen}
                onClose={() => setStockModalOpen(false)}
            />
        </div>
    );
}
