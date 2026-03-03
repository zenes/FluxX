'use server';

import { auth } from '@/../auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getWatchlistStocks() {
    const session = await auth();
    let userId = session?.user?.id;

    if (!userId && process.env.NODE_ENV === 'development') {
        const firstUser = await prisma.user.findFirst();
        if (firstUser) userId = firstUser.id;
    }

    if (!userId) return [];

    try {
        const stocks = await (prisma as any).watchlistStock.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        return stocks.map((s: any) => ({
            ticker: s.ticker,
            type: s.type
        }));
    } catch (error) {
        console.error('Failed to get watchlist:', error);
        return [];
    }
}

export async function toggleWatchlistStock(ticker: string, type: string) {
    const session = await auth();
    let userId = session?.user?.id;

    if (!userId && process.env.NODE_ENV === 'development') {
        const firstUser = await prisma.user.findFirst();
        if (firstUser) userId = firstUser.id;
    }

    if (!userId) throw new Error('Unauthorized');

    try {
        const existing = await (prisma as any).watchlistStock.findUnique({
            where: {
                userId_ticker: {
                    userId,
                    ticker
                }
            }
        });

        if (existing) {
            await (prisma as any).watchlistStock.delete({
                where: { id: existing.id }
            });
        } else {
            await (prisma as any).watchlistStock.create({
                data: {
                    userId,
                    ticker,
                    type
                }
            });
        }

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error('Toggle watchlist failed:', error);
        throw new Error(`관심 종목 상태 변경 중 오류가 발생했습니다: ${error.message || 'Unknown error'}`);
    }
}

export async function syncWatchlist(localStocks: { ticker: string, type: string }[]) {
    const session = await auth();
    let userId = session?.user?.id;

    if (!userId && process.env.NODE_ENV === 'development') {
        const firstUser = await prisma.user.findFirst();
        if (firstUser) userId = firstUser.id;
    }

    if (!userId) return;

    try {
        // Simple sync: add if not exists
        for (const stock of localStocks) {
            await (prisma as any).watchlistStock.upsert({
                where: {
                    userId_ticker: {
                        userId,
                        ticker: stock.ticker
                    }
                },
                update: {
                    type: stock.type
                },
                create: {
                    userId,
                    ticker: stock.ticker,
                    type: stock.type
                }
            });
        }
        revalidatePath('/');
    } catch (error) {
        console.error('Sync watchlist failed:', error);
    }
}
