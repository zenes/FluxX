"use client";

import * as React from "react";
import { Moon, Sun, Terminal, StickyNote } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="w-10 h-10" />;
    }

    const cycleTheme = () => {
        if (theme === "light") setTheme("dark");
        else if (theme === "dark") setTheme("paper");
        else if (theme === "paper") setTheme("cyber");
        else setTheme("light");
    };

    return (
        <button
            onClick={cycleTheme}
            className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent/30 hover:bg-accent/50 border border-border/50 transition-colors"
            aria-label="Toggle theme"
        >
            <Sun className={`h-5 w-5 text-yellow-500 transition-all ${theme === "light" ? "scale-100 rotate-0" : "scale-0 rotate-90"}`} />
            <Moon className={`absolute h-5 w-5 text-blue-400 transition-all ${theme === "dark" ? "scale-100 rotate-0" : "scale-0 rotate-90"}`} />
            <StickyNote className={`absolute h-5 w-5 text-stone-500 transition-all ${theme === "paper" ? "scale-100 rotate-0" : "scale-0 rotate-90"}`} />
            <Terminal className={`absolute h-5 w-5 text-magenta-500 transition-all ${theme === "cyber" ? "scale-100 rotate-0" : "scale-0 rotate-90"}`} />
            <span className="sr-only">Toggle theme</span>
        </button>
    );
}
