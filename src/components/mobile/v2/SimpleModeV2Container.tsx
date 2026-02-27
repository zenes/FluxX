'use client';

import React, { useState, useEffect } from 'react';
import MarketQuoteWidgetV2 from './MarketQuoteWidgetV2';
import SimpleModeV2Card from './SimpleModeV2Card';
import InvestmentNewsCardV2 from './InvestmentNewsCardV2';
import { AssetItem } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { motion, animate, useMotionValue } from 'framer-motion';
import { Wallet, PieChart, TrendingUp, Landmark } from 'lucide-react';
import V2AuthProfileIcon from './V2AuthProfileIcon';
import Link from 'next/link';
import { MarketAsset, INITIAL_STOCKS } from './typesV2';

interface SimpleModeV2ContainerProps {
    assets: AssetItem[];
    marketData: {
        exchange: { rate: number } | null;
        gold: { price: number } | null;
        accounts: any[];
    };
}

export default function SimpleModeV2Container({ assets, marketData }: SimpleModeV2ContainerProps) {
    const [activeTag, setActiveTag] = useState('all');
    const [currentPage, setCurrentPage] = useState(0);
    const [myStocks, setMyStocks] = useState<MarketAsset[]>(INITIAL_STOCKS);
    const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);

    // Persistence: Load stocks from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('v2-my-stocks');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setMyStocks(parsed);
                }
            } catch (e) {
                console.error("Failed to load v2-my-stocks from localStorage:", e);
            }
        }
    }, []);

    // Persistence: Save stocks to localStorage on change
    useEffect(() => {
        localStorage.setItem('v2-my-stocks', JSON.stringify(myStocks));
    }, [myStocks]);

    const containerRef = React.useRef<HTMLDivElement>(null);
    const dragX = useMotionValue(0);

    const displayAssets = assets && assets.length > 0 ? assets : [];

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
    const sortedAssets = mergedAssets.sort((a, b) => {
        const order: Record<string, number> = { krw: 1, usd: 2, gold: 3, stock: 4 };
        return (order[a.assetType] || 99) - (order[b.assetType] || 99);
    });

    const handleDragEnd = (event: any, info: any) => {
        const width = window.innerWidth;
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

        setCurrentPage(targetPage);

        const targetX = -targetPage * width;
        animate(dragX, targetX, {
            type: "spring",
            stiffness: 300,
            damping: 30,
            mass: 0.8,
            velocity: velocity
        });
    };

    const width = typeof window !== 'undefined' ? window.innerWidth : 390;

    useEffect(() => {
        const scrollContainer = document.querySelector('main');
        if (scrollContainer) {
            scrollContainer.scrollTo(0, 0);
        } else {
            window.scrollTo(0, 0);
        }
    }, [currentPage]);

    return (
        <div className="overflow-hidden min-h-screen relative bg-[#edf0f4] dark:bg-[#0D0D0E]" ref={containerRef}>
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
                        {/* Left: Menu Icon (2D, Soft Black) */}
                        <button className="p-2 -ml-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#2B364B] dark:text-white">
                                <line x1="4" y1="12" x2="20" y2="12"></line>
                                <line x1="4" y1="6" x2="20" y2="6"></line>
                                <line x1="4" y1="18" x2="20" y2="18"></line>
                            </svg>
                        </button>

                        {/* Right: Theme Toggle, Settings, Profile */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => {
                                    const html = document.documentElement;
                                    const isDark = html.classList.contains('dark');
                                    if (isDark) {
                                        html.classList.remove('dark');
                                        localStorage.setItem('theme', 'light');
                                    } else {
                                        html.classList.add('dark');
                                        localStorage.setItem('theme', 'dark');
                                    }
                                }}
                                className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <svg className="size-5 text-[#2B364B] dark:text-white dark:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                <svg className="size-5 text-[#2B364B] dark:text-white hidden dark:block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                            </button>
                            <Link href="/settings" className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                <svg className="size-5 text-[#2B364B] dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="3"></circle>
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                                </svg>
                            </Link>
                            <V2AuthProfileIcon />
                        </div>
                    </header>

                    <div className="space-y-4">
                        <SimpleModeV2Card
                            id="total"
                            initialAssets={displayAssets}
                            initialExchange={marketData.exchange || undefined}
                            initialGold={marketData.gold || undefined}
                        />

                        {/* New Stock Quotes Widget */}
                        <MarketQuoteWidgetV2
                            myStocks={myStocks}
                            setMyStocks={setMyStocks}
                            onModalToggle={setIsAnyModalOpen}
                        />
                        +
                        <InvestmentNewsCardV2
                            myStocks={myStocks}
                            onModalToggle={setIsAnyModalOpen}
                        />
                    </div>
                </div>

                {/* Page 2: Asset Detail List (KRW, USD, GOLD, STOCKS) */}
                <div className={cn("w-[100vw] shrink-0 px-4 pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] pb-24 transition-opacity duration-300", currentPage !== 1 && "opacity-40 pointer-events-none")}>
                    <header className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                                <span className="bg-[#38C798] text-white text-xs px-2 py-0.5 rounded-md">#02</span>
                                자산현황상세
                            </h1>
                            <p className="text-sm text-zinc-400 font-medium">전체 보유 자산 리스트</p>
                        </div>
                        <div className="size-10 rounded-full bg-white dark:bg-zinc-800 shadow-sm border border-zinc-100 dark:border-zinc-700 flex items-center justify-center">
                            <PieChart className="size-5 text-[#38C798]" />
                        </div>
                    </header>

                    <div className="space-y-3 pb-10">
                        {sortedAssets.length > 0 ? (
                            sortedAssets.map((asset, idx) => (
                                <SimpleModeV2Card
                                    key={asset.id || `asset-${idx}`}
                                    id={asset.id || idx}
                                    stockAsset={asset.assetType === 'stock' ? asset : undefined}
                                    assetItem={asset.assetType !== 'stock' ? asset : undefined}
                                    initialExchange={marketData.exchange || undefined}
                                    initialGold={marketData.gold || undefined}
                                />
                            ))
                        ) : (
                            <div className="py-20 text-center text-zinc-400 font-medium">보유 중인 자산이 없습니다.</div>
                        )}
                    </div>
                </div>

                {/* Page 3: Dividend Insights */}
                <div className={cn("w-[100vw] shrink-0 px-4 pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] pb-24 transition-opacity duration-300", currentPage !== 2 && "opacity-40 pointer-events-none")}>
                    <header className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                                <span className="bg-[#FF4F60] text-white text-xs px-2 py-0.5 rounded-md">#03</span>
                                배당 인사이트
                            </h1>
                            <p className="text-sm text-zinc-400 font-medium">월별 배당금 흐름 및 전망</p>
                        </div>
                        <div className="size-10 rounded-full bg-white dark:bg-zinc-800 shadow-sm border border-zinc-100 dark:border-zinc-700 flex items-center justify-center">
                            <TrendingUp className="size-5 text-[#FF4F60]" />
                        </div>
                    </header>

                    <div className="space-y-4">
                        <div className="bg-white dark:bg-[#1A1A1E] rounded-[24px] p-6 shadow-sm border border-zinc-100 dark:border-white/5">
                            <h3 className="text-zinc-400 text-sm font-bold mb-1">연간 예상 배당금</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-zinc-300">₩</span>
                                <span className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">0</span>
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
                                <span className="bg-[#2684FE] text-white text-xs px-2 py-0.5 rounded-md">#04</span>
                                계좌현황
                            </h1>
                            <p className="text-sm text-zinc-400 font-medium">연동된 증권 계좌 정보</p>
                        </div>
                        <div className="size-10 rounded-full bg-white dark:bg-zinc-800 shadow-sm border border-zinc-100 dark:border-zinc-700 flex items-center justify-center">
                            <Landmark className="size-5 text-[#2684FE]" />
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
                                ? idx === 0 ? "bg-zinc-900 dark:bg-white w-6" :
                                    idx === 1 ? "bg-[#38C798] w-6" :
                                        idx === 2 ? "bg-[#FF4F60] w-6" :
                                            "bg-[#2684FE] w-6"
                                : "bg-zinc-300 dark:bg-zinc-700"
                        )}
                    />
                ))}
            </div>
        </div>
    );
}
