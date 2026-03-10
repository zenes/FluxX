'use server';

import { auth } from '@/../auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Gets all stock aliases for the current user
 */
export async function getStockAliases() {
    const session = await auth();
    let userId = session?.user?.id;

    if (!userId && process.env.NODE_ENV === 'development') {
        const firstUser = await prisma.user.findFirst();
        if (firstUser) userId = firstUser.id;
    }

    if (!userId) return {};

    try {
        if (!(prisma as any).stockAlias) {
            console.error('CRITICAL: prisma.stockAlias is undefined in getStockAliases even after singleton check.');
            return {};
        }
        const aliases = await (prisma as any).stockAlias.findMany({
            where: { userId }
        });

        // Convert to a map for easier lookup: { 'AAPL': 'Apple Corp', ... }
        return aliases.reduce((acc: Record<string, string>, curr: any) => {
            acc[curr.ticker] = curr.alias;
            return acc;
        }, {} as Record<string, string>);
    } catch (error) {
        console.error('Failed to fetch stock aliases:', error);
        return {};
    }
}

/**
 * Upserts a stock alias (creates or updates)
 */
export async function upsertStockAlias(ticker: string, alias: string) {
    const session = await auth();
    let userId = session?.user?.id;

    if (!userId && process.env.NODE_ENV === 'development') {
        const firstUser = await prisma.user.findFirst();
        if (firstUser) userId = firstUser.id;
    }

    if (!userId) throw new Error('Unauthorized');

    const normalizedTicker = ticker.trim().toUpperCase();
    const normalizedAlias = alias.trim();

    try {
        if (!(prisma as any).stockAlias) {
            throw new Error('Prisma Client is not properly initialized with stockAlias model. Please restart the dev server.');
        }
        if (!normalizedAlias) {
            // If alias is empty, we treat it as a delete
            await (prisma as any).stockAlias.deleteMany({
                where: { userId, ticker: normalizedTicker }
            });
        } else {
            await (prisma as any).stockAlias.upsert({
                where: {
                    userId_ticker: {
                        userId,
                        ticker: normalizedTicker
                    }
                },
                update: { alias: normalizedAlias },
                create: {
                    userId,
                    ticker: normalizedTicker,
                    alias: normalizedAlias
                }
            });
        }

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to upsert stock alias:', error);
        throw new Error(`별명 저장 중 오류가 발생했습니다: ${error.message || 'Unknown error'}`);
    }
}

/**
 * Deletes a stock alias
 */
export async function deleteStockAlias(ticker: string) {
    const session = await auth();
    let userId = session?.user?.id;

    if (!userId && process.env.NODE_ENV === 'development') {
        const firstUser = await prisma.user.findFirst();
        if (firstUser) userId = firstUser.id;
    }

    if (!userId) throw new Error('Unauthorized');

    const normalizedTicker = ticker.trim().toUpperCase();

    try {
        await (prisma as any).stockAlias.deleteMany({
            where: { userId, ticker: normalizedTicker }
        });

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to delete stock alias:', error);
        throw new Error(`별명 삭제 중 오류가 발생했습니다: ${error.message || 'Unknown error'}`);
    }
}
