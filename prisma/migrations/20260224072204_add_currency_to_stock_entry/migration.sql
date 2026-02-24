-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StockEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "brokerName" TEXT NOT NULL,
    "accountOwner" TEXT NOT NULL,
    "accountNumber" TEXT,
    "tickerSymbol" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "predefinedAccountId" TEXT,
    "quantity" REAL NOT NULL,
    "totalPurchaseAmount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StockEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StockEntry_predefinedAccountId_fkey" FOREIGN KEY ("predefinedAccountId") REFERENCES "PredefinedAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_StockEntry" ("accountNumber", "accountOwner", "brokerName", "createdAt", "id", "predefinedAccountId", "quantity", "tickerSymbol", "totalPurchaseAmount", "updatedAt", "userId") SELECT "accountNumber", "accountOwner", "brokerName", "createdAt", "id", "predefinedAccountId", "quantity", "tickerSymbol", "totalPurchaseAmount", "updatedAt", "userId" FROM "StockEntry";
DROP TABLE "StockEntry";
ALTER TABLE "new_StockEntry" RENAME TO "StockEntry";
CREATE INDEX "StockEntry_userId_tickerSymbol_idx" ON "StockEntry"("userId", "tickerSymbol");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
