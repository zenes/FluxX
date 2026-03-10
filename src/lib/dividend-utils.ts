import { AssetItem } from './actions';

export interface DividendStockBreakdown {
    symbol: string;
    amount: number;
    currency: string;
}

export interface MonthlyDividend {
    month: number; // 0-11
    amount: number;
    stocks: DividendStockBreakdown[];
}

export function calculateMonthlyDividends(assets: AssetItem[], exchangeRate: number) {
    const monthlyData: MonthlyDividend[] = Array.from({ length: 12 }, (_, i) => ({
        month: i,
        amount: 0,
        stocks: []
    }));

    assets.forEach(asset => {
        if (asset.assetType !== 'stock' || !asset.entries) return;

        asset.entries.forEach(entry => {
            const dps = entry.dividendPerShare || 0;
            const qty = entry.qty || 0;
            const freq = entry.dividendFrequency || 0;
            const monthsStr = entry.dividendMonths || "";

            if (dps <= 0 || qty <= 0) return;

            let targetMonths: number[] = [];

            if (monthsStr) {
                // Parse "1, 4, 7, 10" -> [0, 3, 6, 9] (0-indexed)
                targetMonths = monthsStr
                    .split(',')
                    .map(m => parseInt(m.trim()) - 1)
                    .filter(m => !isNaN(m) && m >= 0 && m < 12);
            } else if (freq > 0) {
                // Fallback for frequency if months aren't specified
                if (freq === 12) {
                    targetMonths = Array.from({ length: 12 }, (_, i) => i);
                } else if (freq === 4) {
                    // Default quarterly to 1, 4, 7, 10 if not specified
                    targetMonths = [0, 3, 6, 9];
                } else if (freq === 2) {
                    // Default semi-annual to 1, 7
                    targetMonths = [0, 6];
                } else if (freq === 1) {
                    // Default annual to 1
                    targetMonths = [0];
                }
            }

            targetMonths.forEach(m => {
                const dividendAmount = dps * qty;
                const amountInKrw = entry.currency === 'USD' ? dividendAmount * exchangeRate : dividendAmount;
                
                monthlyData[m].amount += amountInKrw;
                
                // Group by symbol in the breakdown
                const existingStock = monthlyData[m].stocks.find(s => s.symbol === asset.assetSymbol);
                if (existingStock) {
                    existingStock.amount += amountInKrw;
                } else {
                    monthlyData[m].stocks.push({
                        symbol: asset.assetSymbol || 'Unknown',
                        amount: amountInKrw,
                        currency: entry.currency || 'KRW'
                    });
                }
            });
        });
    });

    // Calculate annual total
    const annualTotal = monthlyData.reduce((sum, data) => sum + data.amount, 0);

    // Sort stocks in each month by amount descending
    monthlyData.forEach(data => {
        data.stocks.sort((a, b) => b.amount - a.amount);
    });

    return {
        monthlyData,
        annualTotal
    };
}
