'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { authenticate } from '@/lib/actions';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginForm() {
    const [errorMessage, dispatch] = useFormState(authenticate, undefined);
    const searchParams = useSearchParams();
    const registered = searchParams.get('registered');
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="w-full max-w-md bg-card border rounded-md shadow-2xl p-8 relative z-10 overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/80"></div>
                <div className="flex flex-col gap-2 mb-8">
                    <div className="flex size-14 items-center justify-center rounded-sm bg-primary text-primary-foreground font-bold text-2xl shadow-md mb-2">
                        FX
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">Command Center</h1>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">Authentication Required</p>
                </div>

                {registered && !errorMessage && (
                    <div className="mb-4 p-3 bg-primary/10 border border-primary/50 text-primary text-sm rounded flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        Registration complete. Please authenticate.
                    </div>
                )}

                {errorMessage && (
                    <div className="mb-4 p-3 bg-destructive/10 border border-destructive/50 text-destructive text-sm rounded flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-destructive animate-pulse"></span>
                        {errorMessage}
                    </div>
                )}

                <form action={dispatch} className="flex flex-col gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="email">Operative ID (Email)</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            required
                            className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                            placeholder="agent@domain.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="password">Access Code (Password)</label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            required
                            className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                            placeholder="••••••••"
                        />
                    </div>
                    <LoginButton />
                </form>

                <div className="mt-6 pt-6 border-t text-center flex flex-col gap-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Unregistered Personnel?</span>
                    <button
                        onClick={() => router.push('/register')}
                        className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest"
                    >
                        Request Access
                    </button>
                </div>
            </div>
        </div>
    );
}

function LoginButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="mt-4 inline-flex items-center justify-center whitespace-nowrap rounded-sm text-sm font-bold tracking-wide uppercase ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 shadow-[0_0_15px_rgba(59,130,246,0.5)] relative overflow-hidden group"
        >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none"></div>
            {pending ? 'Authenticating...' : 'Access Terminal'}
        </button>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><span className="text-primary animate-pulse uppercase tracking-widest">Loading Uplink...</span></div>}>
            <LoginForm />
        </Suspense>
    );
}
