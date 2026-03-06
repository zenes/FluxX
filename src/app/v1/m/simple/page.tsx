import { getAssets } from "@/lib/actions";
import yahooFinanceDefault from 'yahoo-finance2';
import SimpleModeContainer from '@/components/mobile/SimpleModeContainer';

const yahooFinance = typeof yahooFinanceDefault === 'function'
    // @ts-ignore
    ? new yahooFinanceDefault()
    : yahooFinanceDefault;

async function getInitialMarketData() {
    try {
        const [fxQuote, goldQuote] = await Promise.all([
            yahooFinance.quote('KRW=X'),
            yahooFinance.quote('GC=F')
        ]);
        return {
            exchange: fxQuote ? { rate: fxQuote.regularMarketPrice } : null,
            gold: goldQuote ? { price: goldQuote.regularMarketPrice } : null
        };
    } catch (e) {
        return { exchange: null, gold: null };
    }
}

export default async function SimpleModePage() {
    const [assets, marketData] = await Promise.all([
        getAssets(),
        getInitialMarketData()
    ]);

    const stockAssets = assets.filter(a => a.assetType === 'stock');

    return (
        <div className="p-4 pb-24">
            <SimpleModeContainer
                assets={assets}
                marketData={marketData}
            />
        </div>
    );
}
