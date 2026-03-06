'use client';

import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function V2AuthProfileIcon() {
    const { data: session, status } = useSession();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    if (status === 'loading') {
        return <div className="size-9 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />;
    }

    if (!session) {
        return (
            <button
                onClick={() => signIn()}
                className="size-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                aria-label="Login"
            >
                <svg className="size-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            </button>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowLogoutConfirm(true)}
                className="size-9 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:opacity-80 transition-opacity flex items-center justify-center cursor-pointer"
            >
                {(session.user as any)?.image ? (
                    <img src={(session.user as any).image} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-sm font-bold text-zinc-600 dark:text-zinc-300 uppercase">
                        {session.user?.email?.charAt(0) || 'U'}
                    </span>
                )}
            </button>

            {showLogoutConfirm && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                        onClick={() => setShowLogoutConfirm(false)}
                    />
                    <div className="absolute right-0 top-12 w-48 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                            <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                                {session.user?.email}
                            </p>
                            <p className="text-xs text-zinc-400">
                                로그아웃 하시겠습니까?
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setShowLogoutConfirm(false);
                                signOut();
                            }}
                            className="w-full text-left px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                        >
                            로그아웃
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
