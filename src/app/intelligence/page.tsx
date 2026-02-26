import { getIntelligenceData } from '@/lib/actions';
import IntelligenceClient from './IntelligenceClient';
import { auth } from '@/../auth';
import { redirect } from 'next/navigation';

export default async function IntelligencePage() {
    const session = await auth();
    if (!session?.user) {
        redirect('/login');
    }

    const data = await getIntelligenceData();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <IntelligenceClient initialData={data} />
        </div>
    );
}
