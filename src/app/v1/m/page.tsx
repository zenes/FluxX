import { getAssets, getMemos, getAllAssetMemos } from "@/lib/actions";
import MobileDashboard from "@/components/mobile/MobileDashboard";
import yahooFinanceDefault from 'yahoo-finance2';

const yahooFinance = typeof yahooFinanceDefault === 'function'
    // @ts-ignore
    ? new yahooFinanceDefault()
    : yahooFinanceDefault;

export const revalidate = 60;

async function getInitialMarketData() {
    try {
        const [fxQuote, goldQuote] = await Promise.all([
            yahooFinance.quote('KRW=X'),
            yahooFinance.quote('GC=F')
        ]);
        return {
            exchange: fxQuote ? {
                rate: fxQuote.regularMarketPrice,
                change: fxQuote.regularMarketChange,
                changePercent: fxQuote.regularMarketChangePercent,
                timestamp: new Date().toISOString()
            } : null,
            gold: goldQuote ? {
                price: goldQuote.regularMarketPrice,
                change: goldQuote.regularMarketChange,
                changePercent: goldQuote.regularMarketChangePercent,
                timestamp: new Date().toISOString()
            } : null
        };
    } catch (e) {
        return { exchange: null, gold: null };
    }
}

export default async function MobileHome() {
    const [assets, marketData, memos, assetMemos] = await Promise.all([
        getAssets(),
        getInitialMarketData(),
        getMemos(),
        getAllAssetMemos()
    ]);

    return (
        <MobileDashboard
            initialAssets={assets}
            initialExchange={marketData.exchange}
            initialGold={marketData.gold}
            initialMemos={memos}
            initialAssetMemos={assetMemos}
        />
    );
}
