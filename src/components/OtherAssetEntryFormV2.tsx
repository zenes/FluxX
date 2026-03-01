'use client';

import React, { useState } from 'react';
import { upsertAsset } from '@/lib/actions';
import { cn } from '@/lib/utils';
import {
    Plus,
    Check,
    Loader2,
    Coins,
    Banknote,
    BadgeDollarSign,
    Gamepad2
} from 'lucide-react';

interface OtherAssetEntryFormV2Props {
    onSuccess: () => void;
}

export default function OtherAssetEntryFormV2({ onSuccess }: OtherAssetEntryFormV2Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [assetType, setAssetType] = useState('krw');
    const [amount, setAmount] = useState('');

    const assetOptions = [
        { id: 'krw', label: '원화 (KRW)', icon: Banknote },
        { id: 'usd', label: '달러 (USD)', icon: BadgeDollarSign },
        { id: 'gold', label: '금 (Gold/g)', icon: Coins },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount.replace(/,/g, ''));
        if (isNaN(numericAmount) || numericAmount < 0) {
            alert('유효한 금액을 입력해주세요.');
            return;
        }

        setIsLoading(true);
        try {
            await upsertAsset(assetType, numericAmount);
            onSuccess();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <section className="space-y-4">
                <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest px-1">자산 유형 선택</h3>
                <div className="grid grid-cols-1 gap-2">
                    {assetOptions.map((opt) => {
                        const Icon = opt.icon;
                        const isSelected = assetType === opt.id;
                        return (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => setAssetType(opt.id)}
                                className={cn(
                                    "w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98]",
                                    isSelected
                                        ? "bg-white dark:bg-white/5 border-[#38C798] shadow-sm"
                                        : "bg-zinc-50 dark:bg-white/5 border-transparent opacity-60"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "size-10 rounded-xl flex items-center justify-center transition-colors",
                                        isSelected ? "bg-[#38C798] text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
                                    )}>
                                        <Icon className="size-5" />
                                    </div>
                                    <span className={cn(
                                        "text-sm font-black",
                                        isSelected ? "text-zinc-900 dark:text-white" : "text-zinc-500"
                                    )}>{opt.label}</span>
                                </div>
                                {isSelected && <Check className="size-4 text-[#38C798]" />}
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className="space-y-4">
                <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest px-1">보유량 입력</h3>
                <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-zinc-100 dark:border-white/10 shadow-sm relative group focus-within:border-[#38C798] transition-all">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter block mb-2">보유 수량 / 금액</label>
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            inputMode="decimal"
                            autoFocus
                            placeholder="0"
                            className="flex-1 bg-transparent border-none text-2xl font-black text-zinc-900 dark:text-white outline-none placeholder:text-zinc-200 dark:placeholder:text-zinc-800"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <span className="text-xl font-black text-zinc-300 uppercase">
                            {assetType === 'gold' ? 'g' : assetType.toUpperCase()}
                        </span>
                    </div>
                </div>
            </section>

            <div className="pt-4">
                <button
                    type="submit"
                    disabled={isLoading || !amount}
                    className={cn(
                        "w-full h-16 rounded-[24px] flex items-center justify-center gap-2 text-base font-black transition-all active:scale-[0.98]",
                        isLoading || !amount
                            ? "bg-zinc-100 dark:bg-white/5 text-zinc-400 cursor-not-allowed"
                            : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl"
                    )}
                >
                    {isLoading ? (
                        <Loader2 className="size-5 animate-spin" />
                    ) : (
                        <>
                            <Plus className="size-5" />
                            <span>현금성 자산 등록</span>
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
