"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, Activity, Zap, Menu, X, Coins } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import AuthButton from "./AuthButton";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Operations", href: "/operations", icon: Briefcase },
    { name: "Dividends", href: "/dividends", icon: Coins },
    { name: "Intelligence", href: "#", icon: Activity },
];

export function AppSidebar() {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Prevent hydration errors
    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    return (
        <>
            {/* Mobile Header (Visible only on sm and below) */}
            <div className="md:hidden flex h-14 items-center justify-between border-b bg-background px-4 sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-sm bg-primary text-primary-foreground font-bold text-xs shadow-md">
                        FX
                    </div>
                    <span className="text-sm font-semibold tracking-wide uppercase">FluxX</span>
                </div>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile Sliding Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 top-14 z-40 bg-background/95 backdrop-blur-sm animate-in slide-in-from-top-2">
                    <nav className="flex flex-col p-4 gap-2">
                        {NAV_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
                                        isActive ? "bg-muted text-foreground" : "text-muted-foreground"
                                    )}
                                >
                                    <Icon size={18} />
                                    {item.name}
                                </Link>
                            );
                        })}
                        <div className="mt-4 pt-4 border-t flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Session</span>
                            <div onClick={() => setIsMobileMenuOpen(false)}>
                                <AuthButton />
                            </div>
                        </div>
                    </nav>
                </div>
            )}

            {/* Desktop Sidebar (Visible on md and above) */}
            <aside className="hidden md:flex flex-col w-64 h-screen border-r bg-muted/20 sticky top-0 shrink-0">
                <div className="h-16 flex items-center gap-3 px-6 border-b">
                    <div className="flex size-8 items-center justify-center rounded-sm bg-primary text-primary-foreground font-bold text-sm shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                        <Zap size={16} />
                    </div>
                    <span className="text-sm font-bold tracking-widest text-foreground uppercase">FluxX Command</span>
                </div>

                <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-1 px-4">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                        Menu
                    </div>
                    <nav className="flex flex-col gap-1">
                        {NAV_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground group",
                                        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
                                    )}
                                >
                                    <Icon size={18} className={cn(
                                        "transition-colors",
                                        isActive ? "text-primary" : "group-hover:text-foreground"
                                    )} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-4 border-t bg-background/50 flex flex-col gap-3">
                    <div className="flex items-center justify-between px-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase">Theme</span>
                        <ThemeToggle />
                    </div>
                    <div className="flex px-2 w-full">
                        <AuthButton />
                    </div>
                </div>
            </aside>
        </>
    );
}
