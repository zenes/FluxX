"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { updateUserPreferences } from '@/lib/actions';

export type AppTheme = 'LIGHT' | 'DARK' | 'BLACK';
export type StockColorMode = 'KOREA' | 'WESTERN';

interface UserPreferencesContextType {
    theme: AppTheme;
    stockColorMode: StockColorMode;
    toggleTheme: () => void;
    setTheme: (theme: AppTheme) => void;
    setStockColorMode: (mode: StockColorMode) => void;
    getUpColor: () => string;
    getDownColor: () => string;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export function UserPreferencesProvider({ 
    children, 
    initialTheme = 'DARK', 
    initialStockColorMode = 'KOREA' 
}: { 
    children: ReactNode,
    initialTheme?: AppTheme,
    initialStockColorMode?: StockColorMode
}) {
    const [theme, setThemeState] = useState<AppTheme>(initialTheme);
    const [stockColorMode, setStockColorModeState] = useState<StockColorMode>(initialStockColorMode);

    // Initial sync from localStorage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('app-theme') as AppTheme;
        if (savedTheme && savedTheme !== theme) {
            setThemeState(savedTheme);
        }
    }, []);

    // Sync theme with document class for Tailwind dark mode
    useEffect(() => {
        const html = document.documentElement;
        if (theme === 'LIGHT') {
            html.classList.remove('dark');
            html.classList.remove('theme-black');
        } else if (theme === 'BLACK') {
            html.classList.add('dark');
            html.classList.add('theme-black');
        } else {
            html.classList.add('dark');
            html.classList.remove('theme-black');
        }
    }, [theme]);

    const setTheme = async (newTheme: AppTheme) => {
        setThemeState(newTheme);
        localStorage.setItem('app-theme', newTheme);
        try {
            await updateUserPreferences({ appTheme: newTheme });
        } catch (e) {
            console.error("Failed to sync theme preference:", e);
        }
    };

    const toggleTheme = () => {
        const nextTheme = theme === 'LIGHT' ? 'DARK' : 'LIGHT';
        setTheme(nextTheme);
    };

    const setStockColorMode = async (mode: StockColorMode) => {
        setStockColorModeState(mode);
        try {
            await updateUserPreferences({ stockColorMode: mode });
        } catch (e) {
            console.error("Failed to sync stock color mode preference:", e);
        }
    };

    const getUpColor = () => {
        return stockColorMode === 'KOREA' ? '#FF3B2F' : '#34C759';
    };

    const getDownColor = () => {
        return stockColorMode === 'KOREA' ? '#34C759' : '#FF3B2F';
    };

    return (
        <UserPreferencesContext.Provider value={{ 
            theme, 
            stockColorMode, 
            toggleTheme, 
            setTheme, 
            setStockColorMode,
            getUpColor,
            getDownColor
        }}>
            {children}
        </UserPreferencesContext.Provider>
    );
}

export function useUserPreferences() {
    const context = useContext(UserPreferencesContext);
    if (context === undefined) {
        throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
    }
    return context;
}
