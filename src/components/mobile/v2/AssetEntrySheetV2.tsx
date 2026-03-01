'use client';

import React from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Plus, X } from 'lucide-react';
import StockEntryFormV2 from '@/components/StockEntryFormV2';
import OtherAssetEntryFormV2 from '@/components/OtherAssetEntryFormV2';
import { useRouter } from 'next/navigation';

interface AssetEntrySheetV2Props {
    isOpen: boolean;
    onClose: () => void;
    initialSymbol?: string;
    type?: 'stock' | 'other';
}

export default function AssetEntrySheetV2({ isOpen, onClose, initialSymbol, type = 'stock' }: AssetEntrySheetV2Props) {
    const router = useRouter();

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent
                side="bottom"
                className="h-[92vh] rounded-t-[32px] bg-[#edf0f4] dark:bg-[#0D0D0E] border-none px-0 pb-0 overflow-hidden flex flex-col [&>button]:hidden"
            >
                {/* Custom Header Area */}
                <div className="px-6 pt-6 pb-2 flex items-center justify-between shrink-0 relative">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center">
                            <Plus className="size-5 text-white dark:text-zinc-900" />
                        </div>
                        <div>
                            <SheetTitle className="text-xl font-black text-zinc-900 dark:text-white tracking-tight uppercase">
                                자산 추가
                            </SheetTitle>
                            <SheetDescription className="text-xs font-bold text-zinc-400 uppercase tracking-tighter">
                                새로운 투자 자산 등록
                            </SheetDescription>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-white dark:bg-zinc-800 shadow-sm border border-zinc-100 dark:border-white/5 flex items-center justify-center text-zinc-500 dark:text-zinc-400 transition-all active:scale-95"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Form Content Area */}
                <div className="flex-1 overflow-y-auto px-6 pb-10 mt-4 custom-scrollbar">
                    {type === 'stock' ? (
                        <StockEntryFormV2
                            initialSymbol={initialSymbol}
                            onSuccess={() => {
                                onClose();
                                router.refresh();
                            }}
                        />
                    ) : (
                        <OtherAssetEntryFormV2
                            onSuccess={() => {
                                onClose();
                                router.refresh();
                            }}
                        />
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
