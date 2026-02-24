"use client";

import { useEffect, useState } from "react";
import ExchangeRateChart from "@/components/ExchangeRateChart";
import GoldPriceChart from "@/components/GoldPriceChart";
import AuthButton from "@/components/AuthButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAssets } from "@/lib/actions";
import { Moon, Sun, Monitor, Terminal, Menu, X } from "lucide-react";

type GoldType = 'global' | 'krx';

export default function Home() {
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [rateChange, setRateChange] = useState<number | null>(null);
  const [rateChangePercent, setRateChangePercent] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showChart, setShowChart] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Gold state
  const [goldType, setGoldType] = useState<GoldType>('global');
  const [goldPrice, setGoldPrice] = useState<number | null>(null);
  const [goldChange, setGoldChange] = useState<number | null>(null);
  const [goldChangePercent, setGoldChangePercent] = useState<number | null>(null);
  const [goldLastUpdated, setGoldLastUpdated] = useState<string | null>(null);
  const [isGoldLoading, setIsGoldLoading] = useState(true);
  const [showGoldChart, setShowGoldChart] = useState(false);

  // Portfolio state
  const [netWorth, setNetWorth] = useState<number | null>(null);
  const [isNetWorthLoading, setIsNetWorthLoading] = useState(true);

  // Drag and Drop state
  const [cardsOrder, setCardsOrder] = useState(['portfolio', 'gold', 'exchange']);
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const savedOrder = localStorage.getItem('fluxx-dashboard-cards');
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        // Map any old 'nodes' to 'portfolio' for seamless update
        setCardsOrder(parsed.map((item: string) => item === 'nodes' ? 'portfolio' : item));
      } catch (e) { }
    }
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(cardsOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setCardsOrder(items);
    localStorage.setItem('fluxx-dashboard-cards', JSON.stringify(items));
  };

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

  const fetchGoldPrice = async () => {
    try {
      setIsGoldLoading(true);
      const res = await fetch(`/api/gold-price?type=${goldType}`);
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      setGoldPrice(data.price);
      setGoldChange(data.change);
      setGoldChangePercent(data.changePercent);

      const date = new Date(data.timestamp);
      setGoldLastUpdated(date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (error) {
      console.error('Error fetching gold price:', error);
    } finally {
      setIsGoldLoading(false);
    }
  };

  const fetchNetWorth = async () => {
    try {
      setIsNetWorthLoading(true);
      const assets = await getAssets();

      const stockSymbols = assets.filter(a => a.assetType === 'stock' && a.assetSymbol).map(a => a.assetSymbol).join(',');

      const [fxRes, goldRes, stockRes] = await Promise.all([
        fetch('/api/exchange-rate').then(r => r.json()).catch(() => ({})),
        fetch('/api/gold-price?market=global').then(r => r.json()).catch(() => ({})),
        stockSymbols ? fetch(`/api/stock-price?symbols=${stockSymbols}`).then(r => r.json()).catch(() => ({})) : Promise.resolve({})
      ]);

      const usdKrw = fxRes?.rate || 1400;
      const goldUsd = goldRes?.price || 2600;
      const stockPrices = stockRes?.quotes || {};

      // Sum all matching assets in case there are multiple entries (e.g., across different accounts)
      const sumAmount = (type: string) => assets.filter(a => a.assetType === type).reduce((sum, current) => sum + current.amount, 0);

      const goldAmount = sumAmount('gold');
      const usdAmount = sumAmount('usd');
      const krwAmount = sumAmount('krw');

      const goldKrw = (goldAmount / 31.1034768) * goldUsd * usdKrw;
      const usdKrwVal = usdAmount * usdKrw;

      let totalStockKrw = 0;
      assets.filter(a => a.assetType === 'stock' && a.assetSymbol).forEach(stock => {
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

      setNetWorth(goldKrw + usdKrwVal + krwAmount + totalStockKrw);
    } catch (error) {
      console.error('Error fetching net worth:', error);
    } finally {
      setIsNetWorthLoading(false);
    }
  };

  useEffect(() => {
    fetchExchangeRate();
    const intervalId = setInterval(fetchExchangeRate, 60000); // Poll every 1 minute
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  useEffect(() => {
    fetchNetWorth();
    const intervalId = setInterval(fetchNetWorth, 60000); // Poll every 1 minute
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  useEffect(() => {
    fetchGoldPrice();
    const intervalId = setInterval(fetchGoldPrice, 60000); // Poll every 1 minute
    return () => clearInterval(intervalId);
  }, [goldType]); // Refetch when type changes

  const renderCard = (cardId: string, provided: any, snapshot: any) => {
    if (cardId === 'portfolio') {
      return (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{ ...provided.draggableProps.style }}
          className={`rounded-md border bg-card text-card-foreground shadow-sm relative overflow-hidden flex flex-col h-full cursor-pointer hover:bg-muted/20 transition-all ${snapshot.isDragging ? 'shadow-2xl scale-[1.02] z-50 ring-1 ring-primary' : ''}`}
          onClick={() => router.push('/operations')}
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/80"></div>
          <div className="p-5 flex flex-col gap-1 h-full">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <span {...provided.dragHandleProps} className="cursor-grab hover:text-foreground text-muted-foreground/50 transition-colors" onClick={(e) => e.stopPropagation()}>⠿</span>
              Total Asset Value
            </span>
            <div className="mt-1 flex-1 flex flex-col justify-center">
              {isNetWorthLoading && netWorth === null ? (
                <span className="flex h-10 w-32 items-center bg-muted/50 rounded-sm animate-pulse"></span>
              ) : (
                <span className="text-xl md:text-3xl font-bold tracking-tight text-foreground">
                  ₩{(netWorth || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              )}
            </div>
            <span className="text-xs text-primary mt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Live Sync
            </span>
          </div>
        </div>
      );
    }

    if (cardId === 'gold') {
      return (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{ ...provided.draggableProps.style }}
          className={`rounded-md border bg-card text-card-foreground shadow-sm relative overflow-hidden cursor-pointer hover:bg-muted/20 transition-all ${snapshot.isDragging ? 'shadow-2xl scale-[1.02] z-50 ring-1 ring-destructive' : ''}`}
          onClick={() => setShowGoldChart(!showGoldChart)}
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-destructive/80"></div>
          <div className="p-5 flex flex-col gap-1 h-full">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <span {...provided.dragHandleProps} className="cursor-grab hover:text-foreground text-muted-foreground/50 transition-colors" onClick={(e) => e.stopPropagation()}>⠿</span>
                  Gold Market Price
                </span>
                <div
                  className="flex text-[10px] bg-muted rounded-sm overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className={`px-1.5 py-0.5 ${goldType === 'krx' ? 'bg-destructive text-destructive-foreground' : 'hover:bg-muted-foreground/20'}`}
                    onClick={() => setGoldType('krx')}
                  >
                    KRX
                  </button>
                  <button
                    className={`px-1.5 py-0.5 ${goldType === 'global' ? 'bg-destructive text-destructive-foreground' : 'hover:bg-muted-foreground/20'}`}
                    onClick={() => setGoldType('global')}
                  >
                    GLB
                  </button>
                </div>
              </div>
              {isGoldLoading && (
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                </span>
              )}
            </div>

            {isGoldLoading && goldPrice === null ? (
              <div className="mt-2 text-xl font-bold tracking-tight text-muted-foreground animate-pulse">
                Uplink...
              </div>
            ) : (
              <>
                <span className="text-xl md:text-3xl font-bold tracking-tight text-foreground mt-2">
                  {goldType === 'krx' ? '₩' : '$'}
                  {goldPrice ? goldPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}
                </span>

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`text-xs font-medium ${goldChange && goldChange > 0
                    ? 'text-destructive'
                    : goldChange && goldChange < 0
                      ? 'text-primary'
                      : 'text-muted-foreground'
                    }`}>
                    {goldChange && goldChange > 0 ? '▲' : goldChange && goldChange < 0 ? '▼' : '-'}
                    {goldChange ? Math.abs(goldChange).toFixed(2) : '0.00'}
                    ({goldChangePercent ? (goldChangePercent >= 0 ? '+' : '') + goldChangePercent.toFixed(2) : '0.00'}%)
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-auto uppercase opacity-70">
                    {goldLastUpdated || 'Unknown'}
                  </span>
                </div>
              </>
            )}

            {showGoldChart && goldPrice !== null && (
              <div onClick={(e) => e.stopPropagation()} className="mt-4">
                <GoldPriceChart currentRate={goldPrice} type={goldType} />
              </div>
            )}
          </div>
        </div>
      );
    }

    if (cardId === 'exchange') {
      return (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{ ...provided.draggableProps.style }}
          className={`rounded-md border bg-card text-card-foreground shadow-sm relative overflow-hidden cursor-pointer hover:bg-muted/20 transition-all ${snapshot.isDragging ? 'shadow-2xl scale-[1.02] z-50 ring-1 ring-accent' : ''}`}
          onClick={() => setShowChart(!showChart)}
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-accent/80"></div>
          <div className="p-5 flex flex-col gap-1 h-full">
            <div className="flex justify-between items-start">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <span {...provided.dragHandleProps} className="cursor-grab hover:text-foreground text-muted-foreground/50 transition-colors" onClick={(e) => e.stopPropagation()}>⠿</span>
                USD/KRW
                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-sm group-hover:bg-primary/20 transition-colors ml-1 hidden sm:inline-block">{showChart ? 'Hide' : 'Trend'}</span>
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
                Uplink...
              </div>
            ) : (
              <>
                <span className="text-xl md:text-3xl font-bold tracking-tight text-foreground mt-2">
                  {exchangeRate ? `₩${exchangeRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
                </span>

                <div className="flex items-center gap-2 mt-2 flex-wrap">
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
                    {lastUpdated || 'Unknown'}
                  </span>
                </div>
              </>
            )}

            {showChart && !isLoading && exchangeRate !== null && (
              <div onClick={(e) => e.stopPropagation()} className="mt-4">
                <ExchangeRateChart currentRate={exchangeRate} />
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-full bg-background">

      <main className="flex-1 p-4 md:p-8 bg-background">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
            <p className="text-sm text-muted-foreground mt-1">Global system status.</p>
          </div>
          <button className="inline-flex items-center justify-center whitespace-nowrap rounded-sm text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 shadow-[0_0_10px_rgba(59,130,246,0.3)] w-full sm:w-auto">
            Deploy Unit
          </button>
        </div>

        {!isMounted ? (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-[140px] rounded-md border bg-card w-full shadow-sm animate-pulse"></div>
            <div className="h-[140px] rounded-md border bg-card w-full shadow-sm animate-pulse"></div>
            <div className="h-[140px] rounded-md border bg-card w-full shadow-sm animate-pulse"></div>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="dashboard-cards" direction={isMobile ? "vertical" : "horizontal"}>
              {(provided) => (
                <div
                  className="grid gap-4 grid-cols-1 md:grid-cols-3 select-none"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {cardsOrder.map((cardId, index) => (
                    <Draggable key={cardId} draggableId={cardId} index={index}>
                      {(provided, snapshot) => renderCard(cardId, provided, snapshot)}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

        <div className="mt-6 rounded-md border bg-card text-card-foreground shadow-sm overflow-hidden">
          <div className="p-5 border-b flex justify-between items-center">
            <h3 className="text-sm font-medium">Recent Activity Log</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-[10px] tracking-wider whitespace-nowrap">Timestamp</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-[10px] tracking-wider whitespace-nowrap">Event ID</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-[10px] tracking-wider whitespace-nowrap">Severity</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-[10px] tracking-wider whitespace-nowrap">Details</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle text-xs text-muted-foreground font-mono whitespace-nowrap">14:26:03.192Z</td>
                  <td className="p-4 align-middle font-mono text-xs">EVT-9982-A</td>
                  <td className="p-4 align-middle"><span className="inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/20 text-primary">INFO</span></td>
                  <td className="p-4 align-middle text-xs min-w-[200px]">Routine synchronization completed for sector 7G.</td>
                </tr>
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle text-xs text-muted-foreground font-mono whitespace-nowrap">14:15:42.005Z</td>
                  <td className="p-4 align-middle font-mono text-xs">EVT-9981-D</td>
                  <td className="p-4 align-middle"><span className="inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-destructive/20 text-destructive">WARN</span></td>
                  <td className="p-4 align-middle text-xs min-w-[200px]">Latency spike detected in communication relay alpha.</td>
                </tr>
                <tr className="transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle text-xs text-muted-foreground font-mono whitespace-nowrap">13:58:11.753Z</td>
                  <td className="p-4 align-middle font-mono text-xs">EVT-9980-C</td>
                  <td className="p-4 align-middle"><span className="inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">DEBUG</span></td>
                  <td className="p-4 align-middle text-xs min-w-[200px]">Payload inspection trace completed.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
