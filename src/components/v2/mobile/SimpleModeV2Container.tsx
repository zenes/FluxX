'use client';

import React, { useState, useEffect } from 'react';
import MarketQuoteWidgetV2 from './MarketQuoteWidgetV2';
import SimpleModeV2Card from './SimpleModeV2Card';
import AssetListGroupCard from './AssetListGroupCard';
import InvestmentNewsCardV2 from './InvestmentNewsCardV2';
import StockDetailSheetV2 from './StockDetailSheetV2';
import AssetGrowthDetailSheetV2 from './AssetGrowthDetailSheetV2';
import AssetEntrySheetV2 from './AssetEntrySheetV2';
import prisma from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/encryption';
import { revalidatePath } from 'next/cache';
import { bulkInsertTestData, bulkDeleteTestData } from '@/lib/test-actions';
import { backupDatabase, getBackupList, restoreDatabase } from '@/lib/db-actions';
import BackupRestoreSheet from './BackupRestoreSheet';
import { getWatchlistStocks, syncWatchlist, toggleWatchlistStock } from '@/lib/watchlist-actions';
import { isKoreanStock, getStockDisplayName, getQuoteFromResults, getNormalizedTicker } from '@/lib/stock-utils';
import { AssetItem, getAssets, getMemos, getPredefinedAccounts } from '@/lib/actions';
import { calculateNetWorth, MarketPrices, GOLD_TROY_OUNCE_GRAMS } from '@/lib/calculations';
import { cn } from '@/lib/utils';
import { motion, animate, useMotionValue } from 'framer-motion';
import { Briefcase, Coins, PieChart, TrendingUp, Landmark, Plus } from 'lucide-react';
import V2AuthProfileIcon from './V2AuthProfileIcon';
import Link from 'next/link';
import SettingsSheetV2 from './SettingsSheetV2';
import { MarketAsset, INITIAL_STOCKS } from './typesV2';
import DividendDetailSheetV2 from './DividendDetailSheetV2';
import { calculateMonthlyDividends } from '@/lib/dividend-utils';

interface SimpleModeV2ContainerProps {
    assets: AssetItem[];
    marketData: {
        exchange: { rate: number } | null;
        gold: { price: number } | null;
        stockPrices?: Record<string, any>;
        accounts: any[];
    };
    initialHideAssets?: boolean;
    stockAliases?: Record<string, string>;
}

