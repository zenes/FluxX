import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '../auth.config';

const { auth } = NextAuth(authConfig);

const MOBILE_UA = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

export default auth((req) => {
    if (req.nextUrl.pathname === '/') {
        const override = req.cookies.get('view-mode')?.value;
        const target =
            override === 'mobile' ? '/m'
            : override === 'desktop' ? '/d/portfolio'
            : MOBILE_UA.test(req.headers.get('user-agent') || '') ? '/m' : '/d/portfolio';
        return NextResponse.redirect(new URL(target, req.nextUrl));
    }
    return NextResponse.next();
});

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
