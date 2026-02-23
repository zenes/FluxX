"use client";

import { useEffect, useState } from "react";
import ExchangeRateChart from "@/components/ExchangeRateChart";

export default function Home() {
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [rateChange, setRateChange] = useState<number | null>(null);
  const [rateChangePercent, setRateChangePercent] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showChart, setShowChart] = useState(false);

  const fetchExchangeRate = async () => {
    try {
      const res = await fetch('/api/exchange-rate');
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      setExchangeRate(data.rate);
      setRateChange(data.change);
      setRateChangePercent(data.changePercent);

      const date = new Date(data.timestamp);
      setLastUpdated(date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExchangeRate();
    const intervalId = setInterval(fetchExchangeRate, 60000); // Poll every 1 minute
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6">
        <div className="flex flex-1 items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-sm bg-primary text-primary-foreground font-bold text-xs shadow-md">
            FX
          </div>
          <span className="text-sm font-semibold tracking-wide text-foreground uppercase">FluxX Command Center</span>
        </div>
        <nav className="flex gap-4">
          <a href="#" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">Dashboard</a>
          <a href="#" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">Operations</a>
          <a href="#" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">Intelligence</a>
        </nav>
      </header>

      <main className="flex-1 p-6 md:p-8 bg-background">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
            <p className="text-sm text-muted-foreground mt-1">Global system status and active operations.</p>
          </div>
          <button className="inline-flex items-center justify-center whitespace-nowrap rounded-sm text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 py-2 shadow-[0_0_10px_rgba(59,130,246,0.3)]">
            Deploy Unit
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-md border bg-card text-card-foreground shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/80"></div>
            <div className="p-5 flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Nodes</span>
              <span className="text-3xl font-bold tracking-tight text-foreground">1,248</span>
              <span className="text-xs text-primary mt-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                System nominal
              </span>
            </div>
          </div>
          <div className="rounded-md border bg-card text-card-foreground shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-destructive/80"></div>
            <div className="p-5 flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Anomalies Detected</span>
              <span className="text-3xl font-bold tracking-tight text-destructive">12</span>
              <span className="text-xs text-muted-foreground mt-2">Requires immediate attention</span>
            </div>
          </div>
          <div
            className="rounded-md border bg-card text-card-foreground shadow-sm relative overflow-hidden cursor-pointer hover:bg-muted/20 transition-colors"
            onClick={() => setShowChart(!showChart)}
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-accent/80"></div>
            <div className="p-5 flex flex-col gap-1 h-full">
              <div className="flex justify-between items-start">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  USD/KRW Exchange
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-sm group-hover:bg-primary/20 transition-colors">{showChart ? 'Hide Trend' : 'View Trend'}</span>
                </span>
                {isLoading && (
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                )}
              </div>

              {isLoading && exchangeRate === null ? (
                <div className="mt-2 text-xl font-bold tracking-tight text-muted-foreground animate-pulse">
                  Establishing uplink...
                </div>
              ) : (
                <>
                  <span className="text-3xl font-bold tracking-tight text-foreground mt-2">
                    {exchangeRate ? `₩${exchangeRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
                  </span>

                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs font-medium ${rateChange && rateChange > 0
                      ? 'text-destructive'
                      : rateChange && rateChange < 0
                        ? 'text-primary'
                        : 'text-muted-foreground'
                      }`}>
                      {rateChange && rateChange > 0 ? '▲' : rateChange && rateChange < 0 ? '▼' : '-'}
                      {rateChange ? Math.abs(rateChange).toFixed(2) : '0.00'}
                      ({rateChangePercent ? (rateChangePercent >= 0 ? '+' : '') + rateChangePercent.toFixed(2) : '0.00'}%)
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-auto uppercase opacity-70">
                      L/U: {lastUpdated || 'Unknown'}
                    </span>
                  </div>
                </>
              )}

              {showChart && !isLoading && exchangeRate !== null && (
                <div onClick={(e) => e.stopPropagation()}>
                  <ExchangeRateChart currentRate={exchangeRate} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-md border bg-card text-card-foreground shadow-sm">
          <div className="p-5 border-b">
            <h3 className="text-sm font-medium">Recent Activity Log</h3>
          </div>
          <div className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Timestamp</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Event ID</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Severity</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle text-xs text-muted-foreground font-mono">14:26:03.192Z</td>
                  <td className="p-4 align-middle font-mono text-xs">EVT-9982-A</td>
                  <td className="p-4 align-middle"><span className="inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/20 text-primary">INFO</span></td>
                  <td className="p-4 align-middle text-xs">Routine synchronization completed for sector 7G.</td>
                </tr>
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle text-xs text-muted-foreground font-mono">14:15:42.005Z</td>
                  <td className="p-4 align-middle font-mono text-xs">EVT-9981-D</td>
                  <td className="p-4 align-middle"><span className="inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-destructive/20 text-destructive">WARN</span></td>
                  <td className="p-4 align-middle text-xs">Latency spike detected in communication relay alpha.</td>
                </tr>
                <tr className="transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle text-xs text-muted-foreground font-mono">13:58:11.753Z</td>
                  <td className="p-4 align-middle font-mono text-xs">EVT-9980-C</td>
                  <td className="p-4 align-middle"><span className="inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">DEBUG</span></td>
                  <td className="p-4 align-middle text-xs">Payload inspection trace completed.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
