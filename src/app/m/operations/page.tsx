import { getAssets, getPredefinedAccounts } from '@/lib/actions';
import MobileOperations from '@/components/mobile/MobileOperations';
import { redirect } from 'next/navigation';
import { auth } from '@/../auth';

export const metadata = { title: 'Operations | FluxX' };

export default async function MobileOperationsPage() {
    const session = await auth();
    if (!session) redirect('/login');

    const [assets, accounts] = await Promise.all([
        getAssets(),
        getPredefinedAccounts()
    ]);

    return <MobileOperations assets={assets} predefinedAccounts={accounts} />;
}
