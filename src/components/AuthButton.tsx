'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Settings } from 'lucide-react';

export default function AuthButton() {
    const { data: session, status } = useSession();

    if (status === 'loading') {
        return (
            <div className="h-8 w-24 bg-muted animate-pulse rounded-md"></div>
        );
    }

    if (session && session.user) {
        return (
            <div className="flex items-center gap-4">
                {session.user.role === 'ADMIN' && (
                    <Link
                        href="/admin/users"
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-sm text-xs font-bold tracking-wide uppercase ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground h-8 px-4 py-2"
                    >
                        Admin Panel
                    </Link>
                )}
                <span className="text-xs text-muted-foreground hidden sm:inline-block">
                    <span className="text-[10px] uppercase tracking-wider mr-2">Logged in as:</span>
                    <strong className="text-primary font-mono">{session.user.email}</strong>
                </span>

                <Link
                    href="/settings"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-sm text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-muted hover:text-foreground h-8 w-8 text-muted-foreground"
                    title="Personal Settings"
                >
                    <Settings size={18} />
                </Link>

                <button
                    onClick={() => signOut()}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-sm text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2"
                >
                    Logout
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <Link
                href="/login"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-sm text-xs font-bold tracking-wide uppercase ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary/10 text-primary hover:bg-primary/20 h-8 px-4 py-2 border border-primary/20"
            >
                Sign In
            </Link>
            <Link
                href="/register"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-sm text-xs font-bold tracking-wide uppercase ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 py-2 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
            >
                Sign Up
            </Link>
        </div>
    );
}
