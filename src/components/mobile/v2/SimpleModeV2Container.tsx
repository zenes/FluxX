'use client';

import React, { useState, useEffect } from 'react';
import DiscoveryTags from './DiscoveryTags';
import SimpleModeV2Card from './SimpleModeV2Card';
import NewsSectionV2 from './NewsSectionV2';
import { AssetItem } from '@/lib/actions';
import { cn } from '@/lib/utils';

interface SimpleModeV2ContainerProps {
    assets: AssetItem[];
    marketData: {
        exchange: { rate: number } | null;
        gold: { price: number } | null;
    };
}

import { motion, useAnimation, useMotionValue, animate } from 'framer-motion';

export default function SimpleModeV2Container({ assets, marketData }: SimpleModeV2ContainerProps) {
    const [activeTag, setActiveTag] = useState('all');
    const [items, setItems] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const dragX = useMotionValue(0);

    const fallbackAssets: AssetItem[] = [
        { id: 'dummy-1', assetType: 'stock', amount: 10, assetSymbol: 'AAPL', avgPrice: 150, currency: 'USD' },
        { id: 'dummy-2', assetType: 'stock', amount: 5, assetSymbol: 'TSLA', avgPrice: 200, currency: 'USD' }
    ];
    const displayAssets = assets.length > 0 ? assets : fallbackAssets;
    const stockAssets = displayAssets.filter(a => a.assetType === 'stock');

    useEffect(() => {
        const initialIds = ['total', ...stockAssets.map(s => (s.id?.toString() || ''))].filter(id => id !== '');
        setItems(initialIds);
    }, [assets]);

    const handleDragEnd = (event: any, info: any) => {
        const width = window.innerWidth;
        const velocity = info.velocity.x;
        const offset = info.offset.x;

        // 2/3 threshold (약 66.6%)
        const threshold = width * (2 / 3);

        let targetPage = currentPage;

        // 1. 빠른 제스처 처리 (Inertia/Flick)
        if (Math.abs(velocity) > 500) {
            if (velocity < 0 && currentPage === 0) targetPage = 1;
            else if (velocity > 0 && currentPage === 1) targetPage = 0;
        }
        // 2. 느린 드래그 시 임계값 처리
        else {
            if (offset < -threshold && currentPage === 0) targetPage = 1;
            else if (offset > threshold && currentPage === 1) targetPage = 0;
        }

        setCurrentPage(targetPage);

        // 명시적으로 애니메이션을 실행하여 중간에 멈추는 현상 방지
        const targetX = targetPage === 0 ? 0 : -width;
        animate(dragX, targetX, {
            type: "spring",
            stiffness: 300,
            damping: 30,
            mass: 0.8,
            velocity: velocity // 드래그하던 속도를 전달하여 부드러운 전환
        });
    };

    return (
        <div className="overflow-hidden min-h-screen relative" ref={containerRef}>
            <motion.div
                className="flex"
                drag="x"
                dragConstraints={containerRef}
                dragElastic={0.1}
                dragMomentum={false} // 중간에 멈추지 않도록 관성 애니메이션 비활성화 (수동 제어)
                onDragEnd={handleDragEnd}
                style={{ x: dragX, width: '200%' }}
            >
                {/* Page 1: Dashboard */}
                <div
                    className={cn(
                        "w-[100vw] shrink-0 px-4 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] pb-24",
                        currentPage !== 0 && "pointer-events-none"
                    )}
                >
                    <header className="mb-6">
                        <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                            <span className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs px-2 py-0.5 rounded-md">#0</span>
                            FluxX V2
                        </h1>
                        <p className="text-sm text-zinc-400 font-medium">ETFCheck 스타일의 프리미엄 대시보드</p>
                    </header>

                    <div className="space-y-4 mt-2">
                        {items.filter(id => id === 'total').map((id) => (
                            <SimpleModeV2Card
                                key="total"
                                id="total"
                                initialAssets={displayAssets}
                                initialExchange={marketData.exchange || undefined}
                                initialGold={marketData.gold || undefined}
                            />
                        ))}
                    </div>

                    <div className="mt-4">
                        <div className="bg-white dark:bg-[#1A1A1E] rounded-[24px] p-2 shadow-sm border border-zinc-100 dark:border-white/5">
                            <DiscoveryTags activeTag={activeTag} onTagChange={setActiveTag} />
                        </div>
                    </div>

                    <NewsSectionV2 />
                </div>

                {/* Page 2: Analytics / Market Detail */}
                <div
                    className={cn(
                        "w-[100vw] shrink-0 px-4 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] pb-24",
                        currentPage !== 1 && "pointer-events-none"
                    )}
                >
                    <header className="mb-6">
                        <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                            <span className="bg-[#38C798] text-white text-xs px-2 py-0.5 rounded-md">#P2</span>
                            시장 인사이트
                        </h1>
                        <p className="text-sm text-zinc-400 font-medium">실시간 시장 지표와 분석 데이터</p>
                    </header>

                    <div className="space-y-4">
                        <div className="bg-white dark:bg-[#1A1A1E] rounded-[32px] p-6 shadow-sm border border-zinc-100 dark:border-white/5 h-48 flex items-center justify-center">
                            <p className="text-zinc-400 font-bold">인기 종목 차트 준비 중...</p>
                        </div>
                        <div className="bg-white dark:bg-[#1A1A1E] rounded-[32px] p-6 shadow-sm border border-zinc-100 dark:border-white/5 h-64 flex items-center justify-center">
                            <p className="text-zinc-400 font-bold">섹터별 흐름 분석 준비 중...</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Page Indicator */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex gap-2 z-50">
                <div className={cn("size-2 rounded-full transition-all", currentPage === 0 ? "bg-[#38C798] w-4" : "bg-zinc-300")} />
                <div className={cn("size-2 rounded-full transition-all", currentPage === 1 ? "bg-[#38C798] w-4" : "bg-zinc-300")} />
            </div>
        </div>
    );
}
