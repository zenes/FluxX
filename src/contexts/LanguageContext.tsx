"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { en } from '@/translations/en';
import { ko } from '@/translations/ko';

type Language = 'en' | 'ko';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    toggleLanguage: () => void;
    t: (keyPath: string, variables?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');
    const [isLoaded, setIsLoaded] = useState(false);

    // Load language preference from local storage on mount
    useEffect(() => {
        const savedLanguage = localStorage.getItem('app-language') as Language;
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ko')) {
            setLanguage(savedLanguage);
        } else {
            // Check browser preference
            const browserLang = navigator.language;
            if (browserLang.toLowerCase().includes('ko')) {
                setLanguage('ko');
            }
        }
        setIsLoaded(true);
    }, []);

    // Save language preference when changed
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('app-language', language);
        }
    }, [language, isLoaded]);

    const toggleLanguage = () => {
        setLanguage(prev => (prev === 'en' ? 'ko' : 'en'));
    };

    const t = (keyPath: string, variables?: Record<string, string | number>): string => {
        const dict: any = language === 'ko' ? ko : en;
        const fallbackDict: any = en; // Fallback to English if key missing in Korean

        const keys = keyPath.split('.');

        // Try primary dictionary
        let value = dict;
        for (const key of keys) {
            if (value && value[key] !== undefined) {
                value = value[key];
            } else {
                value = undefined;
                break;
            }
        }

        let resultString = value !== undefined ? (value as string) : undefined;

        // Try fallback dictionary if not found
        if (resultString === undefined) {
            let fallbackValue = fallbackDict;
            for (const key of keys) {
                if (fallbackValue && fallbackValue[key] !== undefined) {
                    fallbackValue = fallbackValue[key];
                } else {
                    return keyPath; // Return the key path itself if neither dictionary has it
                }
            }
            resultString = fallbackValue as string;
        }

        // Replace variables if provided
        if (variables && resultString) {
            Object.keys(variables).forEach(varKey => {
                const regex = new RegExp(`{{${varKey}}}`, 'g');
                resultString = resultString!.replace(regex, String(variables[varKey]));
            });
        }

        return resultString || keyPath;
    };

    // Prevent hydration mismatch by returning null until loaded, or just rendering with default
    // To avoid layout shift, we render but client-side hydration might override text.
    // Given we use context, the entire tree will re-render anyway.

    return (
        <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
