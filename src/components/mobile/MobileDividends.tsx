'use client';

import { useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ViewModeToggle } from '@/components/mobile/MobileLayout';
import { TrendingUp, Calendar, DollarSign, BarChart3, Plus } from 'lucide-react';
import { getDividendRecords, addDividendRecord } from '@/lib/actions';
import MonthlyDividendChart from '@/components/MonthlyDividendChart';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import DividendRecordForm from '@/components/DividendRecordForm';

export default function MobileDividends({ assets }: { assets: any }) {
    const { t } = useLanguage();
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [records, setRecords] = useState<any[]>([]);
    const [isLoadingRecords, setIsLoadingRecords] = useState(true);
    const [sheetState, setSheetState] = useState<{ open: boolean; symbol?: string; currency?: string; mode?: string }>({ open: false });

    const stockAssets = useMemo(() => assets?.filter((a: any) => a.type === 'STOCK') || [], [assets]);

    // Unique symbols
    const symbols = useMemo(() => {
        const set = new Set<string>();
        stockAssets.forEach((a: any) => { if (a.tickerSymbol) set.add(a.tickerSymbol); });
        return Array.from(set);
    }, [stockAssets]);

    // Fetch records
    useState(() => {
        getDividendRecords().then((r: any) => { setRecords(r || []); setIsLoadingRecords(false); }).catch(() => setIsLoadingRecords(false));
    });

    const recordsForYear = useMemo(() =>
        records.filter(r => new Date(r.payDate).getFullYear() === selectedYear),
        [records, selectedYear]
    );

    const totalDividend = useMemo(() =>
        recordsForYear.reduce((s, r) => s + r.amount, 0),
        [recordsForYear]
    );

    const projectedAnnual = useMemo(() => {
        const currentMonth = new Date().getMonth() + 1;
        if (currentMonth === 0) return 0;
        return (totalDividend / currentMonth) * 12;
    }, [totalDividend]);

    const handleOpenSheet = (symbol: string, currency: string, mode: string) => {
        setSheetState({ open: true, symbol, currency, mode });
    };

    return (
        <div className="px-4 py-5 space-y-4">
            <h1 className="text-xl font-black tracking-tight">{t('divs.title')}</h1>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="size-4 text-green-500" />
                        <span className="text-[9px] font-bold text-muted-foreground tracking-wider uppercase">{t('divs.total_received')}</span>
                    </div>
                    <p className="text-xl font-bold tracking-tight">${totalDividend.toLocaleString()}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="size-4 text-blue-500" />
                        <span className="text-[9px] font-bold text-muted-foreground tracking-wider uppercase">{t('divs.projected_annual')}</span>
                    </div>
                    <p className="text-xl font-bold tracking-tight">${projectedAnnual.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="size-4 text-purple-500" />
                        <span className="text-[9px] font-bold text-muted-foreground tracking-wider uppercase">{t('divs.records')}</span>
                    </div>
                    <p className="text-xl font-bold tracking-tight">{recordsForYear.length}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="size-4 text-orange-500" />
                        <span className="text-[9px] font-bold text-muted-foreground tracking-wider uppercase">{t('divs.stocks')}</span>
                    </div>
                    <p className="text-xl font-bold tracking-tight">{symbols.length}</p>
                </div>
            </div>

            {/* Year Selector */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {[selectedYear - 1, selectedYear, selectedYear + 1].map(year => (
                    <button
                        key={year}
                        onClick={() => setSelectedYear(year)}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${year === selectedYear
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                            }`}
                    >
                        {year}
                    </button>
                ))}
            </div>

            {/* Chart */}
            <div className="bg-card border border-border rounded-xl p-4">
                <MonthlyDividendChart data={(() => {
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const monthlyData = months.map(name => ({ name, amount: 0 }));
                    recordsForYear.forEach((r: any) => {
                        const month = new Date(r.payDate).getMonth();
                        monthlyData[month].amount += r.amount;
                    });
                    return monthlyData;
                })()} />
            </div>

            {/* Stock Dividend List */}
            <div className="space-y-2">
                <h3 className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">{t('divs.stock_dividends')}</h3>
                {symbols.map(symbol => {
                    const stockEntries = stockAssets.filter((a: any) => a.tickerSymbol === symbol);
                    const totalQty = stockEntries.reduce((s: number, a: any) => s + a.amount, 0);
                    const currency = stockEntries[0]?.currency || 'USD';
                    const symbolRecords = recordsForYear.filter((r: any) => r.symbol === symbol);
                    const symbolTotal = symbolRecords.reduce((s: number, r: any) => s + r.amount, 0);

                    return (
                        <div key={symbol} className="bg-card border border-border rounded-xl px-4 py-3.5 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-primary">{symbol}</p>
                                <p className="text-[11px] text-muted-foreground">{totalQty.toLocaleString()} shares</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-sm font-bold">{currency === 'KRW' ? '₩' : '$'}{symbolTotal.toLocaleString()}</p>
                                    <p className="text-[10px] text-muted-foreground">{symbolRecords.length} records</p>
                                </div>
                                <button
                                    onClick={() => handleOpenSheet(symbol, currency, 'record')}
                                    className="p-2 rounded-lg bg-primary/10 text-primary active:bg-primary/20"
                                >
                                    <Plus className="size-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <ViewModeToggle />

            {/* Sheet */}
            <Sheet open={sheetState.open} onOpenChange={(open) => setSheetState(s => ({ ...s, open }))}>
                <SheetContent className="sm:max-w-md flex flex-col overflow-y-auto pr-6">
                    <SheetHeader className="mb-6 text-left">
                        <SheetTitle className="text-xl font-black">{sheetState.symbol} — {t('divs.add_record')}</SheetTitle>
                        <SheetDescription className="text-xs">{t('divs.add_record_desc')}</SheetDescription>
                    </SheetHeader>
                    {sheetState.symbol && (
                        <DividendRecordForm
                            tickerSymbol={sheetState.symbol}
                            currency={sheetState.currency || 'USD'}
                            onSuccess={() => { setSheetState({ open: false }); window.location.reload(); }}
                        />
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
