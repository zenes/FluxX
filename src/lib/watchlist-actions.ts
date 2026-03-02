'use server';

import { auth } from '@/../auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getWatchlistStocks() {
    const session = await auth();
    if (!session?.user?.id) return [];

    try {
        const stocks = await prisma.watchlistStock.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' }
        });
        return stocks.map((s: { ticker: string, type: string }) => ({
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
    if (!session?.user?.id) throw new Error('Unauthorized');

    const userId = session.user.id;

    try {
        const existing = await prisma.watchlistStock.findUnique({
            where: {
                userId_ticker: {
                    userId,
                    ticker
                }
            }
        });

        if (existing) {
            await prisma.watchlistStock.delete({
                where: { id: existing.id }
            });
        } else {
            await prisma.watchlistStock.create({
                data: {
                    userId,
                    ticker,
                    type
                }
            });
        }

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Toggle watchlist failed:', error);
        throw new Error('관심 종목 상태 변경 중 오류가 발생했습니다.');
    }
}

export async function syncWatchlist(localStocks: { ticker: string, type: string }[]) {
    const session = await auth();
    if (!session?.user?.id) return;

    const userId = session.user.id;

    try {
        // Simple sync: add if not exists
        for (const stock of localStocks) {
            await prisma.watchlistStock.upsert({
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
