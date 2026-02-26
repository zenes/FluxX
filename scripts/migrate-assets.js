const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { encrypt } = require('../src/lib/encryption');

// Mocking recalculateStockAsset logic for the script
async function fixAccountLinkages() {
    console.log('Starting migration...');

    // 1. Get all stock entries
    const allEntries = await prisma.stockEntry.findMany();

    // Group by user and ticker
    const userTickerGroups = {};
    allEntries.forEach(e => {
        const key = `${e.userId}:${e.tickerSymbol}`;
        if (!userTickerGroups[key]) userTickerGroups[key] = [];
        userTickerGroups[key].push(e);
    });

    for (const [key, entries] of Object.entries(userTickerGroups)) {
        const [userId, tickerSymbol] = key.split(':');
        console.log(`Processing ${tickerSymbol} for user ${userId}...`);

        // Group the group by account
        const entriesByAccount = {};
        entries.forEach(entry => {
            const accId = entry.predefinedAccountId || 'null';
            if (!entriesByAccount[accId]) entriesByAccount[accId] = [];
            entriesByAccount[accId].push(entry);
        });

        // Upsert Asset records for each account
        for (const [accId, group] of Object.entries(entriesByAccount)) {
            const totalQty = group.reduce((sum, e) => sum + e.quantity, 0);
            const totalCost = group.reduce((sum, e) => sum + e.totalPurchaseAmount, 0);
            const avgPrice = totalQty > 0 ? totalCost / totalQty : 0;
            const accountId = accId === 'null' ? null : accId;

            const amountEncrypted = encrypt(totalQty.toString());
            const avgPriceEncrypted = encrypt(avgPrice.toString());

            await prisma.asset.upsert({
                where: {
                    userId_assetType_assetSymbol_predefinedAccountId: {
                        userId,
                        assetType: 'stock',
                        assetSymbol: tickerSymbol,
                        predefinedAccountId: accountId
                    }
                },
                update: {
                    amountEncrypted,
                    avgPriceEncrypted
                },
                create: {
                    userId,
                    assetType: 'stock',
                    assetSymbol: tickerSymbol,
                    predefinedAccountId: accountId,
                    amountEncrypted,
                    avgPriceEncrypted
                }
            });
        }

        // Clean up orphaned assets for this ticker (assets with null accounts that shouldn't exist anymore if entries are now linked)
        const activeAccountIds = Object.keys(entriesByAccount).map(id => id === 'null' ? null : id);
        await prisma.asset.deleteMany({
            where: {
                userId,
                assetType: 'stock',
                assetSymbol: tickerSymbol,
                predefinedAccountId: { notIn: activeAccountIds }
            }
        });
    }

    console.log('Migration complete.');
}

fixAccountLinkages()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
