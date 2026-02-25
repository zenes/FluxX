"use client";

import { useState, useEffect } from "react";
import { Coins, TrendingUp, Calendar, ArrowUpRight, Wallet, Info, Search, Plus, History, ChevronLeft, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import DividendRecordForm from "@/components/DividendRecordForm";
import { DividendHistory } from "@/components/DividendHistory";
import { getDividendRecords } from "@/lib/actions";
import MonthlyDividendChart from "@/components/MonthlyDividendChart";
import MonthlyDividendCalendar from "@/components/MonthlyDividendCalendar";

export default function ClientDividends({ assets }: { assets: any[] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [dividendRecords, setDividendRecords] = useState<any[]>([]);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
    const [activeCurrency, setActiveCurrency] = useState<string>("USD");
    const [sheetMode, setSheetMode] = useState<'record' | 'history'>('record');

    // Monthly Calendar Sheet state
    const [isCalendarSheetOpen, setIsCalendarSheetOpen] = useState(false);
    const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);
    const [selectedMonthName, setSelectedMonthName] = useState<string>("");

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
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        name: monthNames[i],
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
        { title: "Annual total (est.)", prefix: "₩", value: Math.round(totalAnnualEstKRW).toLocaleString(), change: "+12.5%", icon: TrendingUp, color: "text-primary" },
        { title: `Actual (${selectedYear} ytd)`, prefix: "₩", value: Math.round(actualThisYearKRW).toLocaleString(), detail: `${selectedYear} payouts`, icon: Wallet, color: "text-accent" },
        { title: "Monthly average", prefix: "₩", value: Math.round(totalAnnualEstKRW / 12).toLocaleString(), detail: "Projected avg", icon: Calendar, color: "text-muted-foreground" },
        { title: "Total records", value: dividendRecords.length.toString(), detail: "Receipts logged", icon: ArrowUpRight, color: "text-profit" },
    ];

    const handleYearChange = (delta: number) => {
        setSelectedYear(prev => prev + delta);
    };

    const handleOpenSheet = (symbol: string, currency: string, mode: 'record' | 'history' = 'record') => {
        setActiveSymbol(symbol);
        setActiveCurrency(currency);
        setSheetMode(mode);
        setIsSheetOpen(true);
    };

    const handleMonthClick = (index: number, name: string) => {
        setSelectedMonthIndex(index);
        setSelectedMonthName(name);
        setIsCalendarSheetOpen(true);
    };

    return (
        <div className="flex flex-col h-full bg-background p-4 md:p-8">
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
                        <span className="h-6 w-1 bg-primary"></span>
                        dividend
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1 opacity-60">
                        passive yield monitoring and automated cash flow projection.
                    </p>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <input
                        type="text"
                        placeholder="SEARCH TICKER..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-muted/20 border border-input rounded-sm py-2 pl-9 pr-4 text-[10px] font-bold tracking-wider focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                    />
                </div>
            </div>

            {/* Metrics Overview */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-8">
                {metrics.map((m, i) => (
                    <div key={i} className="bg-card border border-input rounded-md p-5 shadow-sm relative overflow-hidden group hover:border-primary/50 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-bold tracking-wider text-muted-foreground">{m.title}</span>
                            <m.icon size={16} className={`${m.color} opacity-70`} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-3xl md:text-5xl font-bold tracking-tighter text-foreground">
                                {m.prefix && (
                                    <span className="text-xl md:text-2xl font-medium text-muted-foreground/50 mr-1">{m.prefix}</span>
                                )}
                                {m.value}
                            </span>
                            <div className="flex items-center gap-1.5 mt-1">
                                {m.change && i === 0 ? (
                                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm">
                                        {m.change}
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-muted-foreground tracking-wider opacity-60">
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
                        <h3 className="text-sm font-bold tracking-widest text-foreground">Monthly payouts</h3>
                        <p className="text-[10px] text-muted-foreground tracking-wider mt-1 opacity-60">Aggregation for {selectedYear}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleYearChange(-1)}
                            className="p-1.5 hover:bg-muted rounded-df border border-input transition-colors group"
                            title="Previous Year"
                        >
                            <ChevronLeft size={16} className="text-muted-foreground group-hover:text-foreground" />
                        </button>
                        <span className="text-xs font-bold min-w-[3rem] text-center bg-muted/30 px-3 py-1 rounded-sm border border-input">
                            {selectedYear}
                        </span>
                        <button
                            onClick={() => handleYearChange(1)}
                            className="p-1.5 hover:bg-muted rounded-df border border-input transition-colors group"
                            title="Next Year"
                        >
                            <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground" />
                        </button>
                    </div>
                </div>
                <MonthlyDividendChart
                    data={monthlyData}
                    onMonthClick={handleMonthClick}
                />
            </div>

            {/* Live Stock List */}
            <div className="flex-1 rounded-md border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b bg-muted/10 flex justify-between items-center">
                    <h3 className="text-xs font-bold tracking-wider flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                        Active equity holdings
                    </h3>
                    <span className="text-[10px] text-muted-foreground tracking-wider opacity-60">{filteredStocks.length} assets logged</span>
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
                                                <span className="text-sm font-bold text-primary tracking-tight group-hover:text-foreground transition-colors">{stock.assetSymbol}</span>
                                            </td>
                                            <td className="px-6 py-4 align-middle text-right font-mono text-xs font-bold">
                                                {stock.amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 align-middle text-right font-mono text-xs font-bold">
                                                {currency === 'KRW' ? '₩' : '$'}{annual.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 align-middle text-right font-mono text-[10px]">
                                                {recordsForYear.length > 0 ? (
                                                    <button
                                                        onClick={() => handleOpenSheet(stock.assetSymbol!, currency, 'history')}
                                                        className="text-profit hover:opacity-80 hover:underline transition-colors font-bold"
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
                                className="w-full mt-8 py-3 bg-primary/10 text-primary hover:bg-primary/20 rounded-sm text-[10px] font-bold tracking-[0.2em] uppercase border border-primary/20 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={12} /> Add New Record
                            </button>
                        )}
                        {sheetMode === 'record' && (
                            <button
                                onClick={() => setSheetMode('history')}
                                className="w-full mt-6 py-2 text-muted-foreground hover:text-foreground text-[8px] font-bold tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2"
                            >
                                <History size={10} /> Back to History
                            </button>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Monthly Calendar Sheet */}
            <Sheet open={isCalendarSheetOpen} onOpenChange={setIsCalendarSheetOpen}>
                <SheetContent className="w-full sm:max-w-xl bg-background border-l border-primary/20 pt-12 overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="text-xl font-black tracking-tighter uppercase mb-4 flex items-center gap-2">
                            <Calendar className="text-primary" size={20} />
                            {selectedYear} {selectedMonthName} Dividend Report
                        </SheetTitle>
                    </SheetHeader>

                    {selectedMonthIndex !== null && (
                        <div className="mt-8">
                            <MonthlyDividendCalendar
                                year={selectedYear}
                                monthIndex={selectedMonthIndex}
                                records={dividendRecords.filter(r => {
                                    const d = new Date(r.receivedAt);
                                    return d.getFullYear() === selectedYear && d.getMonth() === selectedMonthIndex;
                                })}
                            />
                        </div>
                    )}
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
