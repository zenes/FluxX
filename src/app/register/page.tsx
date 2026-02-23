'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (res.ok) {
                // Redirect to login after successful registration
                router.push('/login?registered=true');
            } else {
                const data = await res.json();
                setError(data.error || 'Registration failed');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md bg-card border rounded-md shadow-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/80"></div>
                <div className="flex flex-col gap-2 mb-8">
                    <div className="flex size-10 items-center justify-center rounded-sm bg-primary text-primary-foreground font-bold text-lg shadow-md mb-2">
                        FX
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">Initialize Operative</h1>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">Secure Registration Protocol</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-destructive/10 border border-destructive/50 text-destructive text-sm rounded flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-destructive animate-pulse"></span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Operative ID (Email)</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                            placeholder="agent@domain.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Access Code (Password)</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-4 inline-flex items-center justify-center whitespace-nowrap rounded-sm text-sm font-bold tracking-wide uppercase ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                    >
                        {loading ? 'Processing...' : 'Deploy Identity'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => router.push('/login')}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
                    >
                        [ Return to Access Terminal ]
                    </button>
                </div>
            </div>
        </div>
    );
}
