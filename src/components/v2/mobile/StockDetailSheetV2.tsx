'use client';

import React, { useState, useEffect } from 'react';

import {
    X,
    TrendingUp,
    TrendingDown,
    Building2,
    BarChart2,
    Percent,
    Trash2,
    Plus,
    Pencil,
    Star,
} from 'lucide-react';
import { AssetItem, deleteStockAssetAllEntries, deleteStockEntry, getDividendRecordsBySymbol, addDividendRecord, editDividendRecord, deleteDividendRecord, getPredefinedAccounts } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { isKoreanStock, getNormalizedTicker, getStockDisplayName } from '@/lib/stock-utils';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import StockAliasEditSheet from './StockAliasEditSheet';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';

// --- Sub-component for individual history entry with sticky swipe ---
const PurchaseHistoryItem = ({
    entry,
    idx,
    isUSD,
    exchangeRate,
    currentPrice,
    isKRStock,
    handleDeleteEntry,
    handleEditEntry,
}: {
    entry: any;
    idx: number;
    isUSD: boolean;
    exchangeRate: number;
    currentPrice: number | null;
    isKRStock: boolean;
    handleDeleteEntry: (id: string) => void;
    handleEditEntry: (entry: any) => void;
}) => {
    const controls = useAnimation();
    const { getUpColor, getDownColor } = useUserPreferences();
    const upColor = getUpColor();
    const downColor = getDownColor();

    const entryAvgPrice = entry.qty > 0 ? entry.totalCost / entry.qty : 0;
    const entryAvgPriceInKrw = isUSD ? entryAvgPrice * exchangeRate : entryAvgPrice;
    const entryCurrentValueInKrw = (isUSD ? (currentPrice || 0) * exchangeRate : (currentPrice || 0)) * entry.qty;
    const entryTotalCostInKrw = isUSD ? entry.totalCost * exchangeRate : entry.totalCost;
    const entryPnl = entryCurrentValueInKrw - entryTotalCostInKrw;
    const entryReturnRate = entryTotalCostInKrw > 0 ? (entryPnl / entryTotalCostInKrw) * 100 : 0;
    const isEntryPositive = entryPnl >= 0;

    const onDragEnd = (event: any, info: any) => {
        // info.offset.x is the total distance dragged
        // If dragged more than 40px left, snap to reveal buttons
        if (info.offset.x < -40) {
            controls.start({ x: -160 }); // Space for two buttons (80px each)
        } else {
            // Otherwise snap back to origin
            controls.start({ x: 0 });
        }
    };

    return (
        <div key={entry.id || idx} className="relative group overflow-hidden rounded-3xl">
            {/* Swipe Background Layer */}
            <div className="absolute inset-0 bg-zinc-50 dark:bg-white/5 flex justify-end items-center">
                {/* Edit Action Area */}
                <div className="h-full w-20 bg-[#FF9500] flex items-center justify-center">
                    <button
                        onClick={() => handleEditEntry(entry)}
                        className="flex flex-col items-center gap-1 text-white active:scale-90 transition-transform"
                    >
                        <Pencil className="size-5" />
                        <span className="text-[10px] font-black uppercase tracking-tighter text-white">수정</span>
                    </button>
                </div>
                {/* Delete Action Area */}
                <div className="h-full w-20 bg-[#FF3B2F] flex items-center justify-center">
                    <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="flex flex-col items-center gap-1 text-white active:scale-90 transition-transform"
                    >
                        <Trash2 className="size-5" />
                        <span className="text-[10px] font-black uppercase tracking-tighter text-white">삭제</span>
                    </button>
                </div>
            </div>

            {/* Foreground Item */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -160, right: 0 }}
                dragElastic={{ left: 0.1, right: 0 }}
                animate={controls}
                onDragEnd={onDragEnd}
                className="bg-white dark:bg-[#1C1C21] p-4 relative z-10 border border-zinc-100 dark:border-white/10"
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="size-8 rounded-xl bg-zinc-200 dark:bg-white/10 flex items-center justify-center">
                            <Building2 className="size-4 text-zinc-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[13px] font-black text-zinc-900 dark:text-white">
                                {entry.predefinedAccountAlias || entry.broker}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                {entry.owner} {entry.account ? `• ${entry.account}` : ''}
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-[14px] font-black text-zinc-900 dark:text-white">
                            {entry.qty.toLocaleString()}주
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-zinc-100 dark:border-white/5">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase mb-0.5">매수 평단</span>
                        <span className="text-[13px] font-black text-zinc-900 dark:text-white">
                            {isUSD ? '$' : '₩'}{entryAvgPrice.toLocaleString(undefined, { maximumFractionDigits: isKRStock ? 0 : 2 })}
                        </span>
                        {isUSD && (
                            <span className="text-[10px] font-bold text-zinc-400">
                                ₩{entryAvgPriceInKrw.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase mb-0.5">평가 손익</span>
                        <span 
                            className="text-[13px] font-black"
                            style={{ color: isEntryPositive ? upColor : downColor }}
                        >
                            {isEntryPositive ? '+' : ''}₩{entryPnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                        <span 
                            className="text-[10px] font-bold"
                            style={{ color: isEntryPositive ? `${upColor}B3` : `${downColor}B3` }}
                        >
                            ({entryReturnRate.toFixed(2)}%)
                        </span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ComposedChart,
    Bar
} from 'recharts';
import { useRouter } from 'next/navigation';

interface StockDetailSheetV2Props {
    isOpen: boolean;
    onClose: () => void;
    onNavigate?: (page: number) => void;
    onAddAsset?: (symbol?: string) => void;
    onEditEntry?: (entry: any) => void;
    stockAsset: AssetItem | null;
    currentPrice: number | null;
    changePercent: number | null;
    exchangeRate: number;
    totalNetWorth: number;
    isWatchlisted?: boolean;
    onToggleWatchlist?: (ticker: string) => void;
    priceData?: any;
    stockAlias?: string;
    onAliasUpdate?: (ticker: string, alias: string) => void;
}

const RANGES = ['1D', '1W', '1M', '3M', '6M', 'YTD', '1Y', 'MAX'];

export default function StockDetailSheetV2({
    isOpen,
    onClose,
    onNavigate,
    onAddAsset,
    stockAsset,
    currentPrice,
    changePercent,
    exchangeRate,
    totalNetWorth,
    onEditEntry,
    isWatchlisted,
    onToggleWatchlist,
    priceData,
    stockAlias,
    onAliasUpdate
}: StockDetailSheetV2Props) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAliasEditOpen, setIsAliasEditOpen] = useState(false);
    const [activeRange, setActiveRange] = useState('1M');
    const [chartData, setChartData] = useState<any[]>([]);
    const [isLoadingChart, setIsLoadingChart] = useState(false);
    const [hoveredData, setHoveredData] = useState<{ price: number; time: string } | null>(null);

    // Dividend State
    const [dividendRecords, setDividendRecords] = useState<Array<{
        id: string;
        amount: number;
        currency: string;
        receivedAt: Date | string;
        taxAmount: number | null;
        holdingsQuantity?: number | null;
        valuationAtTime?: number | null;
        dividendPerShare?: number | null;
        priceAtTime?: number | null;
        predefinedAccountId?: string | null;
        predefinedAccount?: {
            id: string;
            alias: string;
        } | null;
    }>>([]);
    const [isLoadingDividends, setIsLoadingDividends] = useState(false);
    const [isDividendExpanded, setIsDividendExpanded] = useState(false);

    // Add/Edit Dividend Inline Form State
    const [isAddingDividend, setIsAddingDividend] = useState(false);
    const [editingDividendId, setEditingDividendId] = useState<string | null>(null);
    const [newDividendAmount, setNewDividendAmount] = useState('');
    const [newDividendDate, setNewDividendDate] = useState(new Date().toISOString().split('T')[0]);
    const [newDividendTax, setNewDividendTax] = useState('');
    const [newDividendAccountId, setNewDividendAccountId] = useState<string | null>(null);
    const [newDividendHoldingsQuantity, setNewDividendHoldingsQuantity] = useState('');
    const [newDividendValuationAtTime, setNewDividendValuationAtTime] = useState('');
    const [newDividendPerShare, setNewDividendPerShare] = useState('');
    const [newDividendPriceAtTime, setNewDividendPriceAtTime] = useState('');
    const [isSubmittingDividend, setIsSubmittingDividend] = useState(false);

    // Accounts State
    const [accounts, setAccounts] = useState<any[]>([]);

    useEffect(() => {
        const fetchAccounts = async () => {
            const data = await getPredefinedAccounts();
            setAccounts(data);
        };
        fetchAccounts();
    }, []);

    // Verification Modal State
    const [verification, setVerification] = useState<{
        isOpen: boolean;
        mode: 'entry' | 'asset';
        entryId: string | null;
        targetPin: string;
        currentInput: string;
        isDeleting: boolean;
    }>({
        isOpen: false,
        mode: 'entry',
        entryId: null,
        targetPin: '',
        currentInput: '',
        isDeleting: false,
    });

    const [localWatchlisted, setLocalWatchlisted] = useState(isWatchlisted);

    useEffect(() => {
        setLocalWatchlisted(isWatchlisted);
    }, [isWatchlisted, isOpen]);

    const handleToggle = async () => {
        if (!stockAsset?.assetSymbol) return;
        // Optimistic update
        setLocalWatchlisted(!localWatchlisted);
        onToggleWatchlist?.(stockAsset.assetSymbol);
    };

    const router = useRouter();

    const openVerification = (mode: 'entry' | 'asset', entryId: string | null = null) => {
        const pin = Math.floor(1000 + Math.random() * 9000).toString();
        setVerification({
            isOpen: false,
            mode: 'entry',
            entryId: null,
            targetPin: '',
            currentInput: '',
            isDeleting: false,
        });
    };

    const handlePinInput = (digit: string) => {
        if (verification.currentInput.length >= 4) return;
        const newInput = verification.currentInput + digit;

        setVerification(prev => ({ ...prev, currentInput: newInput }));

        if (newInput.length === 4) {
            console.log(`handlePinInput: PIN complete. Entered: ${newInput}, Target: ${verification.targetPin}`);
            if (newInput === verification.targetPin) {
                if (verification.mode === 'entry' && verification.entryId) {
                    confirmDeletion(verification.entryId);
                } else if (verification.mode === 'asset') {
                    confirmAssetDeletion();
                } else {
                    console.error("handlePinInput: Missing parameters for deletion!");
                }
            } else {
                console.log("handlePinInput: PIN mismatch.");
                // Reset after a short delay if wrong
                setTimeout(() => {
                    setVerification(p => ({ ...p, currentInput: '' }));
                }, 500);
            }
        }
    };

    const confirmAssetDeletion = async () => {
        if (!stockAsset?.assetSymbol) return;
        setVerification(prev => ({ ...prev, isDeleting: true }));

        try {
            const res = await deleteStockAssetAllEntries(stockAsset.assetSymbol);
            if (res.success) {
                setVerification({ isOpen: false, mode: 'asset', entryId: null, targetPin: '', currentInput: '', isDeleting: false });
                onClose();
                // Navigate to Page 2 and refresh data
                setTimeout(() => {
                    onNavigate?.(1); // Page 2 is index 1
                    router.refresh();
                }, 300);
            } else {
                setVerification(prev => ({ ...prev, isDeleting: false }));
                alert("자산 삭제에 실패했습니다.");
            }
        } catch (err) {
            console.error("Failed to delete asset:", err);
            setVerification(prev => ({ ...prev, isDeleting: false }));
            alert("자산 삭제 중 오류가 발생했습니다.");
        }
    };

    const confirmDeletion = async (entryId: string) => {
        if (!stockAsset?.assetSymbol) return;
        setVerification(prev => ({ ...prev, isDeleting: true }));

        try {
            const res = await deleteStockEntry(entryId, stockAsset.assetSymbol);
            if (res.success) {
                setVerification({ isOpen: false, mode: 'entry', entryId: null, targetPin: '', currentInput: '', isDeleting: false });

                // If this was the last entry, close sheet and navigate to Page 2 (D Card view)
                if (stockAsset.entries && stockAsset.entries.length === 1) {
                    onClose();
                    // Small delay to let the sheet close animation breathe
                    setTimeout(() => {
                        onNavigate?.(1); // Page 2 is index 1
                    }, 300);
                } else {
                    router.refresh();
                }
            } else {
                setVerification(prev => ({ ...prev, isDeleting: false }));
            }
        } catch (err) {
            console.error("Failed to delete entry:", err);
            setVerification(prev => ({ ...prev, isDeleting: false }));
            alert("기록 삭제 중 오류가 발생했습니다.");
        }
    };

    const handleDeleteEntry = (entryId: string) => {
        openVerification('entry', entryId);
    };

    const handleDelete = () => {
        openVerification('asset');
    };

    // Robust Currency Detection
    const isKRStock = isKoreanStock(stockAsset?.assetSymbol, stockAsset?.currency);
    const isUSD = !isKRStock;

    useEffect(() => {
        if (!isOpen || !stockAsset?.assetSymbol) return;

        const fetchHistory = async () => {
            setIsLoadingChart(true);
            try {
                // Synchronize with MarketQuoteWidgetV2.tsx
                const rangeMap: Record<string, { range: string, interval: string }> = {
                    '1D': { range: '1d', interval: '15m' },
                    '1W': { range: '5d', interval: '1h' },
                    '1M': { range: '1mo', interval: '1d' },
                    '3M': { range: '3mo', interval: '1d' },
                    '6M': { range: '6mo', interval: '1wk' },
                    'YTD': { range: 'ytd', interval: '1wk' },
                    '1Y': { range: '1y', interval: '1mo' }
                };

                const { range, interval } = rangeMap[activeRange] || rangeMap['1M'];

                // Normalize symbol
                if (!stockAsset.assetSymbol) return;
                const symbol = getNormalizedTicker(stockAsset.assetSymbol);

                const res = await fetch(`/api/stock-history?symbol=${symbol}&range=${range}&interval=${interval}`);
                if (!res.ok) throw new Error('Failed to fetch chart data');

                const data = await res.json();
                if (data.chartData) {
                    setChartData(data.chartData);
                }
            } catch (err) {
                console.error("Failed to fetch stock history:", err);
                setChartData([]);
            } finally {
                setIsLoadingChart(false);
            }
        };

        fetchHistory();
    }, [isOpen, stockAsset?.assetSymbol, activeRange]);

    useEffect(() => {
        if (!isOpen || !stockAsset?.assetSymbol) return;

        const fetchDividends = async () => {
            setIsLoadingDividends(true);
            try {
                const records = await getDividendRecordsBySymbol(stockAsset.assetSymbol as string);
                setDividendRecords(records);
            } catch (error) {
                console.error("Failed to fetch dividend records:", error);
            } finally {
                setIsLoadingDividends(false);
            }
        };

        fetchDividends();
    }, [isOpen, stockAsset?.assetSymbol]);

    // Reset UI state when the sheet is closed or opened with a new symbol
    useEffect(() => {
        if (!isOpen) {
            setIsDividendExpanded(false);
            setIsAddingDividend(false);
            setEditingDividendId(null);
            setNewDividendAmount('');
            setNewDividendTax('');
            setNewDividendAccountId(null);
            setNewDividendHoldingsQuantity('');
            setNewDividendValuationAtTime('');
            setNewDividendPerShare('');
            setNewDividendPriceAtTime('');
        }
    }, [isOpen]);

    const handleAddDividend = async () => {
        if (!stockAsset?.assetSymbol || !newDividendAmount || isNaN(Number(newDividendAmount))) {
            alert('유효한 배당금액을 입력해주세요.');
            return;
        }

        const payload = {
            amount: Number(newDividendAmount),
            currency: isUSD ? 'USD' : 'KRW',
            receivedAt: new Date(newDividendDate),
            taxAmount: newDividendTax ? Number(newDividendTax) : undefined,
            predefinedAccountId: newDividendAccountId,
            holdingsQuantity: newDividendHoldingsQuantity ? Number(newDividendHoldingsQuantity) : undefined,
            valuationAtTime: newDividendValuationAtTime ? Number(newDividendValuationAtTime) : undefined,
            dividendPerShare: newDividendPerShare ? Number(newDividendPerShare) : undefined,
            priceAtTime: newDividendPriceAtTime ? Number(newDividendPriceAtTime) : undefined,
        };

        setIsSubmittingDividend(true);
        try {
            if (editingDividendId) {
                const updatedRecord = await editDividendRecord(
                    editingDividendId,
                    payload
                );
                setDividendRecords(prev => prev.map(r => r.id === editingDividendId ? updatedRecord : r).sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()));
            } else {
                const newRecord = await addDividendRecord({
                    tickerSymbol: stockAsset.assetSymbol,
                    ...payload
                });
                setDividendRecords(prev => [newRecord, ...prev].sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()));
            }

            // Reset form
            setIsAddingDividend(false);
            setEditingDividendId(null);
            setNewDividendAmount('');
            setNewDividendTax('');
            setNewDividendAccountId(null);
        } catch (error) {
            console.error("Failed to save dividend:", error);
            alert('배당금 저장에 실패했습니다.');
        } finally {
            setIsSubmittingDividend(false);
        }
    };

    const handleDeleteDividend = async () => {
        if (!editingDividendId) return;

        if (!window.confirm('이 배당금 내역을 삭제하시겠습니까?')) return;

        setIsSubmittingDividend(true);
        try {
            await deleteDividendRecord(editingDividendId);
            setDividendRecords(prev => prev.filter(r => r.id !== editingDividendId));

            // Reset form
            setIsAddingDividend(false);
            setEditingDividendId(null);
            setNewDividendAmount('');
            setNewDividendTax('');
            setNewDividendAccountId(null);
        } catch (error) {
            console.error("Failed to delete dividend:", error);
            alert('배당금 삭제에 실패했습니다.');
        } finally {
            setIsSubmittingDividend(false);
        }
    };

    const currentPriceInKrw = currentPrice
        ? (isUSD ? currentPrice * exchangeRate : currentPrice)
        : 0;

    // Display price: if hovering, show that. Otherwise show current.
    const displayPriceKrw = hoveredData
        ? (isUSD ? hoveredData.price * exchangeRate : hoveredData.price)
        : currentPriceInKrw;

    const totalValueKrw = currentPriceInKrw * (stockAsset?.amount || 0);

    const computedAvgPrice = (() => {
        if (stockAsset?.entries && stockAsset.entries.length > 0) {
            const totalCost = stockAsset.entries.reduce((s, e) => s + e.totalCost, 0);
            const totalQty = stockAsset.entries.reduce((s, e) => s + e.qty, 0);
            return totalQty > 0 ? totalCost / totalQty : (stockAsset.avgPrice || 0);
        }
        return stockAsset?.avgPrice || 0;
    })();

    const avgPriceKrw = isUSD ? computedAvgPrice * exchangeRate : computedAvgPrice;
    const bookValue = avgPriceKrw * (stockAsset?.amount || 0);
    const unrealizedPnl = totalValueKrw - bookValue;
    const returnRate = bookValue > 0 ? (unrealizedPnl / bookValue) * 100 : 0;
    const isPositive = returnRate >= 0;

    const { getUpColor, getDownColor } = useUserPreferences();
    const upColor = getUpColor();
    const downColor = getDownColor();
    const chartColor = changePercent && changePercent >= 0 ? upColor : downColor;

    const formatPriceLocal = (value: number) => {
        return value.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: isKRStock ? 0 : 2
        });
    };

    const CustomTooltip = ({ active, payload }: any) => {
        useEffect(() => {
            if (active && payload && payload.length) {
                const priceItem = payload.find((p: any) => p.dataKey === 'price');
                if (priceItem) {
                    const nextPrice = priceItem.value;
                    const nextTime = priceItem.payload.time || priceItem.payload.date;

                    setHoveredData(prev => {
                        if (!prev || prev.price !== nextPrice || prev.time !== nextTime) {
                            return { price: nextPrice, time: nextTime };
                        }
                        return prev;
                    });
                }
            } else {
                setHoveredData(prev => prev === null ? prev : null);
            }
        }, [active, payload]);

        if (active && payload && payload.length) {
            const priceItem = payload.find((p: any) => p.dataKey === 'price');
            if (priceItem) {
                return (
                    <div className="bg-white dark:bg-[#1C1C21] px-3 py-2 rounded-xl shadow-2xl border border-zinc-100 dark:border-white/10">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{priceItem.payload.time}</p>
                        <p className="text-[14px] font-black text-zinc-900 dark:text-white">
                            {isUSD ? '$' : '₩'}{priceItem.value.toLocaleString()}
                        </p>
                    </div>
                );
            }
        }
        return null;
    };

    const totalDividendAmount = dividendRecords.reduce((sum, record) => sum + record.amount, 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[120]"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        drag="y"
                        dragConstraints={{ top: 0 }}
                        dragElastic={{ top: 0 }}
                        onDragEnd={(_, info) => {
                            if (info.offset.y > 100 || info.velocity.y > 500) onClose();
                        }}
                        className="fixed bottom-0 left-0 right-0 h-auto max-h-[92vh] rounded-t-[40px] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-[#121214] flex flex-col z-[130] [&>button]:hidden"
                    >
                        {/* Handle */}
                        <div className="relative pt-3 pb-2 flex justify-center shrink-0">
                            <div className="w-12 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full" />

                            <div className="absolute right-6 top-[14px] flex items-center gap-2">
                                {/* Star Toggle */}
                                {stockAsset?.assetSymbol && (
                                    <button
                                        onClick={handleToggle}
                                        className={cn(
                                            "p-2 rounded-full transition-all active:scale-95",
                                            localWatchlisted
                                                ? "bg-yellow-400/10 text-yellow-500"
                                                : "bg-zinc-100 dark:bg-white/5 text-zinc-400"
                                        )}
                                    >
                                        <Star
                                            className={cn("size-5", localWatchlisted && "fill-yellow-500")}
                                        />
                                    </button>
                                )}

                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 transition-all active:scale-95"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-y-auto hide-scrollbar pb-10">
                            {/* Header Info */}
                            <div className="px-6 pt-4 mb-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                                                {getStockDisplayName(stockAsset?.assetSymbol, (stockAsset as any)?.assetName || (stockAsset as any)?.name, priceData, stockAlias)}
                                            </h2>
                                            <button
                                                onClick={() => setIsAliasEditOpen(true)}
                                                className="p-1.5 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                                            >
                                                <Pencil className="size-3.5" />
                                            </button>
                                            {stockAsset?.currency === 'USD' && (
                                                <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[10px] font-bold">USD</span>
                                            )}
                                        </div>
                                        <p className="text-zinc-400 font-bold tracking-wider text-xs">
                                            {stockAsset?.assetSymbol} • {isKoreanStock(stockAsset?.assetSymbol || '') ? 'KOSPI' : 'NASDAQ'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-end gap-3">
                                    <span className={cn(
                                        "text-3xl font-black transition-colors",
                                        hoveredData ? "text-[#38C798]" : "text-zinc-900 dark:text-white"
                                    )}>
                                        {isUSD ? '$' : '₩'}{formatPriceLocal(hoveredData ? hoveredData.price : (currentPrice || computedAvgPrice))}
                                    </span>
                                    {!hoveredData && (
                                        <div 
                                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[13px] font-black text-white mb-1"
                                            style={{ backgroundColor: (changePercent || 0) >= 0 ? upColor : downColor }}
                                        >
                                            {(changePercent || 0) >= 0 ? "+" : ""}{(changePercent || 0).toFixed(2)}%
                                        </div>
                                    )}
                                    {hoveredData && (
                                        <div className="text-[11px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">
                                            {hoveredData.time}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Range Selectors */}
                            <div className="px-6 mb-4">
                                <div className="flex items-center justify-between bg-zinc-50 dark:bg-white/5 p-1 rounded-xl gap-0.5">
                                    {['1D', '1W', '1M', '3M', '6M', 'YTD', '1Y'].map((range) => (
                                        <button
                                            key={range}
                                            onClick={() => setActiveRange(range)}
                                            className={cn(
                                                "flex-1 py-1.5 text-[11px] font-black rounded-lg transition-all",
                                                activeRange === range
                                                    ? "bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 shadow-lg"
                                                    : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                            )}
                                        >
                                            {range}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Detailed Chart (Synchronized with Watchlist) */}
                            <div className="px-4 mb-8">
                                <div className="w-full h-72 bg-white dark:bg-[#1A1A1E] rounded-[32px] border border-zinc-100 dark:border-white/5 relative overflow-hidden flex flex-col pt-8 pb-4">
                                    <div className="flex-1 w-full px-2 relative">
                                        {isLoadingChart ? (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-8 h-8 border-2 border-zinc-200 dark:border-zinc-800 border-t-[#38C798] rounded-full animate-spin" />
                                            </div>
                                        ) : chartData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ComposedChart
                                                    data={chartData}
                                                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                                                >
                                                    <defs>
                                                        <linearGradient id="colorPriceSheet" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor={chartColor} stopOpacity={0.15} />
                                                            <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.1} />
                                                    <XAxis dataKey="time" hide />
                                                    <YAxis
                                                        yAxisId="price"
                                                        domain={['auto', 'auto']}
                                                        orientation="right"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fontSize: 10, fontWeight: 'bold', fill: '#A1A1AA' }}
                                                        mirror
                                                    />
                                                    <YAxis
                                                        yAxisId="volume"
                                                        orientation="left"
                                                        domain={[0, (dataMax: number) => dataMax * 3.5]}
                                                        hide={true}
                                                    />
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <Bar
                                                        yAxisId="volume"
                                                        dataKey="volume"
                                                        fill="#A1A1AA"
                                                        opacity={0.3}
                                                        barSize={1.5}
                                                    />
                                                    <Area
                                                        yAxisId="price"
                                                        type="monotone"
                                                        dataKey="price"
                                                        stroke={chartColor}
                                                        strokeWidth={2.5}
                                                        fillOpacity={1}
                                                        fill="url(#colorPriceSheet)"
                                                        animationDuration={1000}
                                                        dot={false}
                                                        activeDot={{ r: 6, strokeWidth: 0, fill: chartColor }}
                                                    />
                                                </ComposedChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-zinc-400 font-bold text-sm">
                                                데이터를 불러올 수 없습니다.
                                            </div>
                                        )}
                                    </div>

                                    {/* Time Labels Overlay */}
                                    <div className="mt-2 px-8 flex justify-between text-[10px] font-black text-zinc-300 dark:text-zinc-600 tracking-tighter">
                                        <span>{chartData[0]?.time}</span>
                                        <span>{chartData[Math.floor(chartData.length / 2)]?.time}</span>
                                        <span>{chartData[chartData.length - 1]?.time}</span>
                                    </div>

                                    <div className="absolute top-4 left-6 flex items-center gap-2">
                                        <div className="size-1.5 rounded-full bg-red-500 animate-pulse" />
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                            {activeRange === '1D' ? 'REALTIME 1D' : `${activeRange} TREND`}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Key Statistics Grid */}
                            <div className="px-6">
                                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 px-1">주요 통계</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: '보유 수량', value: `${(stockAsset?.amount || 0).toLocaleString()}주` },
                                        { label: '평가 금액', value: `₩${totalValueKrw.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
                                        { label: '평균 단가', value: `${isUSD ? '$' : '₩'}${formatPriceLocal(computedAvgPrice)}` },
                                        { label: '현재가', value: `${isUSD ? '$' : '₩'}${formatPriceLocal(currentPrice || computedAvgPrice || 0)}` },
                                        { label: '보유 기간', value: '1일' },
                                        {
                                            label: '평가 손익',
                                            value: (
                                                <span className={cn(unrealizedPnl >= 0 ? "text-[#FF4F60]" : "text-[#35C759]")}>
                                                    ₩{unrealizedPnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                    <span className="text-[10px] ml-1 opacity-60 font-bold">({returnRate.toFixed(2)}%)</span>
                                                </span>
                                            ),
                                            isCustomValue: true
                                        },
                                    ].map((stat) => (
                                        <div key={stat.label} className="bg-zinc-50 dark:bg-white/5 p-4 rounded-2xl flex flex-col gap-1">
                                            <span className="text-[11px] font-bold text-zinc-400">{stat.label}</span>
                                            <span className={cn(
                                                "text-[15px] font-black",
                                                !(stat as any).isCustomValue && "text-zinc-900 dark:text-white"
                                            )}>
                                                {stat.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Purchase History Section */}
                            {stockAsset?.entries && stockAsset.entries.length > 0 && (
                                <div className="px-6 mt-10">
                                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 px-1">매수 이력</h3>
                                    <div className="space-y-3">
                                        {stockAsset.entries.map((entry, idx) => (
                                            <PurchaseHistoryItem
                                                key={entry.id || idx}
                                                entry={entry}
                                                idx={idx}
                                                isUSD={isUSD}
                                                exchangeRate={exchangeRate}
                                                currentPrice={currentPrice}
                                                isKRStock={isKRStock}
                                                handleDeleteEntry={handleDeleteEntry}
                                                handleEditEntry={(entry) => onEditEntry?.({ ...entry, tickerSymbol: stockAsset.assetSymbol })}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Dividend History Section */}
                            {(dividendRecords.length > 0 || isAddingDividend) && (
                                <div className="px-6 mt-10">
                                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 px-1">배당 내역</h3>

                                    {/* Dividend Summary Card / Toggle */}
                                    <div
                                        onClick={() => setIsDividendExpanded(!isDividendExpanded)}
                                        className="bg-white dark:bg-[#1C1C21] p-5 rounded-3xl border border-zinc-100 dark:border-white/5 cursor-pointer flex items-center justify-between shadow-sm active:scale-[0.98] transition-transform mb-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                                                <TrendingUp className="size-5 text-indigo-500" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold text-zinc-400 uppercase mb-0.5">총 누적 배당금</p>
                                                <p className="text-[16px] font-black text-zinc-900 dark:text-white">
                                                    {isUSD ? '$' : '₩'}{totalDividendAmount.toLocaleString(undefined, { maximumFractionDigits: isUSD ? 2 : 0 })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-zinc-300 dark:text-zinc-600">
                                            {isDividendExpanded ? (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                                            ) : (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Dividend List */}
                                    <AnimatePresence>
                                        {isDividendExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden mb-4"
                                            >
                                                <div className="space-y-2 bg-zinc-50 dark:bg-[#161618] rounded-2xl p-4 border border-zinc-100 dark:border-white/5">
                                                    {dividendRecords.length === 0 && !isAddingDividend && (
                                                        <div className="text-center py-4 text-zinc-400 text-sm font-medium">배당 내역이 없습니다.</div>
                                                    )}
                                                    {dividendRecords.map((record) => (
                                                        <div
                                                            key={record.id}
                                                            onClick={() => {
                                                                setEditingDividendId(record.id);
                                                                setNewDividendDate(new Date(record.receivedAt).toISOString().split('T')[0]);
                                                                setNewDividendAmount(record.amount.toString());
                                                                setNewDividendTax(record.taxAmount ? record.taxAmount.toString() : '');
                                                                setNewDividendAccountId(record.predefinedAccountId || null);
                                                                setIsAddingDividend(true);
                                                            }}
                                                            className="flex justify-between items-center py-2 px-2 border-b border-zinc-200 dark:border-white/5 last:border-0 last:pb-0 cursor-pointer active:bg-zinc-200/50 dark:active:bg-white/5 rounded-lg transition-colors"
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="text-[13px] font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                                                                    {new Date(record.receivedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                                    {record.predefinedAccount && (
                                                                        <span className="bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 text-[9px] px-1.5 py-0.5 rounded-md font-black tracking-tight flex items-center gap-1">
                                                                            <Building2 className="size-2.5" />
                                                                            {record.predefinedAccount.alias}
                                                                        </span>
                                                                    )}
                                                                </span>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    {record.holdingsQuantity && (
                                                                        <span className="text-[10px] font-bold text-zinc-400 uppercase">{record.holdingsQuantity.toLocaleString()}주</span>
                                                                    )}
                                                                    {record.dividendPerShare && (
                                                                        <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 dark:bg-white/5 px-1 rounded">주당 {isUSD ? '$' : '₩'}{record.dividendPerShare.toLocaleString(undefined, { maximumFractionDigits: isUSD ? 2 : 0 })}</span>
                                                                    )}
                                                                    {record.taxAmount && (
                                                                        <span className="text-[10px] text-zinc-400">세: {isUSD ? '$' : '₩'}{record.taxAmount.toLocaleString(undefined, { maximumFractionDigits: isUSD ? 2 : 0 })}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className="text-[14px] font-black text-[#38C798]">
                                                                +{isUSD ? '$' : '₩'}{record.amount.toLocaleString(undefined, { maximumFractionDigits: isUSD ? 2 : 0 })}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Add Dividend Form */}
                                    <AnimatePresence>
                                        {isAddingDividend && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="bg-white dark:bg-[#1C1C21] p-5 rounded-3xl border border-zinc-100 dark:border-white/5 mb-3 shadow-md">
                                                    <h4 className="text-[13px] font-black text-zinc-900 dark:text-white mb-4">
                                                        {editingDividendId ? '배당금 수정' : '새 배당금 입력'}
                                                    </h4>
                                                    <div className="space-y-4">
                                                        {accounts.length > 0 && (
                                                            <div>
                                                                <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-2">계좌 선택 (선택)</label>
                                                                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                                                                    {accounts.map((acc) => {
                                                                        const isSelected = newDividendAccountId === acc.id;
                                                                        return (
                                                                            <button
                                                                                key={acc.id}
                                                                                type="button"
                                                                                onClick={() => setNewDividendAccountId(isSelected ? null : acc.id)}
                                                                                className={cn(
                                                                                    "shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-xl border active:scale-95 transition-all text-left",
                                                                                    isSelected
                                                                                        ? "bg-[#38C798] border-[#38C798] shadow-lg shadow-[#38C798]/20"
                                                                                        : "bg-white dark:bg-white/5 border-zinc-100 dark:border-white/5"
                                                                                )}
                                                                            >
                                                                                <Building2 className={cn(
                                                                                    "size-3.5",
                                                                                    isSelected ? "text-white" : "text-zinc-400"
                                                                                )} />
                                                                                <span className={cn(
                                                                                    "text-[12px] font-black",
                                                                                    isSelected ? "text-white" : "text-zinc-600 dark:text-zinc-300"
                                                                                )}>
                                                                                    {acc.alias}
                                                                                </span>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">지급일</label>
                                                            <input
                                                                type="date"
                                                                value={newDividendDate}
                                                                onChange={(e) => setNewDividendDate(e.target.value)}
                                                                className="w-full bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-[14px] font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-[#38C798] transition-colors"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">배당 금액 ({isUSD ? 'USD' : 'KRW'})</label>
                                                                <input
                                                                    type="number"
                                                                    placeholder="0.00"
                                                                    value={newDividendAmount}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        setNewDividendAmount(val);
                                                                        if (newDividendHoldingsQuantity && !isNaN(Number(val)) && !isNaN(Number(newDividendHoldingsQuantity)) && Number(newDividendHoldingsQuantity) !== 0) {
                                                                            const perShare = Number(val) / Number(newDividendHoldingsQuantity);
                                                                            setNewDividendPerShare(isUSD ? perShare.toString() : Math.round(perShare).toString());
                                                                        }
                                                                    }}
                                                                    className="w-full bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-[14px] font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-[#38C798] transition-colors"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">주당 배당액</label>
                                                                <input
                                                                    type="number"
                                                                    placeholder="0.00"
                                                                    value={newDividendPerShare}
                                                                    onChange={(e) => setNewDividendPerShare(e.target.value)}
                                                                    className="w-full bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-[14px] font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-[#38C798] transition-colors border-dashed"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-3 gap-3 pt-1">
                                                            <div>
                                                                <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">보유 수량</label>
                                                                <input
                                                                    type="number"
                                                                    value={newDividendHoldingsQuantity}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        setNewDividendHoldingsQuantity(val);
                                                                        if (newDividendAmount && !isNaN(Number(val)) && !isNaN(Number(newDividendAmount)) && Number(val) !== 0) {
                                                                            const perShare = Number(newDividendAmount) / Number(val);
                                                                            setNewDividendPerShare(isUSD ? perShare.toString() : Math.round(perShare).toString());
                                                                        }
                                                                    }}
                                                                    className="w-full bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-[12px] font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-[#38C798]"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">당시 주가</label>
                                                                <input
                                                                    type="number"
                                                                    value={newDividendPriceAtTime}
                                                                    onChange={(e) => setNewDividendPriceAtTime(e.target.value)}
                                                                    className="w-full bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-[12px] font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-[#38C798]"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">평가 금액</label>
                                                                <input
                                                                    type="number"
                                                                    value={newDividendValuationAtTime}
                                                                    onChange={(e) => setNewDividendValuationAtTime(e.target.value)}
                                                                    className="w-full bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-[12px] font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-[#38C798]"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="col-span-2">
                                                                <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">세금 (선택)</label>
                                                                <input
                                                                    type="number"
                                                                    placeholder="0.00"
                                                                    value={newDividendTax}
                                                                    onChange={(e) => setNewDividendTax(e.target.value)}
                                                                    className="w-full bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-[14px] font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-[#38C798] transition-colors"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 pt-2">
                                                            {editingDividendId && (
                                                                <button
                                                                    onClick={handleDeleteDividend}
                                                                    disabled={isSubmittingDividend}
                                                                    className="flex-1 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-[13px] font-bold text-red-500 active:scale-[0.98] transition-all disabled:opacity-50"
                                                                >
                                                                    삭제
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => {
                                                                    setIsAddingDividend(false);
                                                                    setEditingDividendId(null);
                                                                    setNewDividendAmount('');
                                                                    setNewDividendTax('');
                                                                    setNewDividendAccountId(null);
                                                                }}
                                                                className="flex-1 py-3 rounded-xl bg-zinc-100 dark:bg-white/5 text-[13px] font-bold text-zinc-500 dark:text-zinc-400 active:scale-[0.98] transition-all"
                                                            >
                                                                취소
                                                            </button>
                                                            <button
                                                                onClick={handleAddDividend}
                                                                disabled={isSubmittingDividend || !newDividendAmount}
                                                                className="flex-[2] py-3 rounded-xl bg-[#38C798] text-[13px] font-black text-white active:scale-[0.98] transition-all disabled:opacity-50"
                                                            >
                                                                {isSubmittingDividend ? '저장 중...' : '저장하기'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            <div className="px-6 mt-10 mb-20 grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => {
                                        setEditingDividendId(null);
                                        setNewDividendAmount('');
                                        setNewDividendTax('');
                                        setNewDividendDate(new Date().toISOString().split('T')[0]);
                                        setNewDividendAccountId(null);

                                        // Pre-fill holdings context
                                        setNewDividendHoldingsQuantity((stockAsset?.amount || 0).toString());
                                        setNewDividendValuationAtTime(totalValueKrw.toString());
                                        setNewDividendPriceAtTime((currentPrice || 0).toString());
                                        
                                        setIsAddingDividend(true);
                                        setIsDividendExpanded(true); // Auto expand to show new entry
                                    }}
                                    className="py-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-dashed border-zinc-200 dark:border-white/10 flex items-center justify-center gap-2 group active:scale-[0.98] transition-all col-span-2"
                                >
                                    <div className="size-6 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all flex items-center justify-center">
                                        <Plus className="size-3.5" />
                                    </div>
                                    <span className="text-[13px] font-black text-zinc-400 group-hover:text-indigo-500 transition-colors uppercase tracking-tight">배당금 추가</span>
                                </button>

                                <button
                                    onClick={() => onAddAsset?.(stockAsset?.assetSymbol || undefined)}
                                    className="py-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-dashed border-zinc-200 dark:border-white/10 flex items-center justify-center gap-2 group active:scale-[0.98] transition-all"
                                >
                                    <div className="size-6 rounded-full bg-zinc-200 dark:bg-white/10 text-zinc-500 group-hover:bg-[#38C798] group-hover:text-white transition-all flex items-center justify-center">
                                        <Plus className="size-3.5" />
                                    </div>
                                    <span className="text-[13px] font-black text-zinc-400 group-hover:text-[#38C798] transition-colors uppercase tracking-tight">자산 추가</span>
                                </button>

                                <button
                                    onClick={handleDelete}
                                    className="py-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-dashed border-zinc-200 dark:border-white/10 flex items-center justify-center gap-2 group active:scale-[0.98] transition-all hover:bg-red-50 dark:hover:bg-red-900/10 hover:border-red-200 dark:hover:border-red-900/20"
                                >
                                    <div className="size-6 rounded-full bg-zinc-200 dark:bg-white/10 text-zinc-500 group-hover:bg-red-500 group-hover:text-white transition-all flex items-center justify-center">
                                        <Trash2 className="size-3.5" />
                                    </div>
                                    <span className="text-[13px] font-black text-zinc-400 group-hover:text-red-500 transition-colors uppercase tracking-tight">자산 삭제</span>
                                </button>
                            </div>


                            {/* Verification Modal Overlay (Moved inside SheetContent for correct event handling) */}
                            {/* Full-screen Keypad Verification Modal */}
                            <AnimatePresence>
                                {verification.isOpen && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-[300] bg-white dark:bg-black flex flex-col items-center justify-center transition-colors duration-300"
                                    >
                                        {/* Header: Target & Input */}
                                        <div className="flex flex-col items-center mb-16">
                                            <h2 className="text-[64px] font-light text-zinc-900 dark:text-white tracking-widest mb-2 leading-none">
                                                {verification.targetPin}
                                            </h2>
                                            <div className="flex gap-3 h-8 items-center justify-center">
                                                {verification.currentInput.split('').map((char, idx) => (
                                                    <div key={idx} className="size-2.5 rounded-full bg-zinc-900 dark:bg-white animate-pulse" />
                                                ))}
                                                {Array.from({ length: 4 - verification.currentInput.length }).map((_, idx) => (
                                                    <div key={idx} className="size-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Keypad Grid */}
                                        <div className="grid grid-cols-3 gap-x-6 gap-y-5 mb-12">
                                            {[
                                                '1', '2', '3',
                                                '4', '5', '6',
                                                '7', '8', '9',
                                                '*', '0', '#'
                                            ].map((n) => (
                                                <button
                                                    key={n}
                                                    onClick={() => {
                                                        if (n !== '*' && n !== '#') handlePinInput(n);
                                                    }}
                                                    className={cn(
                                                        "size-20 rounded-full flex flex-col items-center justify-center transition-all active:bg-zinc-200 dark:active:bg-zinc-700",
                                                        n === '*' || n === '#' ? "invisible" : "bg-zinc-50 dark:bg-zinc-900"
                                                    )}
                                                >
                                                    <span className="text-3xl font-normal text-zinc-900 dark:text-white leading-none">{n}</span>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Bottom Actions: Cancel & Delete */}
                                        <div className="flex items-center justify-between w-full max-w-[280px] px-6">
                                            <button
                                                onClick={() => setVerification(v => ({ ...v, isOpen: false }))}
                                                className="text-zinc-900 dark:text-white text-lg font-light active:opacity-50"
                                            >
                                                Cancel
                                            </button>

                                            <button
                                                onClick={() => setVerification(v => ({ ...v, currentInput: v.currentInput.slice(0, -1) }))}
                                                className="size-12 flex items-center justify-center text-zinc-300 dark:text-zinc-500 active:text-zinc-900 dark:active:text-white"
                                            >
                                                <X className="size-8" />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </>
            )}

            <StockAliasEditSheet
                isOpen={isAliasEditOpen}
                onClose={() => setIsAliasEditOpen(false)}
                ticker={stockAsset?.assetSymbol || ''}
                initialAlias={stockAlias || ''}
                onUpdate={(ticker, alias) => {
                    onAliasUpdate?.(ticker, alias);
                }}
            />
        </AnimatePresence>
    );
}
