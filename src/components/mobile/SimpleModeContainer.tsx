'use client';

import React, { useState, useEffect } from 'react';
import { Reorder } from 'framer-motion';
import SimpleModeCard, { BG_THEMES } from './SimpleModeCard';
import { AssetItem } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleModeContainerProps {
    assets: AssetItem[];
    marketData: {
        exchange: { rate: number } | null;
        gold: { price: number } | null;
    };
}

export default function SimpleModeContainer({ assets, marketData }: SimpleModeContainerProps) {
    const [isReorderMode, setIsReorderMode] = useState(false);
    const [items, setItems] = useState<string[]>([]);
    const [bgTheme, setBgTheme] = useState(BG_THEMES[0]);

    const stockAssets = assets.filter(a => a.assetType === 'stock');
    const storageKey = 'fluxx-simple-mode-order';
    const bgStorageKey = 'fluxx-simple-bg-theme';

    // 초기 순서 설정 및 자산 변경 대응
    useEffect(() => {
        const savedOrder = localStorage.getItem(storageKey);
        const initialIds = ['total', ...stockAssets.map(s => (s.id?.toString() || ''))].filter(id => id !== '');

        if (savedOrder) {
            try {
                const parsedOrder = JSON.parse(savedOrder) as string[];
                const validOrder = parsedOrder.filter(id => initialIds.includes(id));
                const missingIds = initialIds.filter(id => !validOrder.includes(id));
                setItems([...validOrder, ...missingIds]);
            } catch (e) {
                setItems(initialIds);
            }
        } else {
            setItems(initialIds);
        }
    }, [assets]);

    // 배경 테마 로드 및 실시간 변경 이벤트 리스너
    useEffect(() => {
        const savedBgTheme = localStorage.getItem(bgStorageKey);
        if (savedBgTheme) {
            const found = BG_THEMES.find(t => t.name === savedBgTheme);
            if (found) setBgTheme(found);
        }

        const handleThemeChange = (e: any) => {
            const found = BG_THEMES.find(t => t.name === e.detail.theme);
            if (found) setBgTheme(found);
        };

        window.addEventListener('fluxx-theme-change', handleThemeChange as EventListener);
        return () => window.removeEventListener('fluxx-theme-change', handleThemeChange as EventListener);
    }, []);

    const handleReorder = (newOrder: string[]) => {
        setItems(newOrder);
        localStorage.setItem(storageKey, JSON.stringify(newOrder));
    };

    const isDarkBg = bgTheme.name !== 'White Silk';

    return (
        <div
            className="fixed inset-0 overflow-y-auto transition-colors duration-700 ease-in-out px-4 pt-[calc(env(safe-area-inset-top,0px)+5rem)] pb-8"
            style={{ backgroundColor: bgTheme.hex }}
        >
            <div className="max-w-md mx-auto space-y-4 pb-40">
                <div className="flex items-center justify-between mb-6 px-1">
                    <div>
                        <h1 className={cn(
                            "text-2xl font-black tracking-tight transition-colors duration-700",
                            isDarkBg ? "text-white" : "text-zinc-900"
                        )}>심플 모드</h1>
                        <p className={cn(
                            "text-sm font-medium transition-colors duration-700",
                            isDarkBg ? "text-white/40" : "text-zinc-500"
                        )}>보유 자산을 심플한 카드로 확인하세요.</p>
                    </div>
                    {isReorderMode && (
                        <Button
                            size="sm"
                            onClick={() => setIsReorderMode(false)}
                            className="rounded-full gap-1.5 font-bold shadow-lg animate-in zoom-in duration-300"
                        >
                            <Check className="size-4" /> 완료
                        </Button>
                    )}
                </div>

                <Reorder.Group
                    axis="y"
                    values={items}
                    onReorder={handleReorder}
                    className="grid gap-4"
                >
                    {items.map((id) => {
                        if (id === 'total') {
                            return (
                                <Reorder.Item
                                    key="total"
                                    value="total"
                                    dragListener={isReorderMode}
                                >
                                    <SimpleModeCard
                                        id="total"
                                        initialAssets={assets}
                                        initialExchange={marketData.exchange || undefined}
                                        initialGold={marketData.gold || undefined}
                                        isReorderMode={isReorderMode}
                                        onLongPress={() => setIsReorderMode(true)}
                                    />
                                </Reorder.Item>
                            );
                        }

                        const stock = stockAssets.find(s => s.id?.toString() === id);
                        if (!stock) return null;

                        return (
                            <Reorder.Item
                                key={id}
                                value={id}
                                dragListener={isReorderMode}
                            >
                                <SimpleModeCard
                                    id={stock.id || id}
                                    stockAsset={stock}
                                    initialExchange={marketData.exchange || undefined}
                                    isReorderMode={isReorderMode}
                                    onLongPress={() => setIsReorderMode(true)}
                                />
                            </Reorder.Item>
                        );
                    })}
                </Reorder.Group>
            </div>

            {stockAssets.length === 0 && (
                <p className={cn(
                    "text-center py-10 text-sm font-medium transition-colors duration-700",
                    isDarkBg ? "text-white/20" : "text-zinc-300"
                )}>
                    표시할 주식 자산이 없습니다.
                </p>
            )}

            {isReorderMode && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full text-sm font-bold backdrop-blur-md shadow-2xl animate-in slide-in-from-bottom-10 duration-500 z-50">
                    카드를 드래그하여 순서를 변경하세요
                </div>
            )}

        </div>
    );
}
