"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";

export function LanguageToggle() {
    const { language, toggleLanguage } = useLanguage();

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Toggle Language"
        >
            <Globe className="w-4 h-4" />
            <span className="uppercase">{language}</span>
        </button>
    );
}
