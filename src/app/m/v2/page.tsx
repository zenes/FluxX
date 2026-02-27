import { getAssets, getPredefinedAccounts } from "@/lib/actions";
import yahooFinance from 'yahoo-finance2';
import SimpleModeV2Container from '@/components/mobile/v2/SimpleModeV2Container';

async function getInitialMarketData() {
    try {
        const [fxQuote, goldQuote, accounts] = await Promise.all([
            yahooFinance.quote('KRW=X'),
            yahooFinance.quote('GC=F'),
            getPredefinedAccounts()
        ]);
        return {
            exchange: fxQuote ? { rate: (fxQuote as any).regularMarketPrice } : null,
            gold: goldQuote ? { price: (goldQuote as any).regularMarketPrice } : null,
            accounts
        };
    } catch (e) {
        return { exchange: null, gold: null, accounts: [] };
    }
}

export default async function SimpleModeV2Page() {
    const [assets, marketData] = await Promise.all([
        getAssets(),
        getInitialMarketData()
    ]);

    return (
        <div className="min-h-screen bg-[#edf0f4] dark:bg-[#0D0D0E]">
            <SimpleModeV2Container
                assets={assets}
                marketData={marketData}
            />
        </div>
    );
}
