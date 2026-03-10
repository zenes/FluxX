'use client';

import { useState, useEffect } from 'react';
import { Pencil, Trash2, Tag, ChevronDown, ChevronUp, Save, X, RotateCcw, Loader2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { upsertStockAlias, deleteStockAlias } from '@/lib/stock-alias-actions';
import { cn } from '@/lib/utils';
import V2ConfirmModal from './V2ConfirmModal';

type StockAlias = {
    id: string;
    ticker: string;
    alias: string;
};

interface StockAliasManagerProps {
    initialAliases: StockAlias[];
    onUpdate?: (ticker: string, alias: string) => void;
}

export default function StockAliasManager({ initialAliases, onUpdate }: StockAliasManagerProps) {
    const { t } = useLanguage();
    const [aliases, setAliases] = useState<StockAlias[]>(initialAliases);
    const [isExpanded, setIsExpanded] = useState(false);
    const [editingTicker, setEditingTicker] = useState<string | null>(null);
    const [formData, setFormData] = useState({ ticker: '', alias: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'warning' | 'danger' | 'info' | 'success';
        confirmText?: string;
        onConfirm?: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'warning'
    });
    const router = useRouter();

    const displayAliases = isExpanded ? aliases : aliases.slice(0, 4);
    const hasMore = aliases.length > 4;

    useEffect(() => {
        setAliases(initialAliases);
    }, [initialAliases]);

    const resetForm = () => {
        setFormData({ ticker: '', alias: '' });
        setEditingTicker(null);
    };

    const handleEditClick = (item: StockAlias) => {
        setEditingTicker(item.ticker);
        setFormData({ ticker: item.ticker, alias: item.alias });
        // Scroll to form if needed, or just let users see it
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const normalizedTicker = formData.ticker.trim().toUpperCase();
        const normalizedAlias = formData.alias.trim();

        // Check for duplicates if we are ADDING (not editing)
        if (!editingTicker && aliases.some(a => a.ticker === normalizedTicker)) {
            setModalConfig({
                isOpen: true,
                title: '중복된 종목',
                message: '이미 해당 종목에 대한 별명이 존재합니다.\n기존 별명을 수정해 주세요.',
                type: 'warning',
                confirmText: '확인'
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await upsertStockAlias(normalizedTicker, normalizedAlias);
            const updatedAliases = editingTicker 
                ? aliases.map(a => a.ticker === normalizedTicker ? { ...a, alias: normalizedAlias } : a)
                : [{ id: Date.now().toString(), ticker: normalizedTicker, alias: normalizedAlias }, ...aliases];
            
            setAliases(updatedAliases);
            onUpdate?.(normalizedTicker, normalizedAlias);
            resetForm();
            router.refresh();
        } catch (error) {
            console.error(error);
            setModalConfig({
                isOpen: true,
                title: '저장 실패',
                message: '별명 저장 중 오류가 발생했습니다.',
                type: 'danger',
                confirmText: '확인'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (ticker: string) => {
        setModalConfig({
            isOpen: true,
            title: '별명 삭제',
            message: `"${ticker}" 종목의 별명을 삭제하시겠습니까?`,
            type: 'danger',
            confirmText: '삭제',
            onConfirm: async () => {
                setModalConfig(prev => ({ ...prev, isOpen: false }));
                setIsSubmitting(true);
                try {
                    await deleteStockAlias(ticker);
                    setAliases(aliases.filter(a => a.ticker !== ticker));
                    onUpdate?.(ticker, '');
                    if (editingTicker === ticker) resetForm();
                    router.refresh();
                } catch (error) {
                    console.error(error);
                    setModalConfig({
                        isOpen: true,
                        title: '삭제 실패',
                        message: '별명 삭제 중 오류가 발생했습니다.',
                        type: 'danger',
                        confirmText: '확인'
                    });
                } finally {
                    setIsSubmitting(false);
                }
            }
        });
    };

    return (
        <div className="flex flex-col w-full">
            <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide">
                    {aliases.length} 저장된 별명
                </span>
            </div>

            {/* Edit / Add Form */}
            <form onSubmit={handleSubmit} className={cn(
                "mb-6 rounded-[14px] overflow-hidden transition-all duration-300",
                editingTicker ? "bg-[#1C1C1E] border border-[#38C798]/50 ring-1 ring-[#38C798]/20" : "bg-[#1C1C1E]"
            )}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#38383A] bg-[#2C2C2E]/50">
                    <span className="text-[15px] font-semibold tracking-tight text-white">
                        {editingTicker ? '별명 수정' : '새 별명 추가'}
                    </span>
                    {editingTicker && (
                        <button
                            type="button"
                            onClick={resetForm}
                            className="text-[13px] font-medium text-[#8E8E93] active:opacity-70 transition-opacity flex items-center gap-1"
                        >
                            <X size={14} /> 취소
                        </button>
                    )}
                </div>

                <div className="flex flex-col divide-y divide-[#38383A]">
                    <div className="flex items-center px-4 py-3">
                        <label className="text-[15px] text-[#8E8E93] w-24 shrink-0">티커/종목</label>
                        <input
                            required
                            type="text"
                            disabled={!!editingTicker} // Cannot change ticker when editing
                            value={formData.ticker}
                            onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
                            className="flex-1 text-[16px] text-white bg-transparent outline-none placeholder:text-[#38383A] uppercase font-bold"
                            placeholder="예: AAPL, 005930"
                        />
                    </div>
                    <div className="flex items-center px-4 py-3">
                        <label className="text-[15px] text-[#8E8E93] w-24 shrink-0">별명</label>
                        <input
                            required
                            type="text"
                            value={formData.alias}
                            onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                            className="flex-1 text-[16px] text-white bg-transparent outline-none placeholder:text-[#38383A]"
                            placeholder="사용할 이름 입력"
                        />
                    </div>
                </div>

                <div className="flex justify-end p-3 bg-[#2C2C2E]/30 border-t border-[#38383A]">
                    <button
                        type="submit"
                        disabled={isSubmitting || !formData.ticker || !formData.alias}
                        className={cn(
                            "flex items-center justify-center rounded-[10px] text-[15px] font-bold py-2 px-5 transition-all active:scale-95 disabled:opacity-50 gap-2",
                            editingTicker ? "bg-[#38C798] text-white" : "bg-white text-black"
                        )}
                    >
                        {isSubmitting ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            editingTicker ? <Save size={16} /> : <Plus size={16} />
                        )}
                        {editingTicker ? '저장하기' : '추가하기'}
                    </button>
                </div>
            </form>

            <div className="flex flex-col rounded-[14px] overflow-hidden bg-[#1C1C1E] divide-y divide-[#38383A]">
                {aliases.length === 0 ? (
                    <div className="text-center py-8 text-[#8E8E93] text-[15px] flex flex-col items-center gap-2">
                        <Tag size={32} className="opacity-10 mb-1" />
                        저장된 별명이 없습니다.
                    </div>
                ) : (
                    <>
                        {displayAliases.map(item => (
                            <div key={item.id} className={cn(
                                "flex items-center justify-between py-3.5 px-4 transition-colors",
                                editingTicker === item.ticker && "bg-[#2C2C2E]"
                            )}>
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[17px] font-bold text-white leading-tight">
                                            {item.alias}
                                        </span>
                                        {editingTicker === item.ticker && (
                                            <span className="text-[10px] bg-[#38C798]/20 text-[#38C798] px-1.5 py-0.5 rounded-md font-black uppercase">Editing</span>
                                        )}
                                    </div>
                                    <span className="text-[13px] font-bold text-[#8E8E93] tracking-tight uppercase">
                                        {item.ticker}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleEditClick(item)}
                                        className="p-2 text-[#8E8E93] hover:text-white active:bg-white/5 rounded-full transition-colors"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.ticker)}
                                        className="p-2 text-[#8E8E93] hover:text-[#FF453A] active:bg-red-500/5 rounded-full transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </>
                )}
                
                {hasMore && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full py-4 text-[14px] font-bold text-[#0A84FF] active:bg-white/5 transition-colors flex items-center justify-center gap-1"
                    >
                        {isExpanded ? (
                            <>숨기기 <ChevronUp size={16} /></>
                        ) : (
                            <>더보기 ({aliases.length - 4}개 더 있음) <ChevronDown size={16} /></>
                        )}
                    </button>
                )}
            </div>
            <V2ConfirmModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                confirmText={modalConfig.confirmText}
            />
        </div>
    );
}

