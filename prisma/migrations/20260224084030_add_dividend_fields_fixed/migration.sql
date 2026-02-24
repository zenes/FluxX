-- AlterTable
ALTER TABLE "StockEntry" ADD COLUMN "dividendFrequency" INTEGER;
ALTER TABLE "StockEntry" ADD COLUMN "dividendMonths" TEXT;
ALTER TABLE "StockEntry" ADD COLUMN "dividendPerShare" REAL;

-- CreateTable
CREATE TABLE "DividendRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tickerSymbol" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "receivedAt" DATETIME NOT NULL,
    "taxAmount" REAL,
    "stockEntryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DividendRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DividendRecord_stockEntryId_fkey" FOREIGN KEY ("stockEntryId") REFERENCES "StockEntry" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DividendRecord_userId_tickerSymbol_idx" ON "DividendRecord"("userId", "tickerSymbol");
