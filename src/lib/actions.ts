'use server';

import { signIn, auth } from '@/../auth';
import { AuthError } from 'next-auth';
import prisma from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/encryption';
import { revalidatePath } from 'next/cache';

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}

export type AssetItem = {
    id?: string;
    assetType: string;
    amount: number;
    assetSymbol?: string | null;
    avgPrice?: number | null;
    // New optional expanded data mapping for sub-entries mapping per ticker
    entries?: {
        id: string;
        broker: string;
        owner: string;
        account: string;
        qty: number;
        totalCost: number;
        predefinedAccountId?: string | null;
        predefinedAccountAlias?: string | null;
    }[];
};

export async function getAssets(): Promise<AssetItem[]> {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    const assets = await prisma.asset.findMany({
        where: { userId: session.user.id },
    });

    // Fetch associated stock entries with their predefined accounts for aliases
    const allStockEntries = await prisma.stockEntry.findMany({
        where: { userId: session.user.id },
        include: { predefinedAccount: true }
    });

    return assets.map(asset => {
        const decryptedStr = decrypt(asset.amountEncrypted);
        const amount = decryptedStr === 'DECRYPTION_FAILED' ? 0 : Number(decryptedStr) || 0;

        let avgPrice = null;
        if (asset.avgPriceEncrypted) {
            const decryptedPriceStr = decrypt(asset.avgPriceEncrypted);
            avgPrice = decryptedPriceStr === 'DECRYPTION_FAILED' ? 0 : Number(decryptedPriceStr) || 0;
        }

        // Filter valid entries
        let subEntries = undefined;
        if (asset.assetType === 'stock' && asset.assetSymbol) {
            const matches = allStockEntries.filter((e: any) => e.tickerSymbol === asset.assetSymbol);
            if (matches.length > 0) {
                subEntries = matches.map((m: any) => ({
                    id: m.id,
                    broker: m.brokerName,
                    owner: m.accountOwner,
                    account: m.accountNumber || '',
                    qty: m.quantity,
                    totalCost: m.totalPurchaseAmount,
                    predefinedAccountId: m.predefinedAccountId,
                    predefinedAccountAlias: m.predefinedAccount?.alias
                }));
            }
        }

        return {
            id: asset.id,
            assetType: asset.assetType,
            amount,
            assetSymbol: asset.assetSymbol,
            avgPrice,
            entries: subEntries
        };
    });
}

export async function upsertAsset(assetType: string, amount: number) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    const amountEncrypted = encrypt(amount.toString());

    // Check if asset exists for this user
    const existingAsset = await prisma.asset.findFirst({
        where: {
            userId: session.user.id,
            assetType: assetType,
        }
    });

    if (existingAsset) {
        await prisma.asset.update({
            where: { id: existingAsset.id },
            data: { amountEncrypted }
        });
    } else {
        await prisma.asset.create({
            data: {
                userId: session.user.id,
                assetType,
                amountEncrypted,
            }
        });
    }

    // Refresh the page data
    revalidatePath('/operations');
    return { success: true };
}


export async function addStockEntry(data: {
    tickerSymbol: string;
    brokerName: string;
    accountOwner: string;
    accountNumber?: string;
    quantity: number;
    totalPurchaseAmount: number;
    predefinedAccountId?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    try {
        const entry = await prisma.stockEntry.create({
            data: {
                userId: session.user.id,
                ...data
            }
        });

        const allEntries = await prisma.stockEntry.findMany({
            where: {
                userId: session.user.id,
                tickerSymbol: data.tickerSymbol
            }
        });

        const totalQty = allEntries.reduce((sum: number, e: { quantity: number }) => sum + e.quantity, 0);
        const totalCost = allEntries.reduce((sum: number, e: { totalPurchaseAmount: number }) => sum + e.totalPurchaseAmount, 0);
        const avgPrice = totalQty > 0 ? totalCost / totalQty : 0;

        const amountEncrypted = encrypt(totalQty.toString());
        const avgPriceEncrypted = encrypt(avgPrice.toString());

        const existingAsset = await prisma.asset.findFirst({
            where: {
                userId: session.user.id,
                assetType: 'stock',
                assetSymbol: data.tickerSymbol,
            }
        });

        if (existingAsset) {
            await prisma.asset.update({
                where: { id: existingAsset.id },
                data: {
                    amountEncrypted,
                    avgPriceEncrypted,
                }
            });
        } else {
            await prisma.asset.create({
                data: {
                    userId: session.user.id,
                    assetType: 'stock',
                    assetSymbol: data.tickerSymbol,
                    amountEncrypted,
                    avgPriceEncrypted,
                }
            });
        }

        revalidatePath('/operations');
        return entry;
    } catch (e) {
        console.error('Failed to add stock entry:', e);
        throw new Error('Failed to add stock entry');
    }
}

export async function getPredefinedAccounts() {
    const session = await auth();
    if (!session?.user?.id) return [];

    try {
        const accounts = await prisma.predefinedAccount.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
        });
        return accounts;
    } catch (e) {
        console.error('Failed to fetch predefined accounts:', e);
        return [];
    }
}

