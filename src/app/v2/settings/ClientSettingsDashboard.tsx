'use client';

import { useState } from 'react';
import { Download, Trash2, ShieldAlert, Loader2, User, Mail, Shield, ChevronRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import ProfilePictureUpload from '@/components/ProfilePictureUpload';
import PredefinedAccountsManager from '@/components/PredefinedAccountsManager';
import { useLanguage } from '@/contexts/LanguageContext';

interface ClientSettingsDashboardProps {
    userImage?: string | null;
    userEmail: string;
    userRole: string;
    predefinedAccounts: any[];
    onClose?: () => void;
}

export default function ClientSettingsDashboard({
    userImage,
    userEmail,
    userRole,
    predefinedAccounts,
    onClose,
}: ClientSettingsDashboardProps) {
    const { t } = useLanguage();
    const [isExporting, setIsExporting] = useState(false);

    const handleExportCSV = async () => {
        // ... (unchanged logic)
        try {
            setIsExporting(true);
            const response = await fetch('/api/export/csv');

            if (!response.ok) {
                throw new Error('Export failed');
            }

            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `fluxx-export-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
            if (contentDisposition && contentDisposition.includes('filename="')) {
                const match = contentDisposition.match(/filename="([^"]+)"/);
                if (match && match[1]) filename = match[1];
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error exporting CSV:', error);
            alert(t('common.error') || 'Export failed. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-black text-white pb-24 font-sans selection:bg-primary/30">
            {/* iOS Style Navigation Header */}
            <header className="relative flex items-center justify-center px-4 py-4 bg-black">
                {onClose ? (
                    <button onClick={onClose} className="absolute left-4 w-8 h-8 flex items-center justify-center bg-[#2C2C2E] rounded-full active:opacity-70 transition-opacity">
                        <ChevronLeft size={20} className="text-white" />
                    </button>
                ) : (
                    <Link href="/" className="absolute left-4 w-8 h-8 flex items-center justify-center bg-[#2C2C2E] rounded-full active:opacity-70 transition-opacity">
                        <ChevronLeft size={20} className="text-white" />
                    </Link>
                )}
                <h1 className="text-[17px] font-semibold tracking-tight text-white">{t('settings.user_profile') || 'Apple 계정'}</h1>
            </header>

            <main className="flex-1 w-full max-w-2xl mx-auto space-y-8 mt-2">

                {/* iOS Style Profile Header */}
                <section className="flex flex-col items-center pt-2 pb-2">
                    <ProfilePictureUpload
                        currentImage={userImage}
                        userEmail={userEmail}
                        variant="ios"
                    />
                    <h2 className="text-[28px] font-bold mt-3 tracking-tight text-white leading-tight">
                        {userEmail.split('@')[0]}
                    </h2>
                    <p className="text-[15px] text-[#98989E] mt-0.5">
                        {userEmail}
                    </p>
                </section>

                {/* Profile Information List (iOS style) */}
                <section className="px-4">
                    <div className="bg-[#1C1C1E] rounded-[14px] overflow-hidden divide-y divide-[#38383A] mx-auto w-full">
                        {/* Role Row */}
                        <div className="flex items-center justify-between px-4 py-3 active:bg-[#2C2C2E] transition-colors cursor-pointer select-none">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-[#8E8E93]/20 rounded-[8px] flex items-center justify-center w-8 h-8">
                                    <Shield size={18} className="text-[#E5E5EA]" />
                                </div>
                                <span className="text-[17px] text-white tracking-tight">{t('settings.role')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[16px] text-[#8E8E93] capitalize mr-1">{userRole}</span>
                                <ChevronRight size={18} className="text-[#38383A]" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Predefined Accounts Section */}
                <section className="px-4">
                    <div className="bg-[#1C1C1E] rounded-[14px] overflow-hidden divide-y divide-[#38383A] mx-auto w-full">
                        <div className="px-4 py-3 border-b border-[#38383A]">
                            <h2 className="text-[17px] tracking-tight text-white flex items-center gap-2">
                                {t('settings.accounts')}
                            </h2>
                        </div>
                        <div className="p-0 sm:p-5">
                            <PredefinedAccountsManager initialAccounts={predefinedAccounts} />
                        </div>
                    </div>
                </section>

                {/* Danger Zone Section */}
                <section className="px-4">
                    <div className="bg-[#1C1C1E] rounded-[14px] overflow-hidden divide-y divide-[#38383A] mx-auto w-full">
                        <div className="px-4 py-3 border-b border-[#38383A]">
                            <h2 className="text-[17px] tracking-tight text-[#FF453A] flex items-center gap-2">
                                <ShieldAlert size={18} />
                                {t('settings.danger_zone')}
                            </h2>
                        </div>

                        <div className="p-4 space-y-4">
                            <p className="text-[13px] text-[#8E8E93] leading-relaxed">
                                {t('settings.danger_zone_desc')}
                            </p>

                            <div className="flex flex-col gap-0 divide-y divide-[#38383A] bg-[#2C2C2E] rounded-[10px] overflow-hidden">
                                <button
                                    onClick={handleExportCSV}
                                    disabled={isExporting}
                                    className="w-full flex items-center justify-between px-4 py-3.5 active:bg-[#3A3A3C] transition-colors disabled:opacity-50 group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-[#0A84FF] rounded-[8px] flex items-center justify-center w-8 h-8">
                                            {isExporting ? <Loader2 size={18} className="text-white animate-spin" /> : <Download size={18} className="text-white" />}
                                        </div>
                                        <span className="text-[17px] text-white tracking-tight">{isExporting ? t('common.loading') || 'EXPORTING...' : t('settings.export_csv')}</span>
                                    </div>
                                    <ChevronRight size={18} className="text-[#38383A]" />
                                </button>

                                <button className="w-full flex items-center justify-between px-4 py-3.5 active:bg-[#3A3A3C] transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-[#FF453A] rounded-[8px] flex items-center justify-center w-8 h-8">
                                            <Trash2 size={18} className="text-white" />
                                        </div>
                                        <span className="text-[17px] text-[#FF453A] tracking-tight">{t('settings.reset_assets')}</span>
                                    </div>
                                    <ChevronRight size={18} className="text-[#38383A]" />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
