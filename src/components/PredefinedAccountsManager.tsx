'use client';

import { useState } from 'react';
import { addPredefinedAccount, deletePredefinedAccount, editPredefinedAccount } from '@/lib/actions';
import { Plus, Trash2, Building2, UserCircle2, Hash, Pencil, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

type Account = {
    id: string;
    alias: string;
    broker: string;
    accountNumber: string;
    owner: string;
};

export default function PredefinedAccountsManager({ initialAccounts }: { initialAccounts: Account[] }) {
    const { t } = useLanguage();
    const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const router = useRouter();

    const [formData, setFormData] = useState({
        alias: '',
        broker: '',
        accountNumber: '',
        owner: ''
    });

    const resetForm = () => {
        setFormData({ alias: '', broker: '', accountNumber: '', owner: '' });
        setEditId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            if (editId) {
                const updatedAccount = await editPredefinedAccount(editId, formData);
                if (updatedAccount) {
                    setAccounts(accounts.map(a => a.id === editId ? updatedAccount : a));
                    resetForm();
                    router.refresh();
                }
            } else {
                const newAccount = await addPredefinedAccount(formData);
                if (newAccount) {
                    setAccounts([newAccount, ...accounts]);
                    resetForm();
                    router.refresh();
                }
            }
        } catch (error) {
            console.error(error);
            alert(`Failed to ${editId ? 'update' : 'add'} account`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (account: Account) => {
        setEditId(account.id);
        setFormData({
            alias: account.alias,
            broker: account.broker,
            accountNumber: account.accountNumber,
            owner: account.owner
        });
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this preset?')) return;
        try {
            await deletePredefinedAccount(id);
            setAccounts(accounts.filter(a => a.id !== id));
            if (editId === id) resetForm();
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Failed to delete account');
        }
    };

    return (
        <div className="flex flex-col w-full">
            <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide">
                    {accounts.length} Saved {t('settings.account_presets')}
                </span>
            </div>

            <form onSubmit={handleSubmit} className={`mb-6 rounded-[14px] overflow-hidden transition-colors ${editId ? 'bg-[#1C1C1E] border border-[#0A84FF]/50 ring-1 ring-[#0A84FF]/20' : 'bg-[#1C1C1E]'}`}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#38383A] bg-[#2C2C2E]/50">
                    <span className="text-[15px] font-semibold tracking-tight text-white">
                        {editId ? t('settings.edit_preset') : t('settings.add_new_preset')}
                    </span>
                    {editId && (
                        <button
                            type="button"
                            onClick={resetForm}
                            className="text-[15px] font-medium text-white active:opacity-70 transition-opacity flex items-center gap-1"
                        >
                            <X size={10} /> Cancel Edit
                        </button>
                    )}
                </div>

                <div className="flex flex-col divide-y divide-[#38383A]">
                    <div className="flex items-center px-4 py-3">
                        <label className="text-[16px] text-white w-28 shrink-0">{t('settings.alias_label')}</label>
                        <input
                            required
                            type="text"
                            value={formData.alias}
                            onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                            className="flex-1 text-[16px] text-white bg-transparent outline-none placeholder:text-[#8E8E93]"
                            placeholder={t('settings.alias_placeholder')}
                        />
                    </div>
                    <div className="flex items-center px-4 py-3">
                        <label className="text-[16px] text-white w-28 shrink-0">{t('settings.broker_label')}</label>
                        <input
                            required
                            type="text"
                            value={formData.broker}
                            onChange={(e) => setFormData({ ...formData, broker: e.target.value })}
                            className="flex-1 text-[16px] text-white bg-transparent outline-none placeholder:text-[#8E8E93]"
                            placeholder={t('settings.broker_placeholder')}
                        />
                    </div>
                    <div className="flex items-center px-4 py-3">
                        <label className="text-[16px] text-white w-28 shrink-0">{t('settings.account_number_label')}</label>
                        <input
                            required
                            type="text"
                            value={formData.accountNumber}
                            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                            className="flex-1 text-[16px] text-white bg-transparent outline-none placeholder:text-[#8E8E93] font-mono"
                            placeholder={t('settings.account_number_placeholder')}
                        />
                    </div>
                    <div className="flex items-center px-4 py-3">
                        <label className="text-[16px] text-white w-28 shrink-0">{t('settings.owner_label')}</label>
                        <input
                            required
                            type="text"
                            value={formData.owner}
                            onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                            className="flex-1 text-[16px] text-white bg-transparent outline-none placeholder:text-[#8E8E93]"
                            placeholder={t('settings.owner_placeholder')}
                        />
                    </div>
                </div>

                <div className="flex justify-end p-3 bg-[#2C2C2E]/30 border-t border-[#38383A]">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center justify-center rounded-[8px] text-[15px] font-semibold bg-[#0A84FF] text-white active:bg-[#0A84FF]/80 py-2 px-5 transition-colors disabled:opacity-50 gap-2"
                    >
                        {isSubmitting ? (
                            <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin"></span>
                        ) : (
                            editId ? <Pencil size={16} /> : <Plus size={16} />
                        )}
                        {editId ? t('settings.update_preset') : t('settings.add_preset')}
                    </button>
                </div>
            </form>

            <div className="flex flex-col rounded-[14px] overflow-hidden bg-[#1C1C1E] divide-y divide-[#38383A]">
                {accounts.length === 0 ? (
                    <div className="text-center py-8 text-[#8E8E93] text-[15px] flex flex-col items-center gap-2">
                        <Building2 size={32} className="opacity-30 mb-1" />
                        {t('settings.no_presets_saved')}
                    </div>
                ) : (
                    accounts.map(account => (
                        <div key={account.id} className={`flex items-center justify-between py-3 px-4 transition-colors ${editId === account.id ? 'bg-[#2C2C2E]' : ''}`}>
                            <div className="flex flex-col gap-1 w-full">
                                <div className="flex items-center justify-between w-full">
                                    <span className="text-[17px] tracking-tight text-white flex items-center gap-2">
                                        {account.alias}
                                        {editId === account.id && <span className="text-[11px] bg-[#0A84FF]/20 text-[#0A84FF] px-2 py-0.5 rounded-full font-semibold">Editing</span>}
                                    </span>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleEditClick(account)}
                                            className="text-white active:opacity-70 transition-opacity p-1"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(account.id)}
                                            className="text-white active:opacity-70 transition-opacity p-1"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-[#8E8E93] mt-0.5">
                                    <span>{account.broker}</span>
                                    <span className="w-1 h-1 rounded-full bg-[#8E8E93]/50"></span>
                                    <span>{account.owner}</span>
                                    <span className="w-1 h-1 rounded-full bg-[#8E8E93]/50"></span>
                                    <span className="font-mono">{account.accountNumber}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
