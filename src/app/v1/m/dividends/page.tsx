import { getAssets } from '@/lib/actions';
import MobileDividends from '@/components/mobile/MobileDividends';
import { redirect } from 'next/navigation';
import { auth } from '@/../auth';

export const metadata = { title: 'Dividends | FluxX' };

export default async function MobileDividendsPage() {
    const session = await auth();
    if (!session) redirect('/login');

    const assets = await getAssets();

    return <MobileDividends assets={assets} />;
}
