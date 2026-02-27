import { getAssets } from "@/lib/actions";
import yahooFinanceDefault from 'yahoo-finance2';
import SimpleModeCard from '@/components/mobile/SimpleModeCard';

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
        <div className="p-4 space-y-4 pb-24">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Simple Mode</h1>
                <p className="text-muted-foreground text-sm">보유 자산을 심플한 카드로 확인하세요.</p>
            </div>

            <div className="grid gap-4">
                {/* 1. Total Net Worth Card */}
                <SimpleModeCard
                    id={1}
                    initialAssets={assets}
                    initialExchange={marketData.exchange}
                    initialGold={marketData.gold}
                />

                {/* 2. Individual Stock Asset Cards */}
                {stockAssets.map((stock) => (
                    <SimpleModeCard
                        key={stock.id}
                        id={stock.id} // use stock.id for uniqueness
                        stockAsset={stock}
                        initialExchange={marketData.exchange}
                    />
                ))}

                {/* Fallback padding/empty state if no stocks */}
                {stockAssets.length === 0 && (
                    <p className="text-center text-zinc-400 py-10 text-sm font-medium">
                        표시할 주식 자산이 없습니다.
                    </p>
                )}
            </div>
        </div>
    );
}
