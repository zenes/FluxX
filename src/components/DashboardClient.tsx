"use client";

import { useEffect, useState } from "react";
import ExchangeRateChart from "@/components/ExchangeRateChart";
import GoldPriceChart from "@/components/GoldPriceChart";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useRouter } from "next/navigation";
import { Activity, Zap } from "lucide-react";
import { AssetItem, getAssets, addMemo } from "@/lib/actions";
import { calculateNetWorth, MarketPrices } from "@/lib/calculations";

type GoldType = 'global' | 'krx';

interface DashboardClientProps {
    initialAssets: AssetItem[];
    initialExchange: any;
    initialGold: any;
    initialMemos: any[];
}

export default function DashboardClient({ initialAssets, initialExchange, initialGold, initialMemos }: DashboardClientProps) {
    const [memos, setMemos] = useState<any[]>(initialMemos);
    const [memoContent, setMemoContent] = useState("");
    const [isMemoSubmitting, setIsMemoSubmitting] = useState(false);
    const [exchangeRate, setExchangeRate] = useState<number | null>(initialExchange?.rate || null);
    const [rateChange, setRateChange] = useState<number | null>(initialExchange?.change || null);
    const [rateChangePercent, setRateChangePercent] = useState<number | null>(initialExchange?.changePercent || null);
    const [lastUpdated, setLastUpdated] = useState<string | null>(initialExchange?.timestamp ? new Date(initialExchange.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : null);
    const [isLoading, setIsLoading] = useState(false);
    const [showChart, setShowChart] = useState(false);

    // Gold state
    const [goldType, setGoldType] = useState<GoldType>('global');
    const [goldPrice, setGoldPrice] = useState<number | null>(initialGold?.price || null);
    const [goldChange, setGoldChange] = useState<number | null>(initialGold?.change || null);
    const [goldChangePercent, setGoldChangePercent] = useState<number | null>(initialGold?.changePercent || null);
    const [goldLastUpdated, setGoldLastUpdated] = useState<string | null>(initialGold?.timestamp ? new Date(initialGold.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : null);
    const [isGoldLoading, setIsGoldLoading] = useState(false);
    const [showGoldChart, setShowGoldChart] = useState(false);

    // Portfolio state
    const [assets, setAssets] = useState<AssetItem[]>(initialAssets);
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

    const updateNetWorth = async () => {
        try {
            setIsNetWorthLoading(true);
            const currentAssets = await getAssets();
            setAssets(currentAssets);

            const stockSymbols = currentAssets.filter(a => a.assetType === 'stock' && a.assetSymbol).map(a => a.assetSymbol).join(',');

            const [fxRes, goldRes, stockRes] = await Promise.all([
                fetch('/api/exchange-rate').then(r => r.json()).catch(() => ({})),
                fetch('/api/gold-price?market=global').then(r => r.json()).catch(() => ({})),
                stockSymbols ? fetch(`/api/stock-price?symbols=${stockSymbols}`).then(r => r.json()).catch(() => ({})) : Promise.resolve({})
            ]);

            const prices: MarketPrices = {
                usdKrw: fxRes?.rate || exchangeRate || 1400,
                goldUsd: goldRes?.price || 2600,
                stockPrices: stockRes?.quotes || {}
            };

            const totalValue = calculateNetWorth(currentAssets, prices);
            setNetWorth(totalValue);
        } catch (error) {
            console.error('Error updating net worth:', error);
        } finally {
            setIsNetWorthLoading(false);
        }
    };

    // Initial net worth calculation from initial props
    useEffect(() => {
        const initNetWorth = async () => {
            const stockSymbols = assets.filter(a => a.assetType === 'stock' && a.assetSymbol).map(a => a.assetSymbol).join(',');
            let stockRes = { quotes: {} };
            if (stockSymbols) {
                try {
                    const res = await fetch(`/api/stock-price?symbols=${stockSymbols}`);
                    stockRes = await res.json();
                } catch (e) { }
            }

            const prices: MarketPrices = {
                usdKrw: initialExchange?.rate || 1400,
                goldUsd: initialGold?.price || 2600,
                stockPrices: stockRes.quotes || {}
            };

            setNetWorth(calculateNetWorth(assets, prices));
            setIsNetWorthLoading(false);
        };

        if (assets.length > 0) {
            initNetWorth();
        } else {
            setNetWorth(0);
            setIsNetWorthLoading(false);
        }
    }, []);

    useEffect(() => {
        const intervalId = setInterval(fetchExchangeRate, 60000);
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        const intervalId = setInterval(updateNetWorth, 60000);
        return () => clearInterval(intervalId);
    }, [assets]);

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
                        <span className="text-2xl md:text-3xl font-bold tracking-tighter text-foreground">
                            ₩{(netWorth || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                    )}
                </div>
                <span className="text-xs text-primary mt-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                    Live Sync
                </span>
            </div>
        </div >
    );
}

if (cardId === 'gold') {
    return (
        <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            style={{ ...provided.draggableProps.style }}
            className={`rounded-md border bg-card text-card-foreground shadow-sm relative overflow-hidden cursor-pointer hover:bg-muted/20 transition-all ${snapshot.isDragging ? 'shadow-2xl scale-[1.02] z-50 ring-1 ring-primary' : ''}`}
            onClick={() => setShowGoldChart(!showGoldChart)}
        >
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/80"></div>
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
                                className={`px-1.5 py-0.5 ${goldType === 'krx' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted-foreground/20'}`}
                                onClick={() => setGoldType('krx')}
                            >
                                KRX
                            </button>
                            <button
                                className={`px-1.5 py-0.5 ${goldType === 'global' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted-foreground/20'}`}
                                onClick={() => setGoldType('global')}
                            >
                                GLB
                            </button>
                        </div>
                    </div>
                    {isGoldLoading && (
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                        </span>
                    )}
                </div>

                {isGoldLoading && goldPrice === null ? (
                    <div className="mt-2 text-xl font-bold tracking-tight text-muted-foreground animate-pulse">
                        Uplink...
                    </div>
                ) : (
                    <>
                        <span className="text-2xl md:text-3xl font-bold tracking-tighter text-foreground mt-2">
                            {goldType === 'krx' ? '₩' : '$'}
                            {goldPrice ? goldPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}
                        </span>

                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className={`text-xs font-medium ${goldChange && goldChange > 0
                                ? 'text-primary'
                                : goldChange && goldChange < 0
                                    ? 'text-destructive'
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
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-sm group-hover:bg-primary/20 transition-colors ml-1 hidden sm:inline-block">{showChart ? 'hide' : 'trend'}</span>
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
                        <span className="text-2xl md:text-3xl font-bold tracking-tighter text-foreground mt-2">
                            {exchangeRate ? `₩${exchangeRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
                        </span>

                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className={`text-xs font-medium ${rateChange && rateChange > 0
                                ? 'text-primary'
                                : rateChange && rateChange < 0
                                    ? 'text-destructive'
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
    <main className="flex-1 p-4 md:p-8 bg-background">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">overview</h1>
                <p className="text-sm text-muted-foreground mt-1">global system status.</p>
            </div>
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

        <div className="mt-8 mb-6">
            <div className="flex items-center gap-2 mb-3">
                <Activity size={14} className="text-primary animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Intelligence Input</h3>
            </div>
            <form onSubmit={handleMemoSubmit} className="relative group">
                <input
                    type="text"
                    value={memoContent}
                    onChange={(e) => setMemoContent(e.target.value)}
                    placeholder="Log new intelligence memo..."
                    className="w-full bg-muted/30 border border-muted-foreground/20 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:bg-muted/50 transition-all placeholder:italic placeholder:opacity-50"
                    disabled={isMemoSubmitting}
                />
                <button
                    type="submit"
                    disabled={isMemoSubmitting || !memoContent.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-sm hover:bg-primary hover:text-primary-foreground text-primary transition-all disabled:opacity-30"
                >
                    <Zap size={16} className={isMemoSubmitting ? "animate-spin" : ""} />
                </button>
                <div className="absolute -bottom-[1px] left-0 w-0 h-[1px] bg-primary group-focus-within:w-full transition-all duration-500"></div>
            </form>
        </div>

        <div className="mt-6 rounded-md border bg-card text-card-foreground shadow-sm overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center">
                <h3 className="text-sm font-medium">Recent Activity Log</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b transition-colors hover:bg-muted/50">
                            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-[10px] tracking-wider whitespace-nowrap">Timestamp</th>
                            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-[10px] tracking-wider whitespace-nowrap">Source</th>
                            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-[10px] tracking-wider whitespace-nowrap">Type</th>
                            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-[10px] tracking-wider whitespace-nowrap">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {memos.length === 0 ? (
                            <tr className="border-b transition-colors hover:bg-muted/50">
                                <td colSpan={4} className="p-4 align-middle text-xs text-muted-foreground text-center">No recent activity detected.</td>
                            </tr>
                        ) : (
                            memos.map((memo) => (
                                <tr key={memo.id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 align-middle text-xs text-muted-foreground font-mono whitespace-nowrap">
                                        {new Date(memo.createdAt).toISOString().replace('T', ' ').substring(0, 19)}Z
                                    </td>
                                    <td className="p-4 align-middle font-mono text-xs text-primary">INTELLIGENCE</td>
                                    <td className="p-4 align-middle">
                                        <span className="inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/20 text-primary">MEMO</span>
                                    </td>
                                    <td className="p-4 align-middle text-xs min-w-[200px]">{memo.content}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </main>
);
    }
