import { getAssets } from "@/lib/actions";
import yahooFinanceDefault from 'yahoo-finance2';
import SimpleModeV2Container from '@/components/mobile/v2/SimpleModeV2Container';

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

export default async function SimpleModeV2Page() {
    const [assets, marketData] = await Promise.all([
        getAssets(),
        getInitialMarketData()
    ]);

    console.log('SimpleModeV2Page [Server]: Fetched', assets.length, 'assets');
    if (assets.length > 0) {
        console.log('SimpleModeV2Page [Server]: First asset sample:', assets[0]);
    }

    return (
        <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#121214]">
            <SimpleModeV2Container
                assets={assets}
                marketData={marketData}
            />
        </div>
    );
}
