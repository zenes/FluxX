'use client';

import React, { useState, useEffect } from 'react';
import { AssetItem, addStockEntry, getPredefinedAccounts } from '@/lib/actions';
import { koreanNameMap } from '@/lib/koreanNameMap';
import { cn } from '@/lib/utils';
import { useDebounce } from 'use-debounce';
import {
    Search,
    Building2,
    User,
    Hash,
    Coins,
    Calculator,
    Calendar,
    Check,
    Loader2,
    X
} from 'lucide-react';

interface StockEntryFormV2Props {
    onSuccess: () => void;
    initialSymbol?: string;
}

export default function StockEntryFormV2({ onSuccess, initialSymbol }: StockEntryFormV2Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery] = useDebounce(searchQuery, 500);
    const [searchResults, setSearchResults] = useState<any[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        tickerSymbol: initialSymbol || '',
        brokerName: '',
        accountOwner: '',
        accountNumber: '',
        quantity: '',
        totalPurchaseAmount: '',
        currency: 'KRW',
        predefinedAccountId: '',
        dividendPerShare: '',
        dividendFrequency: '4', // Default to quarterly
        dividendMonths: '',
        initialMemo: ''
    });

    const [selectedName, setSelectedName] = useState('');

    useEffect(() => {
        const fetchAccounts = async () => {
            const data = await getPredefinedAccounts();
            setAccounts(data);
        };
        fetchAccounts();

        if (initialSymbol) {
            setSelectedName(koreanNameMap[initialSymbol] || initialSymbol);
        }
    }, [initialSymbol]);

    useEffect(() => {
        const fetchTickers = async () => {
            if (debouncedQuery.length < 2) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
                const data = await res.json();
                setSearchResults(data.results || []);
            } catch (e) {
                console.error(e);
            } finally {
                setIsSearching(false);
            }
        };

        fetchTickers();
    }, [debouncedQuery]);

    const handleSelectTicker = (ticker: string, name: string) => {
        setFormData(prev => ({
            ...prev,
            tickerSymbol: ticker,
            currency: ticker.endsWith('.KS') || ticker.endsWith('.KQ') ? 'KRW' : 'USD'
        }));
        setSelectedName(koreanNameMap[ticker] || name || ticker);
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleAccountSelect = (accountId: string) => {
        const account = accounts.find(a => a.id === accountId);
        if (account) {
            setFormData(prev => ({
                ...prev,
                predefinedAccountId: account.id,
                brokerName: account.broker,
                accountOwner: account.owner,
                accountNumber: account.accountNumber
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.tickerSymbol || !formData.quantity || !formData.totalPurchaseAmount) {
            alert('필수 정보를 모두 입력해주세요.');
            return;
        }

        setIsLoading(true);
        try {
            await addStockEntry({
                ...formData,
                quantity: parseFloat(formData.quantity.replace(/,/g, '')),
                totalPurchaseAmount: parseFloat(formData.totalPurchaseAmount.replace(/,/g, '')),
                dividendPerShare: formData.dividendPerShare ? parseFloat(formData.dividendPerShare) : undefined,
                dividendFrequency: parseInt(formData.dividendFrequency)
            });
            onSuccess();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* 1. Ticker Selection Section */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">종목 선택</h3>
                    {formData.tickerSymbol && (
                        <span className="text-[10px] font-bold text-[#38C798] bg-[#38C798]/10 px-2 py-0.5 rounded-full uppercase tracking-tight">
                            {formData.currency} Selected
                        </span>
                    )}
                </div>

                {!formData.tickerSymbol ? (
                    <div className="relative">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-400 group-focus-within:text-[#38C798] transition-colors" />
                            <input
                                type="text"
                                placeholder="종목명 또는 티커 입력 (예: 삼성전자, AAPL)"
                                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white dark:bg-white/5 border border-zinc-100 dark:border-white/10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#38C798]/20 focus:border-[#38C798] transition-all shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {isSearching && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <Loader2 className="size-4 text-zinc-300 animate-spin" />
                                </div>
                            )}
                        </div>

                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-100 dark:border-white/10 shadow-2xl z-50 max-h-64 overflow-y-auto custom-scrollbar">
                                {searchResults.map((result: any) => (
                                    <button
                                        key={result.symbol}
                                        type="button"
                                        onClick={() => handleSelectTicker(result.symbol, result.shortname || result.longName)}
                                        className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors text-left"
                                    >
                                        <div>
                                            <p className="text-[14px] font-bold text-zinc-900 dark:text-white uppercase">{result.symbol}</p>
                                            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-tight">{result.shortname || result.longName}</p>
                                        </div>
                                        <div className="text-[10px] font-black text-zinc-300 bg-zinc-50 dark:bg-white/5 px-2 py-0.5 rounded-md uppercase">
                                            {result.exchange}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/5 border border-[#38C798] shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl bg-[#38C798] flex items-center justify-center text-white font-black text-xs">
                                {formData.tickerSymbol.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-[15px] font-black text-zinc-900 dark:text-white uppercase">{formData.tickerSymbol}</p>
                                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-tight">{selectedName}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleSelectTicker('', '')}
                            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 transition-colors"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                )}
            </section>

            {/* 2. Account Selection Section */}
            <section className="space-y-4">
                <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest px-1">계좌 정보</h3>

                {accounts.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                        {accounts.map(acc => {
                            const isSelected = formData.predefinedAccountId === acc.id;
                            return (
                                <button
                                    key={acc.id}
                                    type="button"
                                    onClick={() => handleAccountSelect(acc.id)}
                                    className={cn(
                                        "shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl border active:scale-95 transition-all text-left",
                                        isSelected
                                            ? "bg-[#38C798] border-[#38C798] shadow-lg shadow-[#38C798]/20"
                                            : "bg-white dark:bg-white/5 border-zinc-100 dark:border-white/5"
                                    )}
                                >
                                    <Building2 className={cn(
                                        "size-3.5",
                                        isSelected ? "text-white" : "text-zinc-400"
                                    )} />
                                    <span className={cn(
                                        "text-[12px] font-black",
                                        isSelected ? "text-white" : "text-zinc-600 dark:text-zinc-300"
                                    )}>
                                        {acc.alias}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                    <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-300" />
                        <input
                            type="text"
                            placeholder="증권사 명 (사후 수정 가능)"
                            className="w-full h-12 pl-12 pr-4 rounded-xl bg-zinc-50 dark:bg-white/5 border-none text-[13px] font-bold focus:ring-2 focus:ring-[#38C798]/20 transition-all placeholder:text-zinc-400"
                            value={formData.brokerName}
                            onChange={(e) => setFormData(prev => ({ ...prev, brokerName: e.target.value }))}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-300" />
                            <input
                                type="text"
                                placeholder="소유자"
                                className="w-full h-12 pl-12 pr-4 rounded-xl bg-zinc-50 dark:bg-white/5 border-none text-[13px] font-bold focus:ring-2 focus:ring-[#38C798]/20 transition-all placeholder:text-zinc-400"
                                value={formData.accountOwner}
                                onChange={(e) => setFormData(prev => ({ ...prev, accountOwner: e.target.value }))}
                            />
                        </div>
                        <div className="relative">
                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-300" />
                            <input
                                type="text"
                                placeholder="계좌번호 (선택)"
                                className="w-full h-12 pl-12 pr-4 rounded-xl bg-zinc-50 dark:bg-white/5 border-none text-[13px] font-bold focus:ring-2 focus:ring-[#38C798]/20 transition-all placeholder:text-zinc-400"
                                value={formData.accountNumber}
                                onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Transaction Details Section */}
            <section className="space-y-4">
                <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest px-1">매수 상세 내역</h3>
                <div className="bg-zinc-50 dark:bg-white/5 rounded-[28px] p-6 space-y-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 space-y-1.5">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter ml-1">매수 수량</label>
                            <div className="relative group">
                                <Calculator className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-300" />
                                <input
                                    type="text"
                                    placeholder="0"
                                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-white dark:bg-zinc-800 border-none text-[15px] font-black focus:ring-2 focus:ring-[#38C798]/20 transition-all"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="flex-1 space-y-1.5">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter ml-1">총 매수 금액 ({formData.currency})</label>
                            <div className="relative group">
                                <Coins className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-300" />
                                <input
                                    type="text"
                                    placeholder="0"
                                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-white dark:bg-zinc-800 border-none text-[15px] font-black focus:ring-2 focus:ring-[#38C798]/20 transition-all"
                                    value={formData.totalPurchaseAmount}
                                    onChange={(e) => setFormData(prev => ({ ...prev, totalPurchaseAmount: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">배당 설정 (선택)</span>
                            <div className="h-px flex-1 bg-zinc-200 dark:bg-white/5" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="relative">
                                <Calculator className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-300" />
                                <input
                                    type="number"
                                    step="0.001"
                                    placeholder="주당 배당금"
                                    className="w-full h-11 pl-12 pr-4 rounded-xl bg-white dark:bg-zinc-800 border-none text-[13px] font-bold focus:ring-2 focus:ring-[#38C798]/20 outline-none transition-all"
                                    value={formData.dividendPerShare}
                                    onChange={(e) => setFormData(prev => ({ ...prev, dividendPerShare: e.target.value }))}
                                />
                            </div>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-300" />
                                <select
                                    className="w-full h-11 pl-12 pr-4 rounded-xl bg-white dark:bg-zinc-800 border-none text-[13px] font-bold focus:ring-2 focus:ring-[#38C798]/20 outline-none transition-all appearance-none"
                                    value={formData.dividendFrequency}
                                    onChange={(e) => setFormData(prev => ({ ...prev, dividendFrequency: e.target.value }))}
                                >
                                    <option value="1">연배당 (1회)</option>
                                    <option value="2">반기배당 (2회)</option>
                                    <option value="4">분기배당 (4회)</option>
                                    <option value="12">월배당 (12회)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Form Footer */}
            <div className="pt-4 pb-4">
                <button
                    type="submit"
                    disabled={isLoading || !formData.tickerSymbol || !formData.quantity}
                    className={cn(
                        "w-full h-16 rounded-[24px] flex items-center justify-center gap-2 text-base font-black transition-all active:scale-[0.98]",
                        isLoading || !formData.tickerSymbol || !formData.quantity
                            ? "bg-zinc-100 dark:bg-white/5 text-zinc-400 cursor-not-allowed"
                            : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl shadow-zinc-900/10 dark:shadow-white/5"
                    )}
                >
                    {isLoading ? (
                        <Loader2 className="size-5 animate-spin" />
                    ) : (
                        <>
                            <Check className="size-5" />
                            <span>자산 등록하기</span>
                        </>
                    )}
                </button>
                <p className="text-center mt-4 text-[11px] font-bold text-zinc-400 uppercase tracking-tighter">
                    등록 시 모든 데이터는 암호화되어 안전하게 보관됩니다
                </p>
            </div>
        </form>
    );
}
