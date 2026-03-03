import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth();
        // Allow in development OR if session exists
        if (process.env.NODE_ENV !== "development" && (!session || !session.user)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Determine user ID to export. If in dev and no session, use first user
        let userIdToExport = session?.user?.id;

        if (!userIdToExport && process.env.NODE_ENV === "development") {
            const firstUser = await prisma.user.findFirst();
            if (firstUser) {
                userIdToExport = firstUser.id;
            }
        }

        if (!userIdToExport) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Fetch all data for the user
        const user = await prisma.user.findUnique({
            where: { id: userIdToExport },
            include: {
                predefinedAccounts: true,
                assets: true,
                stockEntries: true,
                dividendRecords: true,
                watchlistStocks: true,
                memos: true,
                assetMemos: true,
            }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        let csvData = "";

        const escapeCsvField = (field: any) => {
            if (field === null || field === undefined) return "";
            const stringField = String(field);
            if (stringField.includes(",") || stringField.includes('"') || stringField.includes("\n")) {
                return `"${stringField.replace(/"/g, '""')}"`;
            }
            return stringField;
        };

        const addTableToCsv = (title: string, data: any[], visibleFields: string[]) => {
            csvData += `\n--- ${title} ---\n`;
            if (data.length === 0) {
                csvData += "No Records\n";
                return;
            }

            // Header
            csvData += visibleFields.join(",") + "\n";

            // Rows
            data.forEach(row => {
                const rowData = visibleFields.map(field => escapeCsvField(row[field]));
                csvData += rowData.join(",") + "\n";
            });
        };

        // 1. User Profile
        csvData += `--- USER PROFILE ---\n`;
        csvData += `ID,Email,Role,HideAssets,CreatedAt\n`;
        csvData += `${escapeCsvField(user.id)},${escapeCsvField(user.email)},${escapeCsvField(user.role)},${user.hideAssets},${escapeCsvField(user.createdAt.toISOString())}\n`;

        // 2. Predefined Accounts
        addTableToCsv("PREDEFINED ACCOUNTS", user.predefinedAccounts, ["id", "alias", "broker", "accountNumber", "owner", "createdAt"]);

        // 3. Assets
        addTableToCsv("ASSETS (CASH/GOLD/CRYPTO)", user.assets, ["id", "assetType", "assetSymbol", "amountEncrypted", "avgPriceEncrypted", "predefinedAccountId", "createdAt"]);

        // 4. Stock Entries
        addTableToCsv("STOCK ENTRIES", user.stockEntries, ["id", "brokerName", "accountOwner", "accountNumber", "tickerSymbol", "currency", "quantity", "totalPurchaseAmount", "dividendPerShare", "dividendFrequency", "dividendMonths", "predefinedAccountId", "createdAt"]);

        // 5. Dividend Records
        addTableToCsv("DIVIDEND RECORDS", user.dividendRecords, ["id", "tickerSymbol", "amount", "currency", "receivedAt", "taxAmount", "stockEntryId", "createdAt"]);

        // 6. Watchlist Stocks
        addTableToCsv("WATCHLIST STOCKS", user.watchlistStocks, ["id", "ticker", "type", "createdAt"]);

        // 7. Memos
        addTableToCsv("GENERAL MEMOS", user.memos, ["id", "content", "createdAt"]);

        // 8. Asset Memos
        addTableToCsv("ASSET MEMOS", user.assetMemos, ["id", "tickerSymbol", "content", "createdAt"]);

        // Add BOM for Excel compatibility with UTF-8
        const bom = "\uFEFF";

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        return new NextResponse(bom + csvData, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="fluxx-export-${timestamp}.csv"`,
            }
        });

    } catch (error) {
        console.error("[CSV Export API] Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
