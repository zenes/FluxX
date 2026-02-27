'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Landmark, DollarSign, Zap, Sun, Moon, Globe, Monitor, Layout } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import AuthButton from '@/components/AuthButton';

const NAV_ITEMS = [
    { href: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
    { href: '/operations', icon: ShoppingBag, labelKey: 'nav.operations' },
    { href: '/account', icon: Landmark, labelKey: 'nav.accounts' },
    { href: '/dividends', icon: DollarSign, labelKey: 'nav.dividends' },
    { href: '/intelligence', icon: Zap, labelKey: 'nav.intelligence' },
    { href: '/m/simple', icon: Layout, labelKey: 'nav.simple_mode' },
];

export function MobileHeader() {
    const { theme, setTheme } = useTheme();
    const { language, setLanguage } = useLanguage();

    return (
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
            <div className="flex items-center justify-between px-4 h-12">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                        <span className="text-primary-foreground font-black text-xs">FX</span>
                    </div>
                    <span className="font-black text-sm tracking-tight">FLUXX</span>
                </Link>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setLanguage(language === 'en' ? 'ko' : 'en')}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                        <Globe className="size-4 text-muted-foreground" />
                    </button>
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                        {theme === 'dark' ? (
                            <Sun className="size-4 text-muted-foreground" />
                        ) : (
                            <Moon className="size-4 text-muted-foreground" />
                        )}
                    </button>
                    <button
                        onClick={() => {
                            document.cookie = 'view-mode=desktop; path=/; max-age=86400';
                            window.location.reload();
                        }}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        title="PC 버전 보기"
                    >
                        <Monitor className="size-4 text-muted-foreground" />
                    </button>
                    <AuthButton />
                </div>
            </div>
        </header>
    );
}

export function MobileBottomNav() {
    const pathname = usePathname();
    const { t } = useLanguage();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-t border-border/50 pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-around h-14">
                {NAV_ITEMS.map((item) => {
                    const isActive = item.href === '/'
                        ? pathname === '/'
                        : pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 rounded-lg transition-colors",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground active:text-foreground"
                            )}
                        >
                            <item.icon className={cn("size-5", isActive && "stroke-[2.5]")} />
                            <span className={cn(
                                "text-[9px] font-semibold tracking-wide",
                                isActive && "font-black"
                            )}>
                                {t(item.labelKey)}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

export function ViewModeToggle() {
    const handleSwitchToDesktop = () => {
        document.cookie = 'view-mode=desktop; path=/; max-age=86400';
        window.location.reload();
    };

    return (
        <div className="flex justify-center py-6 mb-16">
            <button
                onClick={handleSwitchToDesktop}
                className="text-xs text-muted-foreground/60 hover:text-muted-foreground border border-border/50 rounded-full px-4 py-2 transition-colors"
            >
                PC 버전 보기
            </button>
        </div>
    );
}
