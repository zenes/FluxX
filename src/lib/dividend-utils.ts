import { AssetItem } from './actions';

export interface DividendStockBreakdown {
    symbol: string;
    amount: number;
    amountUsd?: number;
    currency: string;
    holdingsQuantity?: number;
    dividendPerShare?: number;
    date?: string;
    type?: string;
    frequency?: number;
    frequencyMonths?: string;
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

export function calculateHistoricalMonthlyDividends(records: any[], exchangeRate: number) {
    const historicalMonthlyData: MonthlyDividend[] = Array.from({ length: 12 }, (_, i) => ({
        month: i,
        amount: 0,
        stocks: []
    }));

    const currentYear = new Date().getFullYear();

    records.forEach(record => {
        const receivedAt = new Date(record.receivedAt);
        if (receivedAt.getFullYear() !== currentYear) return;

        const month = receivedAt.getMonth();
        const amount = record.amount || 0;
        const amountInKrw = record.currency === 'USD' ? amount * exchangeRate : amount;

        historicalMonthlyData[month].amount += amountInKrw;

        const existingStock = historicalMonthlyData[month].stocks.find(s => s.symbol === record.tickerSymbol);
        if (existingStock) {
            existingStock.amount += amountInKrw;
        } else {
            historicalMonthlyData[month].stocks.push({
                symbol: record.tickerSymbol,
                amount: amountInKrw,
                currency: record.currency
            });
        }
    });

    const historicalAnnualTotal = historicalMonthlyData.reduce((sum, data) => sum + data.amount, 0);
    const allTimeTotal = records.reduce((sum, record) => {
        const amount = record.amount || 0;
        const amountInKrw = record.currency === 'USD' ? amount * exchangeRate : amount;
        return sum + amountInKrw;
    }, 0);

    return {
        historicalMonthlyData,
        historicalAnnualTotal,
        allTimeTotal
    };
}
export interface YearlyHistoricalDividend {
    year: number;
    totalAmount: number;
    months: MonthlyDividend[];
}

export function calculateHistoricalYearlyDividends(records: any[], exchangeRate: number, assets: any[] = []) {
    const yearlyMap = new Map<number, YearlyHistoricalDividend>();

    // Helper to find frequency info from assets
    const findFrequencyInfo = (symbol: string) => {
        const asset = assets.find(a => a.assetSymbol === symbol);
        if (asset && asset.entries && asset.entries.length > 0) {
            // Take info from the first entry that has frequency info
            const entry = asset.entries.find((e: any) => e.dividendFrequency || e.dividendMonths);
            if (entry) {
                return {
                    frequency: entry.dividendFrequency,
                    frequencyMonths: entry.dividendMonths
                };
            }
        }
        return { frequency: undefined, frequencyMonths: undefined };
    };

    records.forEach(record => {
        const receivedAt = new Date(record.receivedAt);
        const year = receivedAt.getFullYear();
        const month = receivedAt.getMonth();
        const amount = record.amount || 0;
        const amountInKrw = record.currency === 'USD' ? amount * exchangeRate : amount;

        if (!yearlyMap.has(year)) {
            yearlyMap.set(year, {
                year,
                totalAmount: 0,
                months: Array.from({ length: 12 }, (_, i) => ({
                    month: i,
                    amount: 0,
                    stocks: []
                }))
            });
        }

        const yearData = yearlyMap.get(year)!;
        yearData.totalAmount += amountInKrw;
        
        const monthData = yearData.months[month];
        monthData.amount += amountInKrw;

        const { frequency, frequencyMonths } = findFrequencyInfo(record.tickerSymbol);

        // Since we want a detailed breakdown per record in the UI, we might actually want to 
        // keep records separate or at least store more info.
        // For the new UI, let's append to the stocks list even if same symbol exists, 
        // but maybe we should rename it to 'records' or just use it as a list of entries.
        monthData.stocks.push({
            symbol: record.tickerSymbol,
            amount: amountInKrw,
            amountUsd: record.currency === 'USD' ? amount : undefined,
            currency: record.currency,
            holdingsQuantity: record.holdingsQuantity,
            dividendPerShare: record.dividendPerShare,
            date: record.receivedAt ? new Date(record.receivedAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }) : undefined,
            type: record.type,
            frequency,
            frequencyMonths
        });
    });

    // Convert map to array and sort by year descending
    const yearlyData = Array.from(yearlyMap.values()).sort((a, b) => b.year - a.year);
    
    // Sort stocks in each month by amount descending
    yearlyData.forEach(year => {
        year.months.forEach(month => {
            month.stocks.sort((a, b) => b.amount - a.amount);
        });
    });

    return yearlyData;
}
