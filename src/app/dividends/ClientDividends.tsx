"use client";

import { useState, useEffect } from "react";
import { Coins, TrendingUp, Calendar, ArrowUpRight, Wallet, Info, Search, Plus, History } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import DividendRecordForm from "@/components/DividendRecordForm";
import { DividendHistory } from "@/components/DividendHistory";
import { getDividendRecords } from "@/lib/actions";
import MonthlyDividendChart from "@/components/MonthlyDividendChart";

export default function ClientDividends({ assets }: { assets: any[] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [dividendRecords, setDividendRecords] = useState<any[]>([]);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
    const [activeCurrency, setActiveCurrency] = useState<string>("USD");
    const [sheetMode, setSheetMode] = useState<'record' | 'history'>('record');

    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);

    useEffect(() => {
        async function fetchRecords() {
            const data = await getDividendRecords();
            setDividendRecords(data);
        }
        fetchRecords();
    }, []);

    // Filter only stock assets
    const stocks = assets.filter(a => a.assetType === 'stock' && a.assetSymbol);

    const filteredStocks = stocks.filter(s =>
        s.assetSymbol?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate Projections
    let totalAnnualEstKRW = 0;
    const KRW_USD_RATE = 1350; // Heuristic for now, ideally fetch real rate

    filteredStocks.forEach(stock => {
        if (stock.entries) {
            stock.entries.forEach((entry: any) => {
                const dps = entry.dividendPerShare || 0;
                const freq = entry.dividendFrequency || 1;
                const qty = entry.qty || 0;
                const annual = dps * freq * qty;

                if (entry.currency === "KRW") {
                    totalAnnualEstKRW += annual;
                } else {
                    totalAnnualEstKRW += (annual * KRW_USD_RATE);
                }
            });
        }
    });

    // Extract available years from records, ensuring selectedYear is at least included
    const availableYearsSet = new Set<number>();
    dividendRecords.forEach(r => availableYearsSet.add(new Date(r.receivedAt).getFullYear()));
    availableYearsSet.add(currentYear); // default safe pick
    const availableYears = Array.from(availableYearsSet).sort((a, b) => b - a);

    // Calculate actual received for the SECLECTED year & monthly aggregation
    // Initialize 12 months data
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        name: `${i + 1}월`,
        amount: 0
    }));

    let actualThisYearKRW = 0;

    dividendRecords.forEach(r => {
        const recordDate = new Date(r.receivedAt);
        if (recordDate.getFullYear() === selectedYear) {
            const val = r.amount || 0;
            const krwVal = r.currency === "KRW" ? val : val * KRW_USD_RATE;

            actualThisYearKRW += krwVal;

            // Add to monthly bucket (0-indexed month)
            const monthIndex = recordDate.getMonth();
            monthlyData[monthIndex].amount += krwVal;
        }
    });

    const metrics = [
        { title: "Annual Total (Est.)", value: `₩${Math.round(totalAnnualEstKRW).toLocaleString()}`, change: "+12.5%", icon: TrendingUp, color: "text-primary" },
        { title: `ACTUAL (${selectedYear} YTD)`, value: `₩${Math.round(actualThisYearKRW).toLocaleString()}`, detail: `${selectedYear} Payouts`, icon: Wallet, color: "text-accent" },
        { title: "Monthly Average", value: `₩${Math.round(totalAnnualEstKRW / 12).toLocaleString()}`, detail: "Projected Avg", icon: Calendar, color: "text-purple-500" },
        { title: "Total Records", value: dividendRecords.length.toString(), detail: "Receipts Logged", icon: ArrowUpRight, color: "text-emerald-500" },
    ];

    const handleOpenSheet = (symbol: string, currency: string, mode: 'record' | 'history' = 'record') => {
        setActiveSymbol(symbol);
        setActiveCurrency(currency);
        setSheetMode(mode);
        setIsSheetOpen(true);
    };

    return (
        <div className="flex flex-col h-full bg-background p-4 md:p-8">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase text-foreground flex items-center gap-3">
                        <span className="h-8 w-2 bg-primary animate-pulse"></span>
                        Dividend Intelligence
                    </h1>
                    <p className="text-sm text-muted-foreground mt-2 font-mono uppercase tracking-widest flex items-center gap-3">
                        Passive yield monitoring and automated cash flow projection.
                        <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-sm text-xs font-bold border border-primary/30 ml-2">
                            YEAR:
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="bg-transparent border-none appearance-none font-bold text-primary focus:outline-none focus:ring-0 ml-1 cursor-pointer"
                            >
                                {availableYears.map(year => (
                                    <option key={year} value={year} className="bg-background text-foreground">{year}</option>
                                ))}
                            </select>
                        </span>
                    </p>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <input
                        type="text"
                        placeholder="SEARCH TICKER..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-muted/20 border border-input rounded-sm py-2 pl-9 pr-4 text-[10px] font-bold tracking-widest focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all uppercase"
                    />
                </div>
            </div>

            {/* Metrics Overview */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-8">
                {metrics.map((m, i) => (
                    <div key={i} className="bg-card border border-input rounded-md p-5 shadow-sm relative overflow-hidden group hover:border-primary/50 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{m.title}</span>
                            <m.icon size={16} className={`${m.color} opacity-70`} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-black tracking-tighter text-foreground">{m.value}</span>
                            <div className="flex items-center gap-1.5 mt-1">
                                {m.change && i === 0 ? (
                                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm">
                                        {m.change}
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">
                                        {m.detail}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                    </div>
                ))}
            </div>

            {/* Monthly Dividend Chart */}
            <div className="mb-8 p-5 bg-card border border-input rounded-md shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-black tracking-widest text-foreground uppercase">Monthly Payouts</h3>
                        <p className="text-[10px] text-muted-foreground uppercase font-mono mt-1">Aggregation for {selectedYear}</p>
                    </div>
                </div>
                <MonthlyDividendChart data={monthlyData} />
            </div>

            {/* Live Stock List */}
            <div className="flex-1 rounded-md border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col font-mono">
                <div className="p-4 border-b bg-muted/10 flex justify-between items-center">
                    <h3 className="text-xs font-bold tracking-[0.2em] uppercase flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                        Active Equity Holdings
                    </h3>
                    <span className="text-[10px] font-mono text-muted-foreground">{filteredStocks.length} ASSETS LOGGED</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/5 transition-colors hover:bg-muted/50">
                                <th className="h-10 px-6 text-left align-middle font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Symbol</th>
                                <th className="h-10 px-6 text-right align-middle font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Quantity</th>
                                <th className="h-10 px-6 text-right align-middle font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Est. Annual</th>
                                <th className="h-10 px-6 text-right align-middle font-bold text-muted-foreground uppercase text-[10px] tracking-widest">History</th>
                                <th className="h-10 px-6 text-center align-middle font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStocks.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-muted-foreground font-mono text-xs uppercase opacity-50">
                                        No matching stock assets detected in the perimeter.
                                    </td>
                                </tr>
                            ) : (
                                filteredStocks.map((stock) => {
                                    const annual = stock.entries?.reduce((sum: number, e: any) => sum + (e.dividendPerShare || 0) * (e.dividendFrequency || 1) * (e.qty || 0), 0) || 0;
                                    const records = dividendRecords.filter(r => r.tickerSymbol === stock.assetSymbol);
                                    const recordsForYear = records.filter(r => new Date(r.receivedAt).getFullYear() === selectedYear);
                                    const currency = stock.currency || 'USD';

                                    return (
                                        <tr key={stock.id} className="border-b last:border-0 transition-colors hover:bg-muted/20 group">
                                            <td className="px-6 py-4 align-middle">
                                                <span className="text-sm font-black text-primary tracking-tight group-hover:text-foreground transition-colors">{stock.assetSymbol}</span>
                                            </td>
                                            <td className="px-6 py-4 align-middle text-right font-mono text-xs font-bold">
                                                {stock.amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 align-middle text-right font-mono text-xs text-yellow-500 font-bold">
                                                {currency === 'KRW' ? '₩' : '$'}{annual.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 align-middle text-right font-mono text-[10px]">
                                                {recordsForYear.length > 0 ? (
                                                    <button
                                                        onClick={() => handleOpenSheet(stock.assetSymbol!, currency, 'history')}
                                                        className="text-emerald-500 hover:text-emerald-400 hover:underline transition-colors font-bold"
                                                    >
                                                        {recordsForYear.length} Paid in {selectedYear}
                                                    </button>
                                                ) : (
                                                    <span className="opacity-30">No Data</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 align-middle text-center">
                                                <button
                                                    onClick={() => handleOpenSheet(stock.assetSymbol!, currency, 'record')}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded-sm text-[10px] font-bold tracking-widest transition-all uppercase border border-primary/20"
                                                >
                                                    <Plus size={10} /> Record
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="w-full sm:max-w-md bg-background border-l border-primary/20 pt-12">
                    <SheetHeader>
                        <SheetTitle className="text-xl font-black tracking-tighter uppercase mb-4 flex items-center gap-2">
                            {sheetMode === 'record' ? <Plus size={20} className="text-primary" /> : <History size={20} className="text-primary" />}
                            {sheetMode === 'record' ? 'Dividend Receipt Entry' : `${activeSymbol} Payment History`}
                        </SheetTitle>
                    </SheetHeader>

                    <div className="mt-8">
                        {sheetMode === 'record' && activeSymbol ? (
                            <DividendRecordForm
                                tickerSymbol={activeSymbol}
                                currency={activeCurrency}
                                onSuccess={() => {
                                    setIsSheetOpen(false);
                                    getDividendRecords().then(setDividendRecords);
                                }}
                            />
                        ) : activeSymbol && (
                            <DividendHistory
                                tickerSymbol={activeSymbol}
                                records={dividendRecords.filter(r =>
                                    r.tickerSymbol === activeSymbol &&
                                    new Date(r.receivedAt).getFullYear() === selectedYear
                                )}
                            />
                        )}

                        {sheetMode === 'history' && (
                            <button
                                onClick={() => setSheetMode('record')}
                                className="w-full mt-8 py-3 bg-primary/10 text-primary hover:bg-primary/20 rounded-sm text-[10px] font-black tracking-[0.2em] uppercase border border-primary/20 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={12} /> Add New Record
                            </button>
                        )}
                        {sheetMode === 'record' && (
                            <button
                                onClick={() => setSheetMode('history')}
                                className="w-full mt-6 py-2 text-muted-foreground hover:text-foreground text-[8px] font-black tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2"
                            >
                                <History size={10} /> Back to History
                            </button>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            <div className="mt-6 flex items-center gap-2 p-3 rounded-md bg-primary/5 border border-primary/10">
                <Info size={14} className="text-primary shrink-0" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-relaxed">
                    Note: Dividend yield data is being cross-referenced with your holdings. Manual records are prioritized for YTD calculations.
                </p>
            </div>
        </div>
    );
}