export async function addPredefinedAccount(data: {
    alias: string;
    broker: string;
    accountNumber: string;
    owner: string;
}) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    try {
        const account = await prisma.predefinedAccount.create({
            data: {
                userId: session.user.id,
                ...data
            }
        });
        revalidatePath('/settings');
        return account;
    } catch (e) {
        console.error('Failed to add predefined account:', e);
        throw new Error('Failed to add predefined account');
    }
}

export async function editPredefinedAccount(id: string, data: {
    alias: string;
    broker: string;
    accountNumber: string;
    owner: string;
}) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    try {
        const account = await prisma.predefinedAccount.update({
            where: { id, userId: session.user.id },
            data
        });
        revalidatePath('/settings');
        return account;
    } catch (e) {
        console.error('Failed to edit predefined account:', e);
        throw new Error('Failed to edit predefined account');
    }
}

export async function deletePredefinedAccount(id: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    try {
        await prisma.predefinedAccount.delete({
            where: { id, userId: session.user.id }
        });
        revalidatePath('/settings');
        return true;
    } catch (e) {
        console.error('Failed to delete predefined account:', e);
        throw new Error('Failed to delete predefined account');
    }
}

async function recalculateStockAsset(userId: string, tickerSymbol: string) {
    const allEntries = await prisma.stockEntry.findMany({
        where: { userId, tickerSymbol }
    });

    if (allEntries.length === 0) {
        // If no entries left, delete the master asset
        await prisma.asset.deleteMany({
            where: {
                userId,
                assetType: 'stock',
                assetSymbol: tickerSymbol
            }
        });
        return;
    }

    const totalQty = allEntries.reduce((sum: number, e: { quantity: number }) => sum + e.quantity, 0);
    const totalCost = allEntries.reduce((sum: number, e: { totalPurchaseAmount: number }) => sum + e.totalPurchaseAmount, 0);
    const avgPrice = totalQty > 0 ? totalCost / totalQty : 0;

    const amountEncrypted = encrypt(totalQty.toString());
    const avgPriceEncrypted = encrypt(avgPrice.toString());

    await prisma.asset.updateMany({
        where: { userId, assetType: 'stock', assetSymbol: tickerSymbol },
        data: { amountEncrypted, avgPriceEncrypted }
    });
}

export async function deleteStockEntry(entryId: string, tickerSymbol: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    try {
        await prisma.stockEntry.delete({
            where: { id: entryId, userId: session.user.id }
        });
        await recalculateStockAsset(session.user.id, tickerSymbol);
        revalidatePath('/operations');
        return { success: true };
    } catch (e) {
        console.error('Failed to delete stock entry:', e);
        throw new Error('Failed to delete stock entry');
    }
}

export async function editStockEntry(
    entryId: string,
    data: { brokerName: string; accountOwner: string; accountNumber?: string; quantity: number; totalPurchaseAmount: number; predefinedAccountId?: string | null },
    tickerSymbol: string
) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    try {
        await prisma.stockEntry.update({
            where: { id: entryId, userId: session.user.id },
            data
        });
        await recalculateStockAsset(session.user.id, tickerSymbol);
        revalidatePath('/operations');
        return { success: true };
    } catch (e) {
        console.error('Failed to edit stock entry:', e);
        throw new Error('Failed to edit stock entry');
    }
}
