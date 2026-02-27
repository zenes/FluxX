'use client';

import React, { useState, useEffect } from 'react';
import { Reorder } from 'framer-motion';
import SimpleModeCard from './SimpleModeCard';
import { AssetItem } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

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

    const stockAssets = assets.filter(a => a.assetType === 'stock');
    const storageKey = 'fluxx-simple-mode-order';

    // 초기 순서 설정 및 로드
    useEffect(() => {
        const savedOrder = localStorage.getItem(storageKey);
        const initialIds = ['total', ...stockAssets.map(s => (s.id?.toString() || ''))].filter(id => id !== '');

        if (savedOrder) {
            try {
                const parsedOrder = JSON.parse(savedOrder) as string[];
                // 현재 존재하는 자산들만 필터링 (삭제된 자산이나 신규 자산 대응)
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

    const handleReorder = (newOrder: string[]) => {
        setItems(newOrder);
        localStorage.setItem(storageKey, JSON.stringify(newOrder));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">심플 모드</h1>
                    <p className="text-muted-foreground text-sm">보유 자산을 심플한 카드로 확인하세요.</p>
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

            {stockAssets.length === 0 && (
                <p className="text-center text-zinc-400 py-10 text-sm font-medium">
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
