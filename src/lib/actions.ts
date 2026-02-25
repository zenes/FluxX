'use server';
/* eslint-disable @typescript-eslint/no-explicit-any */

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
    currency?: string;
    predefinedAccountId?: string | null;
    // New optional expanded data mapping for sub-entries mapping per ticker
    entries?: {
        id: string;
        broker: string;
        owner: string;
        account: string;
        qty: number;
        totalCost: number;
        currency: string;
        predefinedAccountId?: string | null;
        predefinedAccountAlias?: string | null;
        dividendPerShare?: number | null;
        dividendFrequency?: number | null;
        dividendMonths?: string | null;
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
        let assetCurrency = undefined;
        if (asset.assetType === 'stock' && asset.assetSymbol) {
            const matches = allStockEntries.filter((e: any) => e.tickerSymbol === asset.assetSymbol);
            if (matches.length > 0) {
                assetCurrency = matches[0].currency;
                subEntries = matches.map((m: any) => ({
                    id: m.id,
                    broker: m.brokerName,
                    owner: m.accountOwner,
                    account: m.accountNumber || '',
                    qty: m.quantity,
                    totalCost: m.totalPurchaseAmount,
                    currency: m.currency,
                    predefinedAccountId: m.predefinedAccountId,
                    predefinedAccountAlias: m.predefinedAccount?.alias,
                    dividendPerShare: m.dividendPerShare,
                    dividendFrequency: m.dividendFrequency,
                    dividendMonths: m.dividendMonths
                }));
            }
        }

        return {
            id: asset.id,
            assetType: asset.assetType,
            amount,
            assetSymbol: asset.assetSymbol,
            avgPrice,
            currency: assetCurrency,
            predefinedAccountId: (asset as any).predefinedAccountId,
            entries: subEntries
        };
    });
}

export async function upsertAsset(assetType: string, amount: number, predefinedAccountId?: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    const amountEncrypted = encrypt(amount.toString());

    // Check if asset exists for this user + type + account combination
    const existingAsset = await (prisma.asset as any).findFirst({
        where: {
            userId: session.user.id,
            assetType: assetType,
            predefinedAccountId: predefinedAccountId || null
        }
    });

    if (existingAsset) {
        await (prisma.asset as any).update({
            where: { id: existingAsset.id },
            data: { amountEncrypted }
        });
    } else {
        await (prisma.asset as any).create({
            data: {
                userId: session.user.id,
                assetType,
                amountEncrypted,
                predefinedAccountId: predefinedAccountId || null
            }
        });
    }

    // Refresh the page data
    revalidatePath('/operations');
    revalidatePath('/account');
    return { success: true };
}


export async function addStockEntry(data: {
    tickerSymbol: string;
    brokerName: string;
    accountOwner: string;
    accountNumber?: string;
    quantity: number;
    totalPurchaseAmount: number;
    currency?: string;
    predefinedAccountId?: string;
    dividendPerShare?: number;
    dividendFrequency?: number;
    dividendMonths?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    try {
        const { predefinedAccountId, ...rest } = data;
        const entry = await prisma.stockEntry.create({
            data: {
                userId: session.user.id,
                ...rest,
                predefinedAccountId: predefinedAccountId || null,
                dividendPerShare: data.dividendPerShare,
                dividendFrequency: data.dividendFrequency,
                dividendMonths: data.dividendMonths
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
    } catch (e: any) {
        console.error('Failed to add stock entry:', e);
        throw new Error(`Failed to add stock entry: ${e.message || 'Unknown error'}`);
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
    data: {
        brokerName: string;
        accountOwner: string;
        accountNumber?: string;
        quantity: number;
        totalPurchaseAmount: number;
        currency: string;
        predefinedAccountId?: string | null;
        dividendPerShare?: number;
        dividendFrequency?: number;
        dividendMonths?: string;
    },
    tickerSymbol: string
) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    try {
        const { predefinedAccountId, ...rest } = data;
        await (prisma as any).stockEntry.update({
            where: { id: entryId, userId: session.user.id },
            data: {
                ...rest,
                predefinedAccountId: predefinedAccountId || null,
                dividendPerShare: data.dividendPerShare,
                dividendFrequency: data.dividendFrequency,
                dividendMonths: data.dividendMonths
            }
        });
        await recalculateStockAsset(session.user.id, tickerSymbol);
        revalidatePath('/operations');
        return { success: true };
    } catch (e: any) {
        console.error('Failed to edit stock entry:', e);
        throw new Error(`Failed to edit stock entry: ${e.message || 'Unknown error'}`);
    }
}

// Dividend Management Actions
export async function updateDividendConfig(
    entryId: string,
    data: {
        dividendPerShare?: number;
        dividendFrequency?: number;
        dividendMonths?: string;
    }
) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    try {
        await prisma.stockEntry.update({
            where: { id: entryId, userId: session.user.id },
            data
        });
        revalidatePath('/dividends');
        revalidatePath('/operations');
        return { success: true };
    } catch (e: any) {
        console.error('Failed to update dividend config:', e);
        throw new Error(`Failed to update dividend config: ${e.message || 'Unknown error'}`);
    }
}

export async function addDividendRecord(data: {
    tickerSymbol: string;
    amount: number;
    currency: string;
    receivedAt: Date | string;
    taxAmount?: number;
    stockEntryId?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    try {
        if (!(prisma as any).dividendRecord) {
            console.error('Prisma model "dividendRecord" is missing from the client instance. Available models:', Object.keys(prisma).filter(k => !k.startsWith('$')));
            throw new Error('Prisma database sync issue: "dividendRecord" model not initialized in runtime. Please restart the server.');
        }
        const record = await (prisma as any).dividendRecord.create({
            data: {
                userId: session.user.id,
                ...data,
                receivedAt: new Date(data.receivedAt)
            }
        });
        revalidatePath('/dividends');
        return record;
    } catch (e: any) {
        console.error('Failed to add dividend record:', e);
        throw new Error(`Failed to add dividend record: ${e.message || 'Unknown error'}`);
    }
}

export async function getDividendRecords() {
    const session = await auth();
    if (!session?.user?.id) return [];

    try {
        return await (prisma as any).dividendRecord.findMany({
            where: { userId: session.user.id },
            orderBy: { receivedAt: 'desc' }
        });
    } catch (e) {
        console.error('Failed to fetch dividend records:', e);
        return [];
    }
}

// Memo Management Actions
export async function addMemo(content: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    try {
        const memo = await (prisma as any).memo.create({
            data: {
                userId: session.user.id,
                content
            }
        });
        revalidatePath('/account');
        revalidatePath('/');
        return JSON.parse(JSON.stringify(memo));
    } catch (e: any) {
        console.error('Failed to add memo:', e);
        throw new Error(`Failed to add memo: ${e.message || 'Unknown error'}`);
    }
}

export async function getMemos() {
    const session = await auth();
    if (!session?.user?.id) return [];

    try {
        return await (prisma as any).memo.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' }
        });
    } catch (e) {
        console.error('Failed to fetch memos:', e);
        return [];
    }
}
