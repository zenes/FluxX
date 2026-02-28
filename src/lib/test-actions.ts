'use server';

import { auth } from '@/../auth';
import prisma from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';
import { revalidatePath } from 'next/cache';

export async function bulkDeleteTestData() {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const userId = session.user.id;

    try {
        // Validate models exist at runtime
        const requiredModels = ['dividendRecord', 'stockEntry', 'asset', 'predefinedAccount', 'memo', 'assetMemo'];
        const missing = requiredModels.filter(m => !(prisma as any)[m]);

        if (missing.length > 0) {
            const availableModels = Object.keys(prisma).filter(k => !k.startsWith('$'));
            console.error('Missing models:', missing);
            console.log('Available models:', availableModels);
            throw new Error(`Prisma models missing: ${missing.join(', ')}. Available: ${availableModels.join(', ')}`);
        }

        // Delete all data related to the user in a transaction
        await prisma.$transaction([
            (prisma as any).dividendRecord.deleteMany({ where: { userId } }),
            (prisma as any).stockEntry.deleteMany({ where: { userId } }),
            (prisma as any).asset.deleteMany({ where: { userId } }),
            (prisma as any).predefinedAccount.deleteMany({ where: { userId } }),
            (prisma as any).memo.deleteMany({ where: { userId } }),
            (prisma as any).assetMemo.deleteMany({ where: { userId } }),
        ]);

        revalidatePath('/');
        revalidatePath('/operations');
        revalidatePath('/account');
        revalidatePath('/dividends');
        return { success: true };
    } catch (error: any) {
        console.error('Bulk delete failed:', error);
        throw new Error(`Failed to delete data: ${error.message}`);
    }
}

