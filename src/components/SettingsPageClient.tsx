'use client';

import { useState } from 'react';
import { Download, Trash2, ShieldAlert, Loader2 } from 'lucide-react';
import ProfilePictureUpload from '@/components/ProfilePictureUpload';
import PredefinedAccountsManager from '@/components/PredefinedAccountsManager';
import { useLanguage } from '@/contexts/LanguageContext';

interface SettingsPageClientProps {
    userImage?: string | null;
    userEmail: string;
    userRole: string;
    predefinedAccounts: any[];
}

export default function SettingsPageClient({
    userImage,
    userEmail,
    userRole,
    predefinedAccounts,
}: SettingsPageClientProps) {
    const { t } = useLanguage();
    const [isExporting, setIsExporting] = useState(false);

    const handleExportCSV = async () => {
        try {
            setIsExporting(true);
            const response = await fetch('/api/export/csv');

            if (!response.ok) {
                throw new Error('Export failed');
            }

            // Get the filename from the Content-Disposition header if possible
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
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tighter text-primary">{t('settings.title')}</h2>
                    <p className="text-muted-foreground font-mono text-sm mt-1 uppercase tracking-widest">
                        {t('settings.subtitle')}
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* 1. Profile & Preferences */}
                <div className="space-y-6">
                    <div className="bg-card border border-input rounded-md p-6 shadow-sm">
                        <h3 className="text-lg font-bold mb-4 tracking-tight flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-primary rounded-sm"></span>
                            {t('settings.user_profile')}
                        </h3>
                        <div className="flex flex-col gap-2 font-mono text-sm">
                            <ProfilePictureUpload
                                currentImage={userImage}
                                userEmail={userEmail}
                            />

                            <div className="flex justify-between items-center py-4 border-b border-border/50 mt-2">
                                <span className="text-muted-foreground uppercase opacity-70">Email</span>
                                <span className="font-medium">{userEmail}</span>
                            </div>
                            <div className="flex justify-between items-center py-4 border-b border-border/50">
                                <span className="text-muted-foreground uppercase opacity-70">Role</span>
                                <span className="font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-sm">{userRole}</span>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-card border border-destructive/20 rounded-md p-6 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <ShieldAlert size={120} className="text-destructive" />
                        </div>
                        <h3 className="text-lg font-bold mb-4 tracking-tight flex items-center gap-2 text-destructive">
                            <span className="w-1.5 h-4 bg-destructive rounded-sm"></span>
                            {t('settings.danger_zone')}
                        </h3>
                        <div className="flex flex-col gap-4 relative z-10">
                            <p className="text-xs text-muted-foreground font-mono">
                                {t('settings.danger_zone_desc')}
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={handleExportCSV}
                                    disabled={isExporting}
                                    className="flex-1 flex items-center justify-center gap-2 text-xs font-bold tracking-widest text-foreground bg-secondary hover:bg-secondary/80 px-4 py-3 rounded-md uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                    {isExporting ? t('common.loading') || 'EXPORTING...' : t('settings.export_csv')}
                                </button>
                                <button className="flex-1 flex items-center justify-center gap-2 text-xs font-bold tracking-widest text-destructive bg-destructive/10 border border-destructive/20 hover:bg-destructive hover:text-destructive-foreground px-4 py-3 rounded-md uppercase transition-colors">
                                    <Trash2 size={14} /> {t('settings.reset_assets')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Predefined Accounts */}
                <div>
                    <PredefinedAccountsManager initialAccounts={predefinedAccounts} />
                </div>
            </div>
        </div>
    );
}
