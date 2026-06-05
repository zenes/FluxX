import { getAssets, getPredefinedAccounts } from '@/lib/actions';
import ClientPortfolio from '@/app/d/portfolio/ClientPortfolio';
import { redirect } from 'next/navigation';
import { auth } from '@/../auth';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';

export const metadata = {
    title: 'Portfolio | FluxX',
};

export default async function PortfolioPage() {
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
            <ClientPortfolio assets={assets} predefinedAccounts={accounts} />
        </div>
    );
}
