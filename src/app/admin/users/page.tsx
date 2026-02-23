import prisma from '@/lib/prisma';
import { formatDistanceToNow } from 'date-fns';

export const metadata = {
    title: 'Admin Dashboard | FluxX',
};

export default async function AdminUsersPage() {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const getStatus = (lastActiveAt: Date | null) => {
        if (!lastActiveAt) return 'OFFLINE';
        const diffInMinutes = (now.getTime() - lastActiveAt.getTime()) / (1000 * 60);
        return diffInMinutes <= 5 ? 'ONLINE' : 'OFFLINE';
    };

    const onlineCount = users.filter((u) => getStatus(u.lastActiveAt) === 'ONLINE').length;

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <header className="flex h-14 items-center gap-4 border-b border-primary/20 bg-muted/40 px-6">
                <div className="flex flex-1 items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-sm bg-destructive text-destructive-foreground font-bold text-xs shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                        ADM
                    </div>
                    <span className="text-sm font-semibold tracking-wide text-foreground uppercase">Global Overseer Mode</span>
                </div>
                <div className="text-xs font-mono text-muted-foreground flex gap-4">
                    <span>TOTAL AGENTS: <strong className="text-foreground">{users.length}</strong></span>
                    <span>ACTIVE UPLINKS: <strong className="text-primary">{onlineCount}</strong></span>
                </div>
            </header>

            <main className="flex-1 p-6 md:p-8 bg-background">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-destructive">Personnel Management</h1>
                        <p className="text-sm text-muted-foreground mt-1">Review operative credentials, roles, and connection statuses.</p>
                    </div>
                </div>

                <div className="rounded-md border border-input overflow-hidden shadow-2xl bg-card">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b tracking-wider">
                                <tr>
                                    <th scope="col" className="px-6 py-4 font-semibold">Operative ID</th>
                                    <th scope="col" className="px-6 py-4 font-semibold">Clearance Level</th>
                                    <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                                    <th scope="col" className="px-6 py-4 font-semibold">Last Login</th>
                                    <th scope="col" className="px-6 py-4 font-semibold">Joined At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {users.map((user) => {
                                    const status = getStatus(user.lastActiveAt);
                                    return (
                                        <tr key={user.id} className="hover:bg-muted/10 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-sm bg-primary/10 flex items-center justify-center border border-primary/20 font-mono text-[10px] text-primary">
                                                        {user.email.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="font-mono text-foreground">{user.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border ${user.role === 'ADMIN'
                                                        ? 'bg-destructive/10 text-destructive border-destructive/20'
                                                        : 'bg-muted text-muted-foreground border-input'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className={`relative flex h-2.5 w-2.5`}>
                                                        {status === 'ONLINE' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>}
                                                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${status === 'ONLINE' ? 'bg-primary shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-muted-foreground/30'}`}></span>
                                                    </span>
                                                    <span className={`text-xs font-medium tracking-wide ${status === 'ONLINE' ? 'text-primary' : 'text-muted-foreground'}`}>
                                                        {status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-muted-foreground font-mono text-xs">
                                                {user.lastLoginAt ? (
                                                    <span title={user.lastLoginAt.toLocaleString()}>{formatDistanceToNow(user.lastLoginAt, { addSuffix: true })}</span>
                                                ) : 'Never'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-muted-foreground text-xs">
                                                {user.createdAt.toLocaleDateString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {users.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground text-sm uppercase tracking-widest">
                                No personnel found.
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
