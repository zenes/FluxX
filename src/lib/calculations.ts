import { AssetItem } from "@/lib/actions";

export type MarketPrices = {
    usdKrw: number;
    goldUsd: number;
    stockPrices: Record<string, { price: number; currency: string; changePercent?: number; shortName?: string }>;
};

export function calculateNetWorth(assets: AssetItem[], prices: MarketPrices): number {
    const { usdKrw, goldUsd, stockPrices } = prices;

    const sumAmount = (type: string) =>
        assets
            .filter((a) => a.assetType === type)
            .reduce((sum, current) => sum + current.amount, 0);

    const goldAmount = sumAmount('gold');
    const usdAmount = sumAmount('usd');
    const krwAmount = sumAmount('krw');

    // Convert gold to KRW: (grams / troy_ounce_grams) * price_usd * usd_krw
    const goldKrw = (goldAmount / 31.1034768) * goldUsd * usdKrw;
    const usdKrwVal = usdAmount * usdKrw;

    let totalStockKrw = 0;
    assets
        .filter((a) => a.assetType === 'stock' && a.assetSymbol)
        .forEach((stock) => {
            const symbol = stock.assetSymbol!;
            const priceData = stockPrices[symbol];
            const currentPrice = priceData ? priceData.price : (stock.avgPrice || 0);
            const currency = stock.currency || priceData?.currency || 'USD';

            const valueInOriginalCurrency = stock.amount * currentPrice;

            if (currency === 'KRW') {
                totalStockKrw += valueInOriginalCurrency;
            } else {
                totalStockKrw += valueInOriginalCurrency * usdKrw;
            }
        });

    return goldKrw + usdKrwVal + krwAmount + totalStockKrw;
}
