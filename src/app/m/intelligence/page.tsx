import { getIntelligenceData } from '@/lib/actions';
import MobileIntelligence from '@/components/mobile/MobileIntelligence';
import { auth } from '@/../auth';
import { redirect } from 'next/navigation';

export default async function MobileIntelligencePage() {
    const session = await auth();
    if (!session?.user) redirect('/login');

    const data = await getIntelligenceData();

    return <MobileIntelligence initialData={data} />;
}
