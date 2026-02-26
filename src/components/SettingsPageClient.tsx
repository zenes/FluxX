'use client';

import { Download, Trash2, ShieldAlert } from 'lucide-react';
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
                                <button className="flex-1 flex items-center justify-center gap-2 text-xs font-bold tracking-widest text-foreground bg-secondary hover:bg-secondary/80 px-4 py-3 rounded-md uppercase transition-colors">
                                    <Download size={14} /> {t('settings.export_csv')}
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
