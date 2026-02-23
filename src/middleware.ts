import NextAuth from 'next-auth';
import { authConfig } from '../auth.config';

export default NextAuth(authConfig).auth;

export const config = {
    // src, test 등 정적 파일 및 이미지를 제외한 모든 라우트에서 미들웨어 실행
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
