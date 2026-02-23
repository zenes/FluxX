import { getAssets } from '@/lib/actions';
import ClientOperations from './ClientOperations';
import { redirect } from 'next/navigation';
import { auth } from '@/../auth';
import Link from 'next/link';

export const metadata = {
    title: 'Operations Portfolio | FluxX',
};

export default async function OperationsPage() {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    const assets = await getAssets();

    return (
        <div className="flex flex-col h-full bg-background border-l border-primary/20">
            <header className="flex h-14 items-center gap-4 border-b border-primary/20 bg-muted/20 px-6">
                <div className="flex flex-1 items-center gap-3">
                    <div className="flex size-7 items-center justify-center rounded-sm bg-primary/20 border border-primary/50 text-primary font-bold text-xs shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                        OP
                    </div>
                    <span className="text-sm font-semibold tracking-wide text-foreground uppercase">Tactical Operations</span>
                </div>
                <nav className="flex items-center gap-6">
                    <div className="flex gap-4">
                        <Link href="/" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
                        <Link href="/operations" className="text-xs font-medium text-foreground transition-colors">Operations</Link>
                        <Link href="#" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">Intelligence</Link>
                    </div>
                </nav>
            </header>
            <ClientOperations assets={assets} />
        </div>
    );
}
