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
};

export async function getAssets(): Promise<AssetItem[]> {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    const assets = await prisma.asset.findMany({
        where: { userId: session.user.id },
    });

    return assets.map(asset => {
        const decryptedStr = decrypt(asset.amountEncrypted);
        // Handle failure to decrypt gracefully
        const amount = decryptedStr === 'DECRYPTION_FAILED' ? 0 : Number(decryptedStr) || 0;

        let avgPrice = null;
        if (asset.avgPriceEncrypted) {
            const decryptedPriceStr = decrypt(asset.avgPriceEncrypted);
            avgPrice = decryptedPriceStr === 'DECRYPTION_FAILED' ? 0 : Number(decryptedPriceStr) || 0;
        }

        return {
            id: asset.id,
            assetType: asset.assetType,
            amount,
            assetSymbol: asset.assetSymbol,
            avgPrice
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

export async function upsertStockAsset(ticker: string, shares: number, avgPrice: number) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    const amountEncrypted = encrypt(shares.toString());
    const avgPriceEncrypted = encrypt(avgPrice.toString());

    // Check if user already holds this specific stock ticker
    const existingAsset = await prisma.asset.findFirst({
        where: {
            userId: session.user.id,
            assetType: 'stock',
            assetSymbol: ticker,
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
                assetSymbol: ticker,
                amountEncrypted,
                avgPriceEncrypted,
            }
        });
    }

    revalidatePath('/operations');
    return { success: true };
}
