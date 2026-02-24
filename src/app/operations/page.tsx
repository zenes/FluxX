import { getAssets, getPredefinedAccounts } from '@/lib/actions';
import ClientOperations from './ClientOperations';
import { redirect } from 'next/navigation';
import { auth } from '@/../auth';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';

export const metadata = {
    title: 'Operations Portfolio | FluxX',
};

export default async function OperationsPage() {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    const [assets, accounts] = await Promise.all([
        getAssets(),
        getPredefinedAccounts()
    ]);

    return (
        <div className="flex flex-col h-full bg-background border-l border-primary/20">
            <ClientOperations assets={assets} predefinedAccounts={accounts} />
        </div>
    );
}
