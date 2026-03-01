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
    console.log('getAssets: Session user ID:', session?.user?.id);
    if (!session?.user?.id) {
        return [];
    }

    const assets = await prisma.asset.findMany({
        where: { userId: session.user.id },
    });
    console.log('getAssets: Found', assets.length, 'raw assets in DB');

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
            const matches = allStockEntries.filter((e: any) =>
                e.tickerSymbol === asset.assetSymbol &&
                e.predefinedAccountId === (asset as any).predefinedAccountId
            );
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
    initialMemo?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    try {
        const { predefinedAccountId, initialMemo, ...rest } = data;
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

        await recalculateStockAsset(session.user.id, data.tickerSymbol);

        // Auto-generate AssetMemo for this transaction
        let memoContent = `[SYSTEM] Purchased ${data.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })} shares at ${(data.totalPurchaseAmount / data.quantity).toLocaleString(undefined, { maximumFractionDigits: data.currency === 'KRW' ? 0 : 2, minimumFractionDigits: data.currency === 'KRW' ? 0 : 2 })} ${data.currency} via ${data.brokerName} - ${data.accountOwner}${data.accountNumber ? ` (${data.accountNumber})` : ''}. Total cost: ${data.totalPurchaseAmount.toLocaleString(undefined, { maximumFractionDigits: data.currency === 'KRW' ? 0 : 2, minimumFractionDigits: data.currency === 'KRW' ? 0 : 2 })} ${data.currency}`;

        // Append user's initial memo if provided to prevent duplication
        if (initialMemo && initialMemo.trim()) {
            memoContent += `\n\n${initialMemo.trim()}`;
        }

        await (prisma as any).assetMemo.create({
            data: {
                userId: session.user.id,
                tickerSymbol: data.tickerSymbol,
                content: memoContent
            }
        });

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
        await prisma.asset.deleteMany({
            where: { userId, assetType: 'stock', assetSymbol: tickerSymbol }
        });
        return;
    }

    // Group entries by account to maintain proportional mapping in visualization
    const entriesByAccount: Record<string, typeof allEntries> = {};
    allEntries.forEach(entry => {
        const accId = entry.predefinedAccountId || 'null';
        if (!entriesByAccount[accId]) entriesByAccount[accId] = [];
        entriesByAccount[accId].push(entry);
    });

    // Get current asset records for this ticker
    const currentAssets = await prisma.asset.findMany({
        where: { userId, assetType: 'stock', assetSymbol: tickerSymbol }
    });

    // Upsert records for each account group
    for (const [accId, group] of Object.entries(entriesByAccount)) {
        const totalQty = group.reduce((sum, e) => sum + e.quantity, 0);
        const totalCost = group.reduce((sum, e) => sum + e.totalPurchaseAmount, 0);
        const avgPrice = totalQty > 0 ? totalCost / totalQty : 0;
        const accountId = accId === 'null' ? null : accId;

        const existing = currentAssets.find(a => a.predefinedAccountId === accountId);

        const data = {
            amountEncrypted: encrypt(totalQty.toString()),
            avgPriceEncrypted: encrypt(avgPrice.toString()),
            predefinedAccountId: accountId
        };

        if (existing) {
            await prisma.asset.update({
                where: { id: existing.id },
                data
            });
        } else {
            await prisma.asset.create({
                data: {
                    userId,
                    assetType: 'stock',
                    assetSymbol: tickerSymbol,
                    ...data
                }
            });
        }
    }

    // Clean up empty associations
    const activeAccountIds = Object.keys(entriesByAccount).map(id => id === 'null' ? null : id);
    await prisma.asset.deleteMany({
        where: {
            userId,
            assetType: 'stock',
            assetSymbol: tickerSymbol,
            predefinedAccountId: { notIn: activeAccountIds as any }
        }
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

export async function deleteStockAssetAllEntries(tickerSymbol: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    try {
        await prisma.stockEntry.deleteMany({
            where: { tickerSymbol, userId: session.user.id }
        });
        await recalculateStockAsset(session.user.id, tickerSymbol);
        revalidatePath('/operations');
        return { success: true };
    } catch (e) {
        console.error('Failed to delete all stock entries:', e);
        throw new Error('Failed to delete all stock entries');
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

// Asset Memo Management Actions
export async function addAssetMemo(tickerSymbol: string, content: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    try {
        if (!(prisma as any).assetMemo) {
            console.error('Prisma model "assetMemo" is missing from the client instance.');
            throw new Error('Prisma database sync issue: "assetMemo" model not initialized in runtime. Please restart the server.');
        }
        const memo = await (prisma as any).assetMemo.create({
            data: {
                userId: session.user.id,
                tickerSymbol,
                content
            }
        });
        revalidatePath('/operations');
        return JSON.parse(JSON.stringify(memo));
    } catch (e: any) {
        console.error('Failed to add asset memo:', e);
        throw new Error(`Failed to add asset memo: ${e.message || 'Unknown error'}`);
    }
}

export async function getAssetMemos(tickerSymbol: string) {
    const session = await auth();
    if (!session?.user?.id) return [];

    try {
        return await (prisma as any).assetMemo.findMany({
            where: {
                userId: session.user.id,
                tickerSymbol
            },
            orderBy: { createdAt: 'desc' }
        });
    } catch (e) {
        console.error('Failed to fetch asset memos:', e);
        return [];
    }
}

export async function getAllAssetMemos() {
    const session = await auth();
    if (!session?.user?.id) return [];

    try {
        return await (prisma as any).assetMemo.findMany({
            where: {
                userId: session.user.id
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
    } catch (e) {
        console.error('Failed to fetch all asset memos:', e);
        return [];
    }
}

export async function deleteAssetMemo(memoId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    try {
        const memo = await (prisma as any).assetMemo.findUnique({
            where: { id: memoId, userId: session.user.id }
        });

        if (!memo) throw new Error('Memo not found');

        if (memo.content.startsWith('[SYSTEM]')) {
            throw new Error('System-generated memos cannot be deleted.');
        }

        await (prisma as any).assetMemo.delete({
            where: {
                id: memoId,
                userId: session.user.id
            }
        });
        revalidatePath('/operations');
        return { success: true };
    } catch (e: any) {
        console.error('Failed to delete asset memo:', e);
        throw new Error(`Failed to delete asset memo: ${e.message || 'Unknown error'}`);
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

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function uploadProfilePicture(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');

    // Basic validation
    if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
    }
    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image must be less than 5MB');
    }

    try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Save to public/avatars
        const uploadDir = join(process.cwd(), 'public', 'avatars');
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e: any) {
            if (e.code !== 'EEXIST') throw e;
        }

        // Use a unique filename
        const fileExtension = file.name.split('.').pop() || 'jpg';
        const fileName = `${session.user.id}-${Date.now()}.${fileExtension}`;
        const filePath = join(uploadDir, fileName);

        await writeFile(filePath, buffer);

        const imageUrl = `/avatars/${fileName}`;

        // Update user in DB
        await (prisma.user as any).update({
            where: { id: session.user.id },
            data: { image: imageUrl }
        });

        revalidatePath('/settings');
        return { success: true, imageUrl };
    } catch (e: any) {
        console.error('Failed to upload profile picture:', e);
        throw new Error(`Failed to upload picture: ${e.message || 'Unknown error'}`);
    }
}

export async function getIntelligenceData() {
    const session = await auth();
    if (!session?.user?.id) return null;

    try {
        const [accounts, assets] = await Promise.all([
            prisma.predefinedAccount.findMany({
                where: { userId: session.user.id }
            }),
            prisma.asset.findMany({
                where: { userId: session.user.id },
                include: { predefinedAccount: true }
            })
        ]);

        const accountsMap: Record<string, { id: string, name: string, broker: string, value: number, children: any[] }> = {};

        // Initialize with real accounts
        accounts.forEach(acc => {
            accountsMap[acc.id] = {
                id: acc.id,
                name: acc.alias,
                broker: acc.broker,
                value: 0,
                children: []
            };
        });

        let totalNetWorth = 0;

        assets.forEach(asset => {
            const decVal = decrypt(asset.amountEncrypted);
            const amount = decVal === 'DECRYPTION_FAILED' ? 0 : Number(decVal) || 0;

            let value = amount;
            if (asset.assetType === 'stock' && asset.avgPriceEncrypted) {
                const decPrice = decrypt(asset.avgPriceEncrypted);
                const price = decPrice === 'DECRYPTION_FAILED' ? 0 : Number(decPrice) || 0;
                value = amount * price;
            }

            const accId = asset.predefinedAccountId || 'manual';

            if (!accountsMap[accId]) {
                accountsMap[accId] = {
                    id: 'manual',
                    name: 'Manual Assets',
                    broker: 'System',
                    value: 0,
                    children: []
                };
            }

            accountsMap[accId].value += value;
            accountsMap[accId].children.push({
                id: asset.id,
                name: asset.assetSymbol || asset.assetType.toUpperCase(),
                symbol: asset.assetSymbol,
                type: asset.assetType,
                value: value,
                amount: amount
            });

            totalNetWorth += value;
        });

        // Filter out empty "Manual Assets" if no assets are unassigned
        const finalAccounts = Object.values(accountsMap).filter(acc => acc.children.length > 0);

        return {
            totalNetWorth,
            accounts: finalAccounts
        };
    } catch (e) {
        console.error('Failed to fetch intelligence data:', e);
        return null;
    }
}