export async function bulkInsertTestData() {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const userId = session.user.id;

    try {
        // 1. Clear existing data first
        await bulkDeleteTestData();

        // 2. Insert Predefined Accounts
        const pAccModel = (prisma as any).predefinedAccount;
        const accounts = await Promise.all([
            pAccModel.create({
                data: {
                    userId,
                    alias: '토스 주식 계좌',
                    broker: 'Toss',
                    accountNumber: '123-456-789',
                    owner: '홍길동',
                }
            }),
            pAccModel.create({
                data: {
                    userId,
                    alias: '키움 해외 직구',
                    broker: 'Kiwoom',
                    accountNumber: '987-654-321',
                    owner: '홍길동',
                }
            }),
            pAccModel.create({
                data: {
                    userId,
                    alias: '미래에셋 연금',
                    broker: 'MiraeAsset',
                    accountNumber: '555-666-777',
                    owner: '홍길동',
                }
            })
        ]);

        const [tossAcc, kiwoomAcc, miraeAcc] = accounts;

        // 3. Insert Cash Assets
        const assetModel = (prisma as any).asset;
        await Promise.all([
            assetModel.create({
                data: {
                    userId,
                    assetType: 'krw',
                    amountEncrypted: encrypt('5000000'),
                    predefinedAccountId: tossAcc.id,
                }
            }),
            assetModel.create({
                data: {
                    userId,
                    assetType: 'usd',
                    amountEncrypted: encrypt('2500'),
                    predefinedAccountId: kiwoomAcc.id,
                }
            }),
            assetModel.create({
                data: {
                    userId,
                    assetType: 'krw',
                    amountEncrypted: encrypt('10000000'),
                    predefinedAccountId: miraeAcc.id,
                }
            }),
            assetModel.create({
                data: {
                    userId,
                    assetType: 'gold',
                    assetSymbol: 'GOLD',
                    amountEncrypted: encrypt('150.55'),
                }
            })
        ]);

        // 4. Insert Stock Entries
        const stockEntryModel = (prisma as any).stockEntry;
        const stockEntries = await Promise.all([
            stockEntryModel.create({
                data: {
                    userId,
                    tickerSymbol: '005930',
                    brokerName: 'Toss',
                    accountOwner: '홍길동',
                    accountNumber: '123-456-789',
                    quantity: 100,
                    totalPurchaseAmount: 7250000,
                    currency: 'KRW',
                    predefinedAccountId: tossAcc.id,
                    dividendPerShare: 361,
                    dividendFrequency: 4,
                    dividendMonths: '3,6,9,12',
                }
            }),
            stockEntryModel.create({
                data: {
                    userId,
                    tickerSymbol: 'AAPL',
                    brokerName: 'Kiwoom',
                    accountOwner: '홍길동',
                    accountNumber: '987-654-321',
                    quantity: 50,
                    totalPurchaseAmount: 9260, // 185.2 * 50
                    currency: 'USD',
                    predefinedAccountId: kiwoomAcc.id,
                    dividendPerShare: 0.24,
                    dividendFrequency: 4,
                    dividendMonths: '2,5,8,11',
                }
            }),
            stockEntryModel.create({
                data: {
                    userId,
                    tickerSymbol: 'SCHD',
                    brokerName: 'Kiwoom',
                    accountOwner: '홍길동',
                    accountNumber: '987-654-321',
                    quantity: 200,
                    totalPurchaseAmount: 15700, // 78.5 * 200
                    currency: 'USD',
                    predefinedAccountId: kiwoomAcc.id,
                    dividendPerShare: 0.74,
                    dividendFrequency: 4,
                    dividendMonths: '3,6,9,12',
                }
            }),
            stockEntryModel.create({
                data: {
                    userId,
                    tickerSymbol: '446720',
                    brokerName: 'MiraeAsset',
                    accountOwner: '홍길동',
                    accountNumber: '555-666-777',
                    quantity: 500,
                    totalPurchaseAmount: 6150000,
                    currency: 'KRW',
                    predefinedAccountId: miraeAcc.id,
                }
            })
        ]);

        const [samsungEntry, appleEntry, schdEntry] = stockEntries;

        // 5. Insert Asset records for Stocks (Aggregated)
        await Promise.all([
            assetModel.create({
                data: {
                    userId,
                    assetType: 'stock',
                    assetSymbol: '005930',
                    amountEncrypted: encrypt('100'),
                    avgPriceEncrypted: encrypt('72500'),
                    predefinedAccountId: tossAcc.id,
                }
            }),
            assetModel.create({
                data: {
                    userId,
                    assetType: 'stock',
                    assetSymbol: 'AAPL',
                    amountEncrypted: encrypt('50'),
                    avgPriceEncrypted: encrypt('185.2'),
                    predefinedAccountId: kiwoomAcc.id,
                }
            }),
            assetModel.create({
                data: {
                    userId,
                    assetType: 'stock',
                    assetSymbol: 'SCHD',
                    amountEncrypted: encrypt('200'),
                    avgPriceEncrypted: encrypt('78.5'),
                    predefinedAccountId: kiwoomAcc.id,
                }
            }),
            assetModel.create({
                data: {
                    userId,
                    assetType: 'stock',
                    assetSymbol: '446720',
                    amountEncrypted: encrypt('500'),
                    avgPriceEncrypted: encrypt('12300'),
                    predefinedAccountId: miraeAcc.id,
                }
            })
        ]);

        // 6. Insert Dividend Records
        const divRecordModel = (prisma as any).dividendRecord;
        await Promise.all([
            divRecordModel.create({
                data: {
                    userId,
                    tickerSymbol: '005930',
                    amount: 36100,
                    taxAmount: 5550,
                    currency: 'KRW',
                    receivedAt: new Date('2025-11-20'),
                    stockEntryId: samsungEntry.id,
                }
            }),
            divRecordModel.create({
                data: {
                    userId,
                    tickerSymbol: 'AAPL',
                    amount: 12.00,
                    taxAmount: 1.80,
                    currency: 'USD',
                    receivedAt: new Date('2025-11-15'),
                    stockEntryId: appleEntry.id,
                }
            }),
            divRecordModel.create({
                data: {
                    userId,
                    tickerSymbol: 'SCHD',
                    amount: 148.00,
                    taxAmount: 22.20,
                    currency: 'USD',
                    receivedAt: new Date('2025-12-24'),
                    stockEntryId: schdEntry.id,
                }
            })
        ]);

        // 7. Insert Memos
        await (prisma as any).memo.create({
            data: {
                userId,
                content: '2월 말까지 포트폴리오 리밸런싱 완료하기\n달러 인덱스 105 돌파 시 비중 조절 검토'
            }
        });

        const assetMemoModel = (prisma as any).assetMemo;
        await Promise.all([
            assetMemoModel.create({
                data: {
                    userId,
                    tickerSymbol: 'AAPL',
                    content: '아이폰 16 발표 이후 수요 모니터링 필요'
                }
            }),
            assetMemoModel.create({
                data: {
                    userId,
                    tickerSymbol: '005930',
                    content: '반도체 업황 회복 본격화 기대'
                }
            })
        ]);

        revalidatePath('/');
        revalidatePath('/operations');
        revalidatePath('/account');
        revalidatePath('/dividends');
        return { success: true };
    } catch (error: any) {
        console.error('Bulk insert failed:', error);
        throw new Error(`Failed to insert data: ${error.message}`);
    }
}
