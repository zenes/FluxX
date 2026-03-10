'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface V2ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'danger' | 'info' | 'success';
}

export default function V2ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = '확인',
    cancelText = '취소',
    type = 'warning'
}: V2ConfirmModalProps) {
    if (!isOpen) return null;

    const isAlertOnly = !onConfirm;

    const getIcon = () => {
        switch (type) {
            case 'danger': return <AlertCircle className="text-[#FF453A]" size={24} />;
            case 'success': return <CheckCircle2 className="text-[#32D74B]" size={24} />;
            case 'info': return <Info className="text-[#0A84FF]" size={24} />;
            default: return <AlertCircle className="text-[#FFD60A]" size={24} />;
        }
    };

    const getConfirmButtonStyles = () => {
        switch (type) {
            case 'danger': return "bg-[#FF453A] text-white";
            case 'success': return "bg-[#32D74B] text-white";
            case 'info': return "bg-[#0A84FF] text-white";
            default: return "bg-white text-black";
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-[320px] bg-[#1C1C1E] border border-white/10 rounded-[24px] overflow-hidden shadow-2xl"
                    >
                        <div className="p-6 flex flex-col items-center text-center">
                            <div className="mb-4 p-3 rounded-full bg-white/5">
                                {getIcon()}
                            </div>
                            
                            <h3 className="text-[19px] font-bold text-white mb-2 tracking-tight">
                                {title}
                            </h3>
                            
                            <p className="text-[15px] text-[#8E8E93] leading-relaxed mb-6 whitespace-pre-wrap">
                                {message}
                            </p>

                            <div className={cn(
                                "grid w-full gap-3",
                                isAlertOnly ? "grid-cols-1" : "grid-cols-2"
                            )}>
                                {!isAlertOnly && (
                                    <button
                                        onClick={onClose}
                                        className="py-3.5 px-4 rounded-[16px] bg-white/5 text-white font-bold text-[15px] active:bg-white/10 transition-colors"
                                    >
                                        {cancelText}
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        if (onConfirm) onConfirm();
                                        else onClose();
                                    }}
                                    className={cn(
                                        "py-3.5 px-4 rounded-[16px] font-bold text-[15px] active:opacity-80 transition-all",
                                        getConfirmButtonStyles()
                                    )}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
