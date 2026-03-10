import { getAssets, getUserSettings, AssetItem, getPredefinedAccounts } from "@/lib/actions";
import SimpleModeV2Container from '@/components/v2/mobile/SimpleModeV2Container';
import { getStockQuotes } from "@/lib/stock-service";
import { getNormalizedTicker } from "@/lib/stock-utils";
import { getWatchlistStocks } from "@/lib/watchlist-actions";
import { getStockAliases } from "@/lib/stock-alias-actions";

async function getInitialMarketData(allSymbols: string[]) {
    try {
        const [quotes, accounts] = await Promise.all([
            getStockQuotes(allSymbols),
            getPredefinedAccounts()
        ]);

        const fxRate = quotes['KRW=X']?.price || 1400;
        const goldPrice = quotes['GC=F']?.price || 2600;

        return {
            exchange: { rate: fxRate },
            gold: { price: goldPrice },
            stockPrices: quotes,
            accounts
        };
    } catch (e) {
        return { exchange: null, gold: null, stockPrices: {}, accounts: [] };
    }
}

export default async function SimpleModeV2Page() {
    const [assets, watchlist, userSettings, stockAliases] = await Promise.all([
        getAssets(),
        getWatchlistStocks(),
        getUserSettings(),
        getStockAliases()
    ]);

    // Gather all unique symbols for initial pre-fetch
    const assetSymbols = assets
        .filter((a: AssetItem) => a.assetType === 'stock' && a.assetSymbol)
        .map((a: AssetItem) => getNormalizedTicker(a.assetSymbol));
    const watchlistSymbols = watchlist.map((s: { ticker: string }) => getNormalizedTicker(s.ticker));

    const allSymbols = Array.from(new Set([
        'KRW=X',
        'GC=F',
        ...assetSymbols,
        ...watchlistSymbols
    ])).filter(Boolean) as string[];

    const marketData = await getInitialMarketData(allSymbols);

    return (
        <div className="min-h-screen bg-[#edf0f4] dark:bg-[#0D0D0E]">
            <SimpleModeV2Container
                assets={assets}
                marketData={marketData}
                initialHideAssets={userSettings.hideAssets}
                stockAliases={stockAliases}
            />
        </div>
    );
}