export default function SimpleModeV2Container({ assets, marketData, initialHideAssets = false, stockAliases: initialStockAliases = {} }: SimpleModeV2ContainerProps) {
    const [stockAliases, setStockAliases] = useState<Record<string, string>>(initialStockAliases);
    const [activeTag, setActiveTag] = useState('all');
    const [currentPage, setCurrentPage] = useState(0);
    const [myStocks, setMyStocks] = useState<MarketAsset[]>(INITIAL_STOCKS);
    const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);
    const [isHidden, setIsHidden] = useState(initialHideAssets);

    const togglePrivacy = async () => {
        const newValue = !isHidden;
        setIsHidden(newValue);
        try {
            const { updateUserPrivacy } = await import('@/lib/actions');
            await updateUserPrivacy(newValue);
        } catch (e) {
            console.error("Failed to sync privacy setting:", e);
        }
    };

    // Detail Sheet States
    const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null);
    const [isTotalDetailOpen, setIsTotalDetailOpen] = useState(false);
    const [isAssetEntryOpen, setIsAssetEntryOpen] = useState(false);
    const [entryType, setEntryType] = useState<'stock' | 'other'>('stock');
    const [prefilledSymbol, setPrefilledSymbol] = useState<string | undefined>(undefined);
    const [editingEntry, setEditingEntry] = useState<any | null>(null);
    const [isBackupRestoreOpen, setIsBackupRestoreOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [backups, setBackups] = useState<any[]>([]);
    const [isDividendDetailOpen, setIsDividendDetailOpen] = useState(false);

    const handleAddAssetEntry = (symbol?: string) => {
        setEntryType('stock');
        setPrefilledSymbol(symbol);
        setEditingEntry(null);
        setIsAssetEntryOpen(true);
    };

    const handleEditEntry = (entry: any) => {
        setEntryType('stock');
        setEditingEntry(entry);
        setIsAssetEntryOpen(true);
    };
    const [totalNetWorth, setTotalNetWorth] = useState<number>(0);
    const [marketPrices, setMarketPrices] = useState<MarketPrices | null>(() => {
        if (marketData.stockPrices) {
            return {
                usdKrw: marketData.exchange?.rate || 1400,
                goldUsd: marketData.gold?.price || 2600,
                stockPrices: marketData.stockPrices
            };
        }
        return null;
    });
    const [isLoadingTotal, setIsLoadingTotal] = useState(false);

    // Merge helper for Stock Assets with same symbol
    const mergeStockAssets = (items: AssetItem[]): AssetItem[] => {
        const merged: Record<string, AssetItem> = {};
        const nonStocks: AssetItem[] = [];

        items.forEach(item => {
            if (item.assetType !== 'stock' || !item.assetSymbol) {
                nonStocks.push(item);
                return;
            }

            const symbol = item.assetSymbol;
            if (!merged[symbol]) {
                merged[symbol] = {
                    ...item,
                    entries: item.entries ? [...item.entries] : []
                };
            } else {
                const existing = merged[symbol];
                const newTotalQty = (existing.amount || 0) + (item.amount || 0);

                // Weighted average price calculation
                const existingTotalCost = (existing.avgPrice || 0) * (existing.amount || 0);
                const itemTotalCost = (item.avgPrice || 0) * (item.amount || 0);
                const newAvgPrice = newTotalQty > 0 ? (existingTotalCost + itemTotalCost) / newTotalQty : 0;

                existing.amount = newTotalQty;
                existing.avgPrice = newAvgPrice;
                if (item.entries) {
                    existing.entries = [...(existing.entries || []), ...item.entries];
                }
            }
        });

        return [...Object.values(merged), ...nonStocks];
    };

    const handleToggleWatchlist = async (ticker: string) => {
        try {
            const type = isKoreanStock(ticker) ? 'KR' : 'US';
            await toggleWatchlistStock(ticker, type);
            const dbStocks = await getWatchlistStocks();
            const mappedStocks = dbStocks.map((s: { ticker: string, type: string }) => ({
                id: s.ticker + Date.now().toString(),
                ticker: s.ticker,
                type: s.type as any,
                name: getStockDisplayName(s.ticker, undefined, undefined, stockAliases[s.ticker]),
                currentPrice: 0,
                changeAmount: 0,
                changeRate: 0,
            }));
            setMyStocks(mappedStocks);
        } catch (e) {
            console.error("Failed to toggle watchlist:", e);
        }
    };

    const handleAliasUpdate = (ticker: string, alias: string) => {
        setStockAliases(prev => ({ ...prev, [ticker]: alias }));
    };

    // Persistence: Load stocks from DB and sync from localStorage if needed
    useEffect(() => {
        const initWatchlist = async () => {
            // 1. Check localStorage for migration
            const saved = localStorage.getItem('v2-my-stocks');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        // Sync to DB
                        await syncWatchlist(parsed.map((s: any) => ({ ticker: s.ticker, type: s.type })));
                        // Once synced, we can clear it or leave it, but DB will be primary
                        localStorage.removeItem('v2-my-stocks');
                    }
                } catch (e) {
                    console.error("Failed to migrate v2-my-stocks:", e);
                }
            }

            // 2. Fetch from DB
            const dbStocks = await getWatchlistStocks();
            if (dbStocks.length > 0) {
                // Map DB stocks and inject initial prices from server if available
                const mappedStocks = dbStocks.map((s: { ticker: string, type: string }) => {
                    const qData = getQuoteFromResults(s.ticker, marketData.stockPrices || {});
                    return {
                        id: s.ticker + Date.now().toString(),
                        ticker: s.ticker,
                        type: s.type as any,
                        name: getStockDisplayName(s.ticker, undefined, qData, stockAliases[s.ticker]),
                        currentPrice: qData?.price || 0,
                        changeAmount: qData?.change || 0,
                        changeRate: qData?.changePercent || 0,
                        sparkline: qData?.sparkline || []
                    };
                });
                setMyStocks(mappedStocks);
            }
            setIsHydrated(true);
        };

        initWatchlist();
    }, [marketData.stockPrices]);

    // Initial total net worth calculation after hydration
    useEffect(() => {
        if (isHydrated && marketPrices) {
            const calculatedValue = calculateNetWorth(assets, marketPrices);
            setTotalNetWorth(calculatedValue);
        }
    }, [isHydrated, assets, marketPrices]);

    // Keep selectedAsset in sync with updated assets prop after router.refresh()
    useEffect(() => {
        if (selectedAsset) {
            const mergedAssets = mergeStockAssets(assets);
            const updated = mergedAssets.find(a =>
                (a.id && a.id === selectedAsset.id) ||
                (a.assetSymbol && a.assetSymbol === selectedAsset.assetSymbol)
            );
            if (updated) {
                // Check if data actually changed to avoid infinite loop (though ref change is enough)
                setSelectedAsset(updated);
            }
        }
    }, [assets]);

    // Remove the localStorage persistence effect as DB is now primary

    const refreshAll = async () => {
        setIsLoadingTotal(true);
        try {
            // 1. Collect all unique symbols (Watchlist + Net Worth assets)
            const watchlistSymbols = myStocks.map(s => getNormalizedTicker(s.ticker));
            const assetSymbols = assets
                .filter(a => a.assetType === 'stock' && a.assetSymbol)
                .map(a => getNormalizedTicker(a.assetSymbol));

            const allSymbols = Array.from(new Set([
                'KRW=X',
                'GC=F',
                ...watchlistSymbols,
                ...assetSymbols
            ])).filter(Boolean).join(',');

            // 2. Single fetch for everything
            const response = await fetch(`/api/stock-price?symbols=${allSymbols}`);
            if (!response.ok) throw new Error('Failed to fetch prices');

            const data = await response.json();
            const quotes = data.quotes || {};

            // 3. Update marketPrices state (Merge with latest previous state)
            setMarketPrices(prev => {
                const fxRate = (getQuoteFromResults('KRW=X', quotes))?.price || prev?.usdKrw || marketData.exchange?.rate || 1400;
                const goldPrice = (getQuoteFromResults('GC=F', quotes))?.price || prev?.goldUsd || marketData.gold?.price || 2300;

                const newPrices: MarketPrices = {
                    usdKrw: fxRate,
                    goldUsd: goldPrice,
                    stockPrices: { ...(prev?.stockPrices || {}), ...quotes }
                };

                // 4. Calculate Net Worth using the latest merged prices
                const calculatedValue = calculateNetWorth(assets, newPrices);
                setTotalNetWorth(calculatedValue);

                return newPrices;
            });

            // 5. Update Watchlist (myStocks)
            setMyStocks(prev => prev.map(s => {
                const qData = getQuoteFromResults(s.ticker, quotes);
                if (qData) {
                    return {
                        ...s,
                        name: getStockDisplayName(s.ticker, s.name, qData, stockAliases[s.ticker]),
                        currentPrice: qData.price,
                        changeAmount: qData.change || 0,
                        changeRate: qData.changePercent || 0,
                        sparkline: qData.sparkline
                    };
                }
                return s;
            }));

        } catch (e) {
            console.error("Master refresh failed:", e);
        } finally {
            setIsLoadingTotal(false);
        }
    };

    // Initial refresh after hydration
    useEffect(() => {
        if (isHydrated) {
            refreshAll();
        }
    }, [isHydrated]);

    const containerRef = React.useRef<HTMLDivElement>(null);
    const dragX = useMotionValue(0);

    const [width, setWidth] = useState(390);

    useEffect(() => {
        setWidth(window.innerWidth);
        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const displayAssets = mergeStockAssets(assets);

    // Ensure core asset types always exist
    const coreAssetTypes = ['krw', 'usd', 'gold'];
    const mergedAssets = [...displayAssets];

    coreAssetTypes.forEach(type => {
        if (!mergedAssets.find(a => a.assetType === type)) {
            mergedAssets.push({
                id: `default-${type}`,
                assetType: type,
                amount: 0,
            });
        }
    });

    // Sort assets: Cash/USD/Gold first, then Stocks
    const sortedAssets = [...mergedAssets].sort((a, b) => {
        const order = { krw: 0, usd: 1, gold: 2, stock: 3 };
        return (order[a.assetType as keyof typeof order] ?? 4) - (order[b.assetType as keyof typeof order] ?? 4);
    });

    const totalStockValueKrw = React.useMemo(() => {
        if (!marketPrices) return 0;
        return displayAssets
            .filter(a => a.assetType === 'stock')
            .reduce((sum, asset) => {
                const priceData = marketPrices.stockPrices[asset.assetSymbol?.toUpperCase() || ''];
                const currentPrice = priceData?.price || asset.avgPrice || 0;
                const value = asset.amount * currentPrice;
                const isUSD = asset.currency === 'USD';
                return sum + (isUSD ? value * marketPrices.usdKrw : value);
            }, 0);
    }, [displayAssets, marketPrices]);

    const totalStockPnLInfo = React.useMemo(() => {
        if (!marketPrices) return { pnl: 0, rate: 0 };
        let totalCostKrw = 0;
        let totalMarketKrw = 0;

        displayAssets
            .filter(a => a.assetType === 'stock')
            .forEach(asset => {
                const priceData = marketPrices.stockPrices[asset.assetSymbol?.toUpperCase() || ''];
                const currentPrice = priceData?.price || asset.avgPrice || 0;
                const avgPrice = asset.avgPrice || 0;
                const isUSD = asset.currency === 'USD';

                const cost = asset.amount * avgPrice;
                const market = asset.amount * currentPrice;

                totalCostKrw += isUSD ? cost * marketPrices.usdKrw : cost;
                totalMarketKrw += isUSD ? market * marketPrices.usdKrw : market;
            });

        const pnl = totalMarketKrw - totalCostKrw;
        const rate = totalCostKrw > 0 ? (pnl / totalCostKrw) * 100 : 0;
        return { pnl, rate };
    }, [displayAssets, marketPrices]);

    const totalOtherValueKrw = React.useMemo(() => {
        if (!marketPrices) return 0;
        return displayAssets
            .filter(a => a.assetType !== 'stock')
            .reduce((sum, asset) => {
                const amount = asset.amount || 0;
                if (asset.assetType === 'usd') return sum + (amount * marketPrices.usdKrw);
                if (asset.assetType === 'gold') return sum + (amount * marketPrices.goldUsd * marketPrices.usdKrw / GOLD_TROY_OUNCE_GRAMS); // US Pricing is per ounce
                return sum + amount; // krw
            }, 0);
    }, [displayAssets, marketPrices]);

    const dividendData = React.useMemo(() => {
        return calculateMonthlyDividends(assets, marketPrices?.usdKrw || 1400);
    }, [assets, marketPrices?.usdKrw]);

    const [isPending, setIsPending] = useState(false);

    const handleBackup = async () => {
        if (isPending) return;
        setIsPending(true);
        try {
            const result = await backupDatabase();
            if (result.success) {
                alert(result.message);
            } else {
                alert(result.message);
            }
        } catch (e) {
            console.error(e);
            alert("백업 실패: " + e);
        } finally {
            setIsPending(false);
        }
    };

    const handleShowRestore = async () => {
        try {
            const list = await getBackupList();
            setBackups(list);
            setIsBackupRestoreOpen(true);
        } catch (e) {
            console.error(e);
            alert("백업 목록을 가져오는데 실패했습니다.");
        }
    };

    const handleRestore = async (filename: string) => {
        if (!window.confirm("정말로 이 백업으로 복구하시겠습니까? 현재 데이터가 대체됩니다.")) return;
        setIsPending(true);
        try {
            const result = await restoreDatabase(filename);
            if (result.success) {
                alert(result.message);
                window.location.reload();
            } else {
                alert(result.message);
            }
        } catch (e) {
            console.error(e);
            alert("복구 실패: " + e);
        } finally {
            setIsPending(false);
            setIsBackupRestoreOpen(false);
        }
    };

    const handleDeleteTestData = async () => {
        if (isPending) return;
        if (!window.confirm("정말로 모든 투자 데이터를 삭제하시겠습니까? 계좌, 주식, 현금 자산 정보가 모두 삭제됩니다.")) return;

        setIsPending(true);
        try {
            await bulkDeleteTestData();
            window.location.reload();
        } catch (e) {
            console.error(e);
            alert("삭제 실패: " + e);
        } finally {
            setIsPending(false);
        }
    };

    const goToPage = (pageIndex: number) => {
        if (pageIndex < 0 || pageIndex > 3) return;
        setCurrentPage(pageIndex);
        const targetX = -pageIndex * width;
        animate(dragX, targetX, {
            type: "spring",
            stiffness: 300,
            damping: 30,
            mass: 0.8
        });
    };

    const handleDragEnd = (event: any, info: any) => {
        const velocity = info.velocity.x;
        const offset = info.offset.x;
        const threshold = width * (1 / 3);

        let targetPage = currentPage;

        if (Math.abs(velocity) > 500) {
            if (velocity < 0 && currentPage < 3) targetPage = currentPage + 1;
            else if (velocity > 0 && currentPage > 0) targetPage = currentPage - 1;
        } else {
            if (offset < -threshold && currentPage < 3) targetPage = currentPage + 1;
            else if (offset > threshold && currentPage > 0) targetPage = currentPage - 1;
        }

        goToPage(targetPage);
    };

    useEffect(() => {
        // Use requestAnimationFrame to ensure the scroll happens after render and momentum scrolling
        requestAnimationFrame(() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

            // Fallback for iOS Safari which sometimes ignores the first scrollTo during swipe momentum
            setTimeout(() => {
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            }, 10);
        });
    }, [currentPage]);

    return (
        <div className="overflow-hidden min-h-screen relative bg-[#edf0f4] dark:bg-background" ref={containerRef}>
            <motion.div
                className="flex"
                drag={isAnyModalOpen ? false : "x"}
                dragDirectionLock={true}
                dragConstraints={{ left: -width * 3, right: 0 }}
                dragElastic={0.05}
                dragMomentum={false}
                onDragEnd={handleDragEnd}
                style={{
                    x: dragX,
                    width: '400%',
                    touchAction: 'pan-y'
                }}
            >
                {/* Page 1: Dashboard (Net Worth & News) */}
                <div className={cn("w-[100vw] shrink-0 px-4 pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] pb-24 transition-opacity duration-300", currentPage !== 0 && "opacity-40 pointer-events-none")}>
                    <header className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            <button className="p-2 -ml-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#2B364B] dark:text-white">
                                    <line x1="4" y1="12" x2="20" y2="12"></line>
                                    <line x1="4" y1="6" x2="20" y2="6"></line>
                                    <line x1="4" y1="18" x2="20" y2="18"></line>
                                </svg>
                            </button>

                            <div className="flex gap-1 ml-1">
                                <button
                                    onClick={handleBackup}
                                    disabled={isPending}
                                    className="px-2 py-1 text-[10px] font-bold bg-[#38C798]/10 text-[#38C798] rounded-md border border-[#38C798]/20 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isPending ? "..." : "백업"}
                                </button>
                                <button
                                    onClick={handleShowRestore}
                                    disabled={isPending}
                                    className="px-2 py-1 text-[10px] font-bold bg-blue-500/10 text-blue-500 rounded-md border border-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isPending ? "..." : "복구"}
                                </button>
                                <button
                                    onClick={handleDeleteTestData}
                                    disabled={isPending}
                                    className="px-2 py-1 text-[10px] font-bold bg-[#FF4F60]/10 text-[#FF4F60] rounded-md border border-[#FF4F60]/20 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isPending ? "..." : "데이터 삭제"}
                                </button>
                            </div>
                        </div>

                        {/* Right: Settings & Profile */}
                        <div className="flex items-center gap-1">
                            <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                <svg className="size-5 text-[#2B364B] dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="3"></circle>
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                                </svg>
                            </button>
                            <V2AuthProfileIcon />
                        </div>
                    </header>

                    <div className="space-y-4">
                        <SimpleModeV2Card
                            id="total"
                            initialAssets={displayAssets}
                            initialExchange={marketData.exchange || undefined}
                            initialGold={marketData.gold || undefined}
                            onClick={() => setIsTotalDetailOpen(true)}
                            isHidden={isHidden}
                            onToggleHide={togglePrivacy}
                            forcedValue={totalNetWorth}
                            externalMarketPrices={marketPrices}
                        />

                        {/* New Stock Quotes Widget */}
                        <MarketQuoteWidgetV2
                            myStocks={myStocks}
                            setMyStocks={setMyStocks}
                            onModalToggle={setIsAnyModalOpen}
                            onRefresh={refreshAll}
                            stockAliases={stockAliases}
                            onAliasUpdate={handleAliasUpdate}
                        />

                        <InvestmentNewsCardV2
                            myStocks={myStocks}
                            onModalToggle={setIsAnyModalOpen}
                            isHydrated={isHydrated}
                        />
                    </div>
                </div>

                {/* Page 2: Asset Detail List (Redesigned with Grouping) */}
                <div className={cn("w-[100vw] shrink-0 px-4 pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] pb-24 transition-opacity duration-300", currentPage !== 1 && "opacity-40 pointer-events-none")}>
                    <header className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                                <span className="bg-zinc-900 dark:bg-zinc-800 text-white text-xs px-2 py-0.5 rounded-md">#02</span>
                                자산현황상세
                            </h1>
                            <p className="text-sm text-zinc-400 font-medium">전체 보유 자산 분석</p>
                        </div>
                        <div className="size-10 rounded-full bg-white dark:bg-zinc-800 shadow-sm border border-zinc-100 dark:border-zinc-700 flex items-center justify-center">
                            <PieChart className="size-5 text-zinc-900 dark:text-white" />
                        </div>
                    </header>

                    <div className="space-y-4 pb-10">
                        {/* Group 1: Stock Assets */}
                        <AssetListGroupCard
                            title="주식"
                            icon={Briefcase}
                            assets={displayAssets
                                .filter(a => a.assetType === 'stock')
                                .sort((a, b) => {
                                    if (!marketPrices) return 0;
                                    const getVal = (asset: any) => {
                                        const priceData = marketPrices.stockPrices[asset.assetSymbol?.toUpperCase() || ''];
                                        const currentPrice = priceData?.price || asset.avgPrice || 0;
                                        const value = asset.amount * currentPrice;
                                        return asset.currency === 'USD' ? value * marketPrices.usdKrw : value;
                                    };
                                    return getVal(b) - getVal(a);
                                })
                            }
                            onAssetClick={(asset) => setSelectedAsset(asset)}
                            exchangeRate={marketData.exchange?.rate || 1400}
                            type="stock"
                            marketPrices={marketPrices}
                            debugLabel="D"
                            onAddClick={() => setIsAssetEntryOpen(true)}
                            summary={{
                                totalValue: totalStockValueKrw,
                                pnl: totalStockPnLInfo.pnl,
                                returnRate: totalStockPnLInfo.rate
                            }}
                            isHidden={isHidden}
                            stockAliases={stockAliases}
                        />

                        {/* Group 2: Cash & Commodities */}
                        <AssetListGroupCard
                            title="현금성 자산"
                            icon={Coins}
                            assets={displayAssets.filter(a => a.assetType !== 'stock')}
                            onAssetClick={() => { }} // Disable click for cash assets as requested
                            exchangeRate={marketData.exchange?.rate || 1400}
                            type="other"
                            marketPrices={marketPrices}
                            debugLabel="E"
                            summary={{
                                totalValue: totalOtherValueKrw,
                                pnl: 0, // No PNL for cash/gold yet
                                returnRate: 0
                            }}
                            isHidden={isHidden}
                            onAddClick={() => {
                                setEntryType('other');
                                setIsAssetEntryOpen(true);
                            }}
                        />

                        {/* Removed: Global empty asset message as Card D and E now handle empty states */}
                    </div>
                </div>

                {/* Page 3: Dividend Insights */}
                <div className={cn("w-[100vw] shrink-0 px-4 pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] pb-24 transition-opacity duration-300", currentPage !== 2 && "opacity-40 pointer-events-none")}>
                    <header className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                                <span className="bg-zinc-900 dark:bg-zinc-800 text-white text-xs px-2 py-0.5 rounded-md">#03</span>
                                배당 인사이트
                            </h1>
                            <p className="text-sm text-zinc-400 font-medium">월별 배당금 흐름 및 전망</p>
                        </div>
                        <div className="size-10 rounded-full bg-white dark:bg-zinc-800 shadow-sm border border-zinc-100 dark:border-zinc-700 flex items-center justify-center">
                            <TrendingUp className="size-5 text-zinc-900 dark:text-white" />
                        </div>
                    </header>

                    <div className="space-y-4">
                        <div 
                            onClick={() => setIsDividendDetailOpen(true)}
                            className="bg-white dark:bg-[#1A1A1E] rounded-[24px] p-6 shadow-sm border border-zinc-100 dark:border-white/5 active:scale-[0.98] transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="text-zinc-400 text-sm font-bold">연간 예상 배당금</h3>
                                <div className="p-1.5 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                    <TrendingUp className="size-3 text-primary" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-zinc-300">₩</span>
                                <span className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">
                                    {dividendData.annualTotal.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#1A1A1E] rounded-[24px] p-6 shadow-sm border border-zinc-100 dark:border-white/5 h-64 flex flex-col items-center justify-center gap-3">
                            <div className="size-16 rounded-2xl bg-zinc-50 dark:bg-white/5 flex items-center justify-center">
                                <TrendingUp className="size-8 text-zinc-200 dark:text-zinc-800" />
                            </div>
                            <p className="text-zinc-400 font-bold">배당 차트 준비 중...</p>
                        </div>
                    </div>
                </div>

                {/* Page 4: Account Status */}
                <div className={cn("w-[100vw] shrink-0 px-4 pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] pb-24 transition-opacity duration-300", currentPage !== 3 && "opacity-40 pointer-events-none")}>
                    <header className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                                <span className="bg-zinc-900 dark:bg-zinc-800 text-white text-xs px-2 py-0.5 rounded-md">#04</span>
                                계좌현황
                            </h1>
                            <p className="text-sm text-zinc-400 font-medium">연동된 증권 계좌 정보</p>
                        </div>
                        <div className="size-10 rounded-full bg-white dark:bg-zinc-800 shadow-sm border border-zinc-100 dark:border-zinc-700 flex items-center justify-center">
                            <Landmark className="size-5 text-zinc-900 dark:text-white" />
                        </div>
                    </header>

                    <div className="space-y-3">
                        {marketData.accounts && marketData.accounts.length > 0 ? (
                            marketData.accounts.map((acc: any) => (
                                <div key={acc.id} className="bg-white dark:bg-[#1A1A1E] rounded-[24px] p-5 shadow-sm border border-zinc-100 dark:border-white/5 flex justify-between items-center active:scale-[0.98] transition-transform">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-2xl bg-zinc-50 dark:bg-white/5 flex items-center justify-center font-black text-zinc-400">
                                            {acc.broker?.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-zinc-900 dark:text-white">{acc.alias}</h3>
                                            <p className="text-xs text-zinc-400 font-medium">{acc.broker} • {acc.accountNumber}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-zinc-300 font-bold mb-0.5">BALANCE</div>
                                        <div className="font-black text-zinc-900 dark:text-white">준비 중</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 text-center text-zinc-400 font-medium">등록된 계좌가 없습니다.</div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Pagination Indicators (Dots) */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex gap-2.5 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-4 py-2.5 rounded-full shadow-lg border border-zinc-200/50 dark:border-white/5">
                {[0, 1, 2, 3].map((idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "size-2 rounded-full transition-all duration-300",
                            currentPage === idx
                                ? "bg-zinc-900 dark:bg-white w-6"
                                : "bg-zinc-300 dark:bg-zinc-700"
                        )}
                    />
                ))}
            </div>

            {/* Asset Detail Sheet V2 (Always rendered for exit animation) */}
            <StockDetailSheetV2
                isOpen={!!selectedAsset}
                onClose={() => setSelectedAsset(null)}
                onNavigate={goToPage}
                onAddAsset={handleAddAssetEntry}
                onEditEntry={handleEditEntry}
                stockAsset={selectedAsset}
                currentPrice={selectedAsset ? (marketPrices?.stockPrices?.[selectedAsset.assetSymbol?.toUpperCase() || '']?.price || (selectedAsset.avgPrice ?? 0)) : 0}
                changePercent={selectedAsset ? (marketPrices?.stockPrices?.[selectedAsset.assetSymbol?.toUpperCase() || '']?.changePercent || 0) : 0}
                exchangeRate={marketData.exchange?.rate || 1400}
                totalNetWorth={totalNetWorth}
                isWatchlisted={selectedAsset ? myStocks.some(s => s.ticker === selectedAsset.assetSymbol) : false}
                onToggleWatchlist={handleToggleWatchlist}
                priceData={selectedAsset ? marketPrices?.stockPrices?.[selectedAsset.assetSymbol?.toUpperCase() || ''] : undefined}
                stockAlias={selectedAsset ? stockAliases[selectedAsset.assetSymbol || ''] : undefined}
                onAliasUpdate={handleAliasUpdate}
            />

            {/* Total Analysis Sheet (Always rendered for exit animation) */}
            <AssetGrowthDetailSheetV2
                isOpen={isTotalDetailOpen}
                onClose={() => setIsTotalDetailOpen(false)}
                assets={displayAssets}
                marketPrices={marketPrices || { usdKrw: 1400, goldUsd: 2600, stockPrices: {} }}
                totalNetWorth={totalNetWorth}
            />

            {/* Asset Entry Sheet V2 */}
            <AssetEntrySheetV2
                isOpen={isAssetEntryOpen}
                onClose={() => {
                    setIsAssetEntryOpen(false);
                    setPrefilledSymbol(undefined);
                    setEditingEntry(null);
                    setEntryType('stock'); // Reset
                }}
                initialSymbol={prefilledSymbol}
                editingEntry={editingEntry}
                type={entryType}
            />

            <BackupRestoreSheet
                isOpen={isBackupRestoreOpen}
                onClose={() => setIsBackupRestoreOpen(false)}
                backups={backups}
                onRestore={handleRestore}
            />

            <SettingsSheetV2
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                stockAliases={stockAliases}
                onAliasUpdate={handleAliasUpdate}
            />
            <DividendDetailSheetV2
                isOpen={isDividendDetailOpen}
                onClose={() => setIsDividendDetailOpen(false)}
                monthlyData={dividendData.monthlyData}
                annualTotal={dividendData.annualTotal}
            />
        </div>
    );
}
