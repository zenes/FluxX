import { redirect } from 'next/navigation';

// 미들웨어가 디바이스 감지로 /m 또는 /d로 분기하므로 이 페이지는 폴백
export default function RootPage() {
    redirect('/d');
}
