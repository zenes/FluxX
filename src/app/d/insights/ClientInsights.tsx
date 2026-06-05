'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLanguage } from '@/contexts/LanguageContext';

interface Node {
    id: string;
    name: string;
    value: number;
    type: 'core' | 'account' | 'asset';
    x: number;
    y: number;
    size: number;
    children?: Node[];
    symbol?: string;
    broker?: string;
}

export default function IntelligenceClient({ initialData }: { initialData: any }) {
    const { t } = useLanguage();
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [ripple, setRipple] = useState<{ id: string; x: number; y: number } | null>(null);
    const isMobile = useMediaQuery('(max-width: 767px)');

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        };

        updateDimensions();
        const resizeObserver = new ResizeObserver(updateDimensions);
        if (containerRef.current) resizeObserver.observe(containerRef.current);

        return () => resizeObserver.disconnect();
    }, []);

    const nodes = useMemo(() => {
        if (!initialData || dimensions.width === 0) return null;

        const centerX = dimensions.width / 2;
        const centerY = dimensions.height / 2;

        const coreSize = 200;

        const core: Node = {
            id: 'core',
            name: 'Total Net Worth',
            value: initialData.totalNetWorth,
            type: 'core',
            x: centerX,
            y: centerY,
            size: coreSize,
            children: []
        };

        const accounts = initialData.accounts;
        const radiusAccount = isMobile ? dimensions.height * 0.25 : Math.min(dimensions.width, dimensions.height) * 0.35;
        const radiusAsset = isMobile ? dimensions.height * 0.12 : Math.min(dimensions.width, dimensions.height) * 0.18;

        const getAssetSize = (value: number) => {
            if (initialData.totalNetWorth === 0) return 60;
            const ratio = value / initialData.totalNetWorth;
            return Math.max(isMobile ? 48 : 64, Math.min(140, 64 + ratio * 300));
        };

        const allNodes: Node[] = [];
        accounts.forEach((acc: any, i: number) => {
            const angle = (i / accounts.length) * Math.PI * 2;
            const accX = centerX + Math.cos(angle) * radiusAccount;
            const accY = centerY + Math.sin(angle) * radiusAccount;

            const accNode: Node = {
                id: acc.id,
                name: acc.name,
                broker: acc.broker,
                value: acc.value,
                type: 'account',
                x: accX,
                y: accY,
                size: isMobile ? 80 : 96,
                children: []
            };

            acc.children?.forEach((asset: any, j: number) => {
                const assetAngle = angle + (j - (acc.children.length - 1) / 2) * 0.35;
                const assetX = accX + Math.cos(assetAngle) * radiusAsset;
                const assetY = accY + Math.sin(assetAngle) * radiusAsset;

                const assetNode: Node = {
                    id: asset.id,
                    name: asset.name,
                    symbol: asset.symbol,
                    value: asset.value,
                    type: 'asset',
                    x: assetX,
                    y: assetY,
                    size: getAssetSize(asset.value)
                };
                accNode.children?.push(assetNode);
                allNodes.push(assetNode);
            });

            core.children?.push(accNode);
            allNodes.push(accNode);
        });
        allNodes.push(core);

        const iterations = 80;
        const padding = 20;

        for (let i = 0; i < iterations; i++) {
            for (let j = 0; j < allNodes.length; j++) {
                const n1 = allNodes[j];

                if (n1.type !== 'core') {
                    const cdx = centerX - n1.x;
                    const cdy = centerY - n1.y;
                    const cDist = Math.sqrt(cdx * cdx + cdy * cdy);
                    if (cDist > 0) {
                        n1.x += (cdx / cDist) * 0.5;
                        n1.y += (cdy / cDist) * 0.5;
                    }
                }

                const radius = n1.size / 2;
                if (n1.x - radius < padding) n1.x = padding + radius;
                if (n1.x + radius > dimensions.width - padding) n1.x = dimensions.width - padding - radius;
                if (n1.y - radius < padding) n1.y = padding + radius;
                if (n1.y + radius > dimensions.height - padding) n1.y = dimensions.height - padding - radius;

                for (let k = j + 1; k < allNodes.length; k++) {
                    const n2 = allNodes[k];

                    const dx = n2.x - n1.x;
                    const dy = n2.y - n1.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const minDistance = (n1.size + n2.size) / 2 + 8;

                    if (distance < minDistance && distance > 0) {
                        const overlap = minDistance - distance;
                        const nx = dx / distance;
                        const ny = dy / distance;

                        const moveX = nx * overlap * 0.5;
                        const moveY = ny * overlap * 0.5;

                        if (n1.type !== 'core') {
                            n1.x -= moveX;
                            n1.y -= moveY;
                        }
                        if (n2.type !== 'core') {
                            n2.x += moveX;
                            n2.y += moveY;
                        }
                    }
                }
            }
        }

        return core;
    }, [initialData, dimensions]);

    if (!initialData) return <div>Loading...</div>;

    return (
        <div className="flex flex-col gap-4" style={{ height: '80vh' }}>
            {/* Main Graph Card */}
            <Card className="flex-1 border-primary/20 bg-background/50 backdrop-blur-sm shadow-2xl overflow-hidden relative" ref={containerRef}>
                {/* Localized Header Overlay */}
                <div className="absolute top-4 left-4 z-50 pointer-events-none hidden md:block">
                    <h2 className="text-xl font-bold tracking-tight uppercase opacity-50 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse inline-block"></span>
                        {t('intel.title')}
                    </h2>
                </div>

                {/* Theme-aware background */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--primary),0.03)_0%,transparent_70%)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] animate-pulse delay-700" />
                </div>

                <CardHeader className="relative z-10 bg-background/60 backdrop-blur-md border-b">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="tracking-[0.3em] font-black uppercase text-primary">Living Ecosystem</CardTitle>
                            <CardDescription className="text-muted-foreground/60 uppercase text-[9px] tracking-[0.2em] font-mono mt-1">
                                [ ASSET_HIERARCHY_PROPORTIONAL_MAP ]
                            </CardDescription>
                        </div>
                        <div className="text-right">
                            <div className="text-[9px] text-muted-foreground/30 font-mono tracking-tighter uppercase">Status_Sync</div>
                            <div className="text-xs font-bold text-primary/80 uppercase tracking-widest">Connected</div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="h-full w-full relative p-0 overflow-hidden">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        <defs>
                            <linearGradient id="flowGradient" gradientUnits="userSpaceOnUse" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                                <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
                            </linearGradient>
                        </defs>

                        {nodes?.children?.map(acc => {
                            const isAccRelated = selectedNode === acc.id
                                || acc.children?.some(as => as.id === selectedNode)
                                || hoveredNode === acc.id
                                || acc.children?.some(as => as.id === hoveredNode);

                            return (
                                <g key={acc.id}>
                                    <path
                                        d={`M ${nodes.x} ${nodes.y} Q ${(nodes.x + acc.x) / 2} ${(nodes.y + acc.y) / 2 - 20} ${acc.x} ${acc.y}`}
                                        stroke="url(#flowGradient)"
                                        strokeWidth={isAccRelated ? "3" : "2"}
                                        fill="none"
                                        className={`transition-all duration-500 ${isAccRelated ? 'opacity-80' : 'opacity-20'}`}
                                        style={{
                                            strokeDasharray: isAccRelated ? 'none' : '6 10',
                                            strokeLinecap: 'round',
                                            animation: isAccRelated ? 'none' : 'flowPath 30s linear infinite'
                                        }}
                                    />
                                    {acc.children?.map(asset => {
                                        const isAssetRelated = selectedNode === asset.id
                                            || hoveredNode === asset.id
                                            || selectedNode === acc.id
                                            || hoveredNode === acc.id;
                                        return (
                                            <path
                                                key={asset.id}
                                                d={`M ${acc.x} ${acc.y} L ${asset.x} ${asset.y}`}
                                                stroke="hsl(var(--primary))"
                                                strokeWidth={isAssetRelated ? "2" : "1"}
                                                fill="none"
                                                className={`transition-all duration-500 ${isAssetRelated ? 'opacity-60' : 'opacity-10'}`}
                                            />
                                        );
                                    })}
                                </g>
                            );
                        })}
                    </svg>

                    <style jsx global>{`
                        @keyframes flowPath { from { stroke-dashoffset: 200; } to { stroke-dashoffset: 0; } }
                        @keyframes breatheCore {
                            0% { transform: scale(1); filter: drop-shadow(0 0 10px hsl(var(--primary)/0.2)); }
                            50% { transform: scale(1.03); filter: drop-shadow(0 0 25px hsl(var(--primary)/0.4)); }
                            100% { transform: scale(1); filter: drop-shadow(0 0 10px hsl(var(--primary)/0.2)); }
                        }
                        @keyframes drift {
                            0% { transform: translate(0, 0); }
                            50% { transform: translate(4px, -4px); }
                            100% { transform: translate(0, 0); }
                        }
                        @keyframes ripple {
                            0% { transform: scale(0.8); opacity: 1; }
                            100% { transform: scale(2.5); opacity: 0; }
                        }
                    `}</style>

                    {nodes && (
                        <>
                            {/* Core Node */}
                            <div
                                className="absolute bg-background rounded-full flex flex-col items-center justify-center text-primary z-40 cursor-pointer border-2 border-primary shadow-xl hover:shadow-primary/30 group active:scale-95"
                                style={{
                                    left: nodes.x, top: nodes.y,
                                    width: nodes.size, height: nodes.size,
                                    marginLeft: -nodes.size / 2, marginTop: -nodes.size / 2,
                                    animation: 'breatheCore 5s ease-in-out infinite'
                                }}
                                onClick={() => setSelectedNode(null)}
                            >
                                <div className="absolute inset-0 bg-primary/5 rounded-full group-hover:bg-primary/10 transition-colors" />
                                <span className="text-[10px] font-black opacity-60 tracking-[0.3em] uppercase mb-1">Total Net</span>
                                <span className="text-2xl font-black tracking-tight text-foreground group-hover:scale-110 transition-transform">${initialData.totalNetWorth.toLocaleString()}</span>
                                <div className="mt-1 size-1.5 bg-primary rounded-full animate-ping opacity-50" />
                            </div>

                            {nodes.children?.map(acc => (
                                <div key={acc.id}>
                                    {/* Account Node */}
                                    <div
                                        className={`absolute bg-background/80 backdrop-blur-xl border-2 rounded-full flex items-center justify-center z-30 cursor-pointer group hover:shadow-lg active:scale-90 transition-all duration-500 ${selectedNode === acc.id ? 'border-primary shadow-primary/30' : 'border-primary/30 hover:border-primary hover:shadow-primary/20'}`}
                                        style={{
                                            left: acc.x, top: acc.y,
                                            width: acc.size, height: acc.size,
                                            marginLeft: -acc.size / 2, marginTop: -acc.size / 2,
                                            animation: `drift ${4 + Math.random() * 2}s ease-in-out infinite`
                                        }}
                                        onMouseEnter={() => setHoveredNode(acc.id)}
                                        onMouseLeave={() => setHoveredNode(null)}
                                        onClick={() => {
                                            setSelectedNode(acc.id === selectedNode ? null : acc.id);
                                            setRipple({ id: acc.id, x: acc.x, y: acc.y });
                                            setTimeout(() => setRipple(null), 1000);
                                        }}
                                    >
                                        <div className="flex flex-col items-center gap-0.5 pointer-events-none">
                                            <div className="text-[9px] font-black text-primary/80 text-center leading-none uppercase tracking-tighter">
                                                {acc.name.substring(0, 8)}
                                            </div>
                                            <div className="text-[8px] text-muted-foreground/60 font-mono font-bold">
                                                {(acc.value / initialData.totalNetWorth * 100).toFixed(0)}%
                                            </div>
                                        </div>
                                        {selectedNode === acc.id && (
                                            <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-30" />
                                        )}
                                        <div className={`absolute -top-12 left-1/2 -translate-x-1/2 bg-popover border border-border px-3 py-1.5 rounded shadow-2xl z-50 pointer-events-none transition-all duration-300 ${hoveredNode === acc.id ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-90'}`}>
                                            <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-1">{acc.broker}</div>
                                            <div className="text-sm font-black text-foreground">${acc.value.toLocaleString()}</div>
                                        </div>
                                    </div>

                                    {/* Asset Nodes */}
                                    {acc.children?.map(asset => (
                                        <div
                                            key={asset.id}
                                            className="absolute z-20 hover:scale-125 hover:z-50 cursor-pointer group active:scale-95 transition-all duration-500"
                                            style={{
                                                left: asset.x, top: asset.y,
                                                width: asset.size, height: asset.size,
                                                marginLeft: -asset.size / 2, marginTop: -asset.size / 2,
                                                animation: `drift ${5 + Math.random() * 3}s ease-in-out infinite alternate`
                                            }}
                                            onMouseEnter={() => setHoveredNode(asset.id)}
                                            onMouseLeave={() => setHoveredNode(null)}
                                            onClick={() => {
                                                setSelectedNode(asset.id === selectedNode ? null : asset.id);
                                                setRipple({ id: asset.id, x: asset.x, y: asset.y });
                                                setTimeout(() => setRipple(null), 1000);
                                            }}
                                        >
                                            <div className={`relative w-full h-full rounded-full overflow-hidden border-2 bg-background shadow-md flex items-center justify-center transition-all duration-300 ${selectedNode === asset.id ? 'border-primary ring-4 ring-primary/20' : 'border-border group-hover:border-primary'}`}>
                                                <span className={`font-black text-primary/80 group-hover:text-primary transition-colors uppercase ${(asset.symbol === 'USD' || asset.symbol === 'KRW') ? 'text-xs' : 'text-xl'}`}>
                                                    {asset.symbol === 'USD' ? '$' : asset.symbol === 'KRW' ? '₩' : (asset.symbol || asset.name).charAt(0)}
                                                </span>
                                            </div>
                                            <div className={`absolute -bottom-10 left-1/2 -translate-x-1/2 bg-popover/90 backdrop-blur-md border border-border px-2 py-1 rounded text-[10px] z-50 pointer-events-none transition-all duration-300 ${hoveredNode === asset.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                                                <div className="font-bold text-popover-foreground text-center mb-0.5 whitespace-nowrap">{asset.name}</div>
                                                <div className="text-primary font-black text-center whitespace-nowrap">${asset.value.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}

                            {ripple && (
                                <div
                                    className="absolute rounded-full border-2 border-primary pointer-events-none z-50"
                                    style={{
                                        left: ripple.x, top: ripple.y,
                                        width: 10, height: 10,
                                        marginLeft: -5, marginTop: -5,
                                        animation: 'ripple 0.8s ease-out forwards'
                                    }}
                                />
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Bottom Status Bar */}
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 md:h-24 font-mono flex-shrink-0">
                <Card className="flex-[2] border-primary/10 bg-muted/20 flex items-center px-4 md:px-6 py-3 md:py-0 relative overflow-hidden group">
                    <div className="absolute left-0 top-0 w-1 h-full bg-primary" />
                    <div className="space-y-1 relative z-10 w-full">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-primary tracking-[0.2em] font-black uppercase">Portfolio_Intelligence_Signal</span>
                            <span className="text-[9px] text-muted-foreground animate-pulse uppercase">Sync_Ready</span>
                        </div>
                        <div className="text-xs text-foreground/80 leading-relaxed overflow-hidden whitespace-nowrap text-ellipsis">
                            <span className="text-primary mr-2 font-black">{'>'}</span>
                            Capital distribution synced across <span className="text-primary font-bold">{initialData.accounts.length} nodes</span>. Overall stability is <span className="text-primary font-bold italic tracking-widest">NOMINAL</span>.
                        </div>
                    </div>
                </Card>
                <Card className="flex-1 border-primary/10 bg-muted/20 flex flex-col justify-center px-4 md:px-6 py-3 md:py-0 relative overflow-hidden group">
                    <div className="absolute left-0 top-0 w-1 h-full bg-primary/40" />
                    <div className="text-[9px] text-muted-foreground/60 uppercase tracking-widest mb-1">Stability_Index</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-foreground">{(initialData.accounts.length * 15.4).toFixed(1)}</span>
                        <span className="text-[9px] text-muted-foreground/40 font-bold tracking-tighter">POINT_X</span>
                    </div>
                </Card>
            </div>
        </div>
    );
}
