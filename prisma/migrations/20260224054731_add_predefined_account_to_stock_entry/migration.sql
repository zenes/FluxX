-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "lastLoginAt" DATETIME,
    "lastActiveAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "assetSymbol" TEXT,
    "amountEncrypted" TEXT NOT NULL,
    "avgPriceEncrypted" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Asset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "brokerName" TEXT NOT NULL,
    "accountOwner" TEXT NOT NULL,
    "accountNumber" TEXT,
    "tickerSymbol" TEXT NOT NULL,
    "predefinedAccountId" TEXT,
    "quantity" REAL NOT NULL,
    "totalPurchaseAmount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StockEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StockEntry_predefinedAccountId_fkey" FOREIGN KEY ("predefinedAccountId") REFERENCES "PredefinedAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PredefinedAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "broker" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PredefinedAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_userId_assetType_assetSymbol_key" ON "Asset"("userId", "assetType", "assetSymbol");

-- CreateIndex
CREATE INDEX "StockEntry_userId_tickerSymbol_idx" ON "StockEntry"("userId", "tickerSymbol");

-- CreateIndex
CREATE INDEX "PredefinedAccount_userId_idx" ON "PredefinedAccount"("userId");
