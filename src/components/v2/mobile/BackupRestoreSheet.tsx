'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, X, ChevronRight, Clock, HardDrive, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackupFile {
    name: string;
    createdAt: Date;
    size: number;
}

interface BackupRestoreSheetProps {
    isOpen: boolean;
    onClose: () => void;
    backups: BackupFile[];
    onRestore: (filename: string) => Promise<void>;
}

export default function BackupRestoreSheet({
    isOpen,
    onClose,
    backups,
    onRestore
}: BackupRestoreSheetProps) {
    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('ko-KR', {
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(new Date(date));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1C1C1E] rounded-t-[32px] z-[101] max-h-[85vh] overflow-hidden flex flex-col"
                    >
                        {/* Handle */}
                        <div className="w-12 h-1.5 bg-zinc-200 dark:bg-white/10 rounded-full mx-auto mt-3 mb-2" />

                        {/* Header */}
                        <header className="px-6 py-4 flex items-center justify-between border-b border-zinc-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500">
                                    <Database className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-zinc-900 dark:text-white">데이터 복구</h2>
                                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest leading-none mt-1">
                                        Restore from Backup
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 active:scale-95 transition-transform"
                            >
                                <X className="size-5" />
                            </button>
                        </header>

                        {/* Info Warning */}
                        <div className="px-6 py-4 bg-amber-50 dark:bg-amber-500/5 border-b border-amber-100 dark:border-amber-500/10">
                            <div className="flex gap-3">
                                <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
                                <div className="flex flex-col gap-1">
                                    <span className="text-[13px] font-bold text-amber-900 dark:text-amber-200">주의사항</span>
                                    <p className="text-[12px] text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                                        백업 파일을 선택하면 현재 데이터가 모두 사라지고 해당 시점으로 복구됩니다.
                                        중요한 데이터가 있다면 미리 백업을 수행해 주세요.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {backups.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                                    <div className="size-16 rounded-3xl bg-zinc-50 dark:bg-white/5 flex items-center justify-center mb-4">
                                        <Clock className="size-8 text-zinc-200 dark:text-zinc-800" />
                                    </div>
                                    <p className="text-zinc-400 font-bold text-sm">저장된 백업 파일이 없습니다.</p>
                                </div>
                            ) : (
                                backups.map((file, idx) => (
                                    <button
                                        key={file.name}
                                        onClick={() => onRestore(file.name)}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 active:scale-[0.98] transition-all group border border-transparent hover:border-blue-500/20"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center shadow-sm">
                                                <HardDrive className="size-6 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                                            </div>
                                            <div className="flex flex-col items-start gap-0.5 text-left">
                                                <span className="text-[15px] font-bold text-zinc-900 dark:text-white tracking-tight">
                                                    {formatDate(file.createdAt)}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                                                        {file.name}
                                                    </span>
                                                    <span className="text-[11px] text-zinc-300 dark:text-zinc-600">•</span>
                                                    <span className="text-[11px] font-black text-zinc-400 uppercase">
                                                        {formatSize(file.size)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight className="size-5 text-zinc-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Footer Spacer */}
                        <div className="h-8 shrink-0" />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
