import { getAssets } from "@/lib/actions";
import DashboardClient from "@/components/DashboardClient";
import yahooFinanceDefault from 'yahoo-finance2';

const yahooFinance = typeof yahooFinanceDefault === 'function'
  // @ts-ignore
  ? new yahooFinanceDefault()
  : yahooFinanceDefault;

// Revalidate every minute
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
    console.error("Failed to fetch initial market data:", e);
    return { exchange: null, gold: null };
  }
}

export default async function Home() {
  const [assets, marketData] = await Promise.all([
    getAssets(),
    getInitialMarketData()
  ]);

  return (
    <div className="flex flex-col h-full bg-background">
      <DashboardClient
        initialAssets={assets}
        initialExchange={marketData.exchange}
        initialGold={marketData.gold}
      />
    </div>
  );
}
