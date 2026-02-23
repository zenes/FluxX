import type { NextAuthConfig } from 'next-auth';

// Add type for session role
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            email: string;
            role: string;
        }
    }
}

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;

            // 보호할 일반 라우트
            const protectedPaths = ['/operations', '/intelligence'];
            const adminPaths = ['/admin'];

            const isProtected = protectedPaths.some((path) => nextUrl.pathname.startsWith(path));
            const isAdminPath = adminPaths.some((path) => nextUrl.pathname.startsWith(path));

            if (isAdminPath) {
                if (isLoggedIn && auth?.user?.role === 'ADMIN') return true;
                return false;
            }

            if (isProtected) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn && (nextUrl.pathname === '/login' || nextUrl.pathname === '/register')) {
                return Response.redirect(new URL('/', nextUrl));
            }
            return true;
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
                session.user.role = token.role as string;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id;
                token.role = (user as any).role;
            }
            return token;
        }
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
