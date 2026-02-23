"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent/30 hover:bg-accent/50 border border-border/50 transition-colors"
            aria-label="Toggle theme"
        >
            <Sun className="h-5 w-5 text-yellow-500 transition-all scale-100 rotate-0 dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 text-blue-400 transition-all scale-0 rotate-90 dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </button>
    );
}
