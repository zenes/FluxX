import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';

const MOBILE_UA = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

export default function RootPage() {
    const override = cookies().get('view-mode')?.value;
    if (override === 'mobile') redirect('/m');
    if (override === 'desktop') redirect('/d');

    const ua = headers().get('user-agent') || '';
    redirect(MOBILE_UA.test(ua) ? '/m' : '/d');
}
