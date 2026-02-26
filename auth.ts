import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const { auth, signIn, signOut, handlers: { GET, POST } } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string }
                });

                if (!user || !user.passwordHash) {
                    return null;
                }

                const passwordsMatch = await bcrypt.compare(
                    credentials.password as string,
                    user.passwordHash
                );

                if (passwordsMatch) {
                    // Update user's last login and active timestamp
                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            lastLoginAt: new Date(),
                            lastActiveAt: new Date()
                        }
                    });

                    return {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                        image: user.image
                    };
                }

                return null;
            },
        }),
    ],
});
