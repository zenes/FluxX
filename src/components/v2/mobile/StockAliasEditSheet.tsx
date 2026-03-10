'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2, Save, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { upsertStockAlias, deleteStockAlias } from '@/lib/stock-alias-actions';
import V2ConfirmModal from './V2ConfirmModal';

interface StockAliasEditSheetProps {
    isOpen: boolean;
    onClose: () => void;
    ticker: string;
    initialAlias: string;
    onUpdate: (ticker: string, alias: string) => void;
}

export default function StockAliasEditSheet({
    isOpen,
    onClose,
    ticker,
    initialAlias,
    onUpdate
}: StockAliasEditSheetProps) {
    const [alias, setAlias] = useState(initialAlias);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [errorModal, setErrorModal] = useState<{ isOpen: boolean; title: string; message: string } | null>(null);

    useEffect(() => {
        if (isOpen) {
            setAlias(initialAlias);
            setStatus('idle');
        }
    }, [isOpen, initialAlias]);

    const handleSave = async () => {
        const trimmedAlias = alias.trim();
        setIsSubmitting(true);
        setStatus('idle');
        try {
            await upsertStockAlias(ticker, trimmedAlias);
            onUpdate(ticker, trimmedAlias);
            setStatus('success');
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error) {
            console.error(error);
            setStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!initialAlias) return;
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        setShowDeleteConfirm(false);
        setIsSubmitting(true);
        try {
            await deleteStockAlias(ticker);
            onUpdate(ticker, '');
            setAlias('');
            onClose();
        } catch (error) {
            console.error(error);
            setErrorModal({
                isOpen: true,
                title: '삭제 실패',
                message: '별명 삭제 중 오류가 발생했습니다.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 h-auto rounded-t-[32px] bg-white dark:bg-[#1C1C21] p-0 overflow-hidden shadow-2xl z-[210] flex flex-col"
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">종목 별명 관리</h3>
                                    <p className="text-sm text-zinc-400 font-bold">{ticker} • 나만 볼 수 있는 이름</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-400"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">별명 입력</label>
                                    <input
                                        type="text"
                                        placeholder="예: 애플 주식, 테슬라 본주 등"
                                        value={alias}
                                        onChange={(e) => setAlias(e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/10 rounded-2xl px-5 py-4 text-base font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-[#38C798] transition-all"
                                        autoFocus
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    {initialAlias && (
                                        <button
                                            onClick={handleDelete}
                                            disabled={isSubmitting}
                                            className="h-14 px-6 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
                                        >
                                            <Trash2 className="size-5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={handleSave}
                                        disabled={isSubmitting || (alias === initialAlias && initialAlias !== '')}
                                        className={cn(
                                            "flex-1 h-14 rounded-2xl font-black text-white active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50",
                                            status === 'success' ? "bg-[#38C798]" : "bg-zinc-900 dark:bg-white dark:text-zinc-900"
                                        )}
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="size-5 animate-spin" />
                                        ) : status === 'success' ? (
                                            <>
                                                <Check className="size-5" />
                                                <span>저장됨</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="size-5" />
                                                <span>별명 저장하기</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="h-6 shrink-0" /> {/* Extra space for safe area */}
                    <V2ConfirmModal
                        isOpen={showDeleteConfirm}
                        onClose={() => setShowDeleteConfirm(false)}
                        onConfirm={confirmDelete}
                        title="별명 삭제"
                        message={`"${ticker}" 종목의 별명을 삭제하시겠습니까?`}
                        type="danger"
                        confirmText="삭제"
                    />
                    <V2ConfirmModal
                        isOpen={!!errorModal?.isOpen}
                        onClose={() => setErrorModal(null)}
                        title={errorModal?.title || ''}
                        message={errorModal?.message || ''}
                        type="danger"
                        confirmText="확인"
                    />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
