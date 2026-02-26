import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '../auth.config';

const { auth } = NextAuth(authConfig);

// Mobile UA detection patterns
const MOBILE_UA_REGEX = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;

// Routes that should be rewritten to /m/ for mobile
const MOBILE_REWRITE_PATHS = ['/', '/operations', '/dividends', '/account', '/intelligence'];

function shouldRewrite(pathname: string): boolean {
    return MOBILE_REWRITE_PATHS.some(path =>
        path === '/' ? pathname === '/' : pathname.startsWith(path)
    );
}

function isMobileUA(userAgent: string | null): boolean {
    if (!userAgent) return false;
    return MOBILE_UA_REGEX.test(userAgent);
}

// Wrap auth middleware with mobile rewrite logic  
export default auth((req) => {
    const { pathname } = req.nextUrl;

    // Skip /m/ paths — internal targets
    if (pathname.startsWith('/m')) {
        return NextResponse.next();
    }

    // Only rewrite for routes that have mobile versions
    if (!shouldRewrite(pathname)) {
        return NextResponse.next();
    }

    // 1. Check cookie first (manual override)
    const viewMode = req.cookies.get('view-mode')?.value;

    // 2. If cookie says desktop, don't rewrite
    if (viewMode === 'desktop') {
        return NextResponse.next();
    }

    // 3. If cookie says mobile, or UA is mobile → rewrite to /m/
    const userAgent = req.headers.get('user-agent');
    const isMobile = viewMode === 'mobile' || isMobileUA(userAgent);

    console.log(`[MW] path=${pathname} | UA=${userAgent?.substring(0, 60)} | mobile=${isMobile} | cookie=${viewMode || 'none'}`);

    if (isMobile) {
        const mobileUrl = req.nextUrl.clone();
        mobileUrl.pathname = pathname === '/' ? '/m' : `/m${pathname}`;
        return NextResponse.rewrite(mobileUrl);
    }

    return NextResponse.next();
});

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
