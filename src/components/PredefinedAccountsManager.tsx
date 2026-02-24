'use client';

import { useState } from 'react';
import { addPredefinedAccount, deletePredefinedAccount, editPredefinedAccount } from '@/lib/actions';
import { Plus, Trash2, Building2, UserCircle2, Hash, Pencil, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Account = {
    id: string;
    alias: string;
    broker: string;
    accountNumber: string;
    owner: string;
};

export default function PredefinedAccountsManager({ initialAccounts }: { initialAccounts: Account[] }) {
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
        <div className="bg-card border border-input rounded-md p-6 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-primary rounded-sm"></span> Account Presets
                </h3>
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded-sm">
                    {accounts.length} Saved
                </span>
            </div>

            <form onSubmit={handleSubmit} className={`space-y-4 mb-8 p-4 rounded-md border transition-colors ${editId ? 'bg-primary/5 border-primary/30' : 'bg-muted/20 border-border/50'}`}>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                        {editId ? 'Editing Account Preset' : 'Add New Account Preset'}
                    </span>
                    {editId && (
                        <button
                            type="button"
                            onClick={resetForm}
                            className="text-[10px] font-bold uppercase text-destructive hover:underline flex items-center gap-1"
                        >
                            <X size={10} /> Cancel Edit
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Alias (e.g. Main Trading)</label>
                        <input
                            required
                            type="text"
                            value={formData.alias}
                            onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                            className="flex h-9 text-xs w-full rounded-sm border border-input bg-transparent px-3 py-1 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            placeholder="Alias name"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Broker</label>
                        <input
                            required
                            type="text"
                            value={formData.broker}
                            onChange={(e) => setFormData({ ...formData, broker: e.target.value })}
                            className="flex h-9 text-xs w-full rounded-sm border border-input bg-transparent px-3 py-1 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            placeholder="e.g. Kiwoom"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Account Number</label>
                        <input
                            required
                            type="text"
                            value={formData.accountNumber}
                            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                            className="flex h-9 text-xs font-mono w-full rounded-sm border border-input bg-transparent px-3 py-1 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            placeholder="123-456-***"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Owner</label>
                        <input
                            required
                            type="text"
                            value={formData.owner}
                            onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                            className="flex h-9 text-xs w-full rounded-sm border border-input bg-transparent px-3 py-1 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            placeholder="Owner name"
                        />
                    </div>
                </div>
                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-sm text-xs font-bold tracking-widest uppercase bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-6 transition-colors shadow-sm disabled:opacity-50 gap-2"
                    >
                        {isSubmitting ? (
                            <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin"></span>
                        ) : (
                            editId ? <Pencil size={16} /> : <Plus size={16} />
                        )}
                        {editId ? 'Update Preset' : 'Add Preset'}
                    </button>
                </div>
            </form>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {accounts.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground font-mono text-xs opacity-50 flex flex-col items-center gap-2 border border-dashed rounded-md border-border/50">
                        <Building2 size={24} className="opacity-20" />
                        No account presets saved.
                    </div>
                ) : (
                    accounts.map(account => (
                        <div key={account.id} className={`group flex items-center justify-between p-3 rounded-md border bg-card transition-all shadow-sm ${editId === account.id ? 'border-primary ring-1 ring-primary/20' : 'border-input hover:border-primary/30'}`}>
                            <div className="flex flex-col gap-1.5">
                                <span className="text-sm font-bold tracking-tight text-primary flex items-center gap-2">
                                    {account.alias}
                                    {editId === account.id && <span className="text-[8px] bg-primary text-primary-foreground px-1 py-0.5 rounded-full uppercase tracking-tighter">Editing</span>}
                                </span>
                                <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-muted-foreground">
                                    <span className="flex items-center gap-1"><Building2 size={12} /> {account.broker}</span>
                                    <span className="flex items-center gap-1"><UserCircle2 size={12} /> {account.owner}</span>
                                    <span className="flex items-center gap-1"><Hash size={12} /> {account.accountNumber}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleEditClick(account)}
                                    className={`p-2 rounded-sm transition-colors ${editId === account.id ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/5 opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
                                    title="Edit Preset"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(account.id)}
                                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-sm transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    title="Delete Preset"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
