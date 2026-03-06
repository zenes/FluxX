import { getAssets } from '@/lib/actions';
import ClientDividends from '@/app/dividends/ClientDividends';
import { redirect } from 'next/navigation';
import { auth } from '@/../auth';

export const metadata = {
    title: 'Dividend Intelligence | FluxX',
};

export default async function DividendsPage() {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    const assets = await getAssets();

    return (
        <div className="flex flex-col h-full bg-background border-l border-primary/20">
            <ClientDividends assets={assets} />
        </div>
    );
}
