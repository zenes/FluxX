'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ClientSettingsDashboard from '@/app/v2/settings/ClientSettingsDashboard';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { cn } from '@/lib/utils';

interface SettingsSheetV2Props {
    isOpen: boolean;
    onClose: () => void;
    stockAliases?: Record<string, string>;
    onAliasUpdate?: (ticker: string, alias: string) => void;
}

export default function SettingsSheetV2({ isOpen, onClose, stockAliases, onAliasUpdate }: SettingsSheetV2Props) {
    const { theme } = useUserPreferences();
    const [userData, setUserData] = useState<{
        userImage: string | null;
        userEmail: string;
        userRole: string;
        predefinedAccounts: any[];
        stockAliases: any[];
    } | null>(null);

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchUserData = async () => {
                setIsLoading(true);
                try {
                    // Fetch user and accounts data (since this is client-side rendered inside a sheet)
                    const res = await fetch('/api/user/settings-data');
                    if (res.ok) {
                        const data = await res.json();
                        setUserData(data);
                    }
                } catch (error) {
                    console.error("Failed to load settings data", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchUserData();
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={cn(
                        "fixed inset-0 z-[200] overflow-y-auto transition-colors duration-300",
                        theme === 'LIGHT' ? "bg-[#edf0f4]" : "bg-black"
                    )}
                >
                    {isLoading || !userData ? (
                        <div className={cn(
                            "flex items-center justify-center h-full transition-colors duration-300",
                            theme === 'LIGHT' ? "bg-[#edf0f4]" : "bg-black"
                        )}>
                            <div className="w-8 h-8 border-2 border-zinc-600 border-t-white dark:border-t-white rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <ClientSettingsDashboard
                            userImage={userData.userImage}
                            userEmail={userData.userEmail}
                            userRole={userData.userRole}
                            predefinedAccounts={userData.predefinedAccounts}
                            initialStockAliases={userData.stockAliases}
                            onClose={onClose}
                            onAliasUpdate={onAliasUpdate}
                        />
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
