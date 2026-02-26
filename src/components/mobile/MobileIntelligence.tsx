'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ViewModeToggle } from '@/components/mobile/MobileLayout';

interface AccountNode {
    id: string;
    name: string;
    value: number;
    broker?: string;
    x: number;
    y: number;
    size: number;
    children?: any[];
}

export default function MobileIntelligence({ initialData }: { initialData: any }) {
    const { t } = useLanguage();
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [selectedNode, setSelectedNode] = useState<string | null>(null);

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

    const totalNetWorth = initialData?.totalNetWorth || 0;
    const accounts = initialData?.accounts || [];

    const nodes = useMemo(() => {
        if (!initialData || dimensions.width === 0) return null;

        const centerX = dimensions.width / 2;
        const centerY = dimensions.height / 2;
        const coreSize = 110;
        const radius = Math.min(dimensions.width, dimensions.height) * 0.3;

        const accountNodes: AccountNode[] = accounts.map((acc: any, i: number) => {
            const angle = (i / accounts.length) * Math.PI * 2 - Math.PI / 2;
            return {
                id: acc.id,
                name: acc.name || acc.alias || 'Account',
                value: acc.value || 0,
                broker: acc.broker,
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius,
                size: 60,
                children: acc.children || [],
            };
        });

        return {
            core: { x: centerX, y: centerY, size: coreSize },
            accounts: accountNodes,
        };
    }, [initialData, accounts, dimensions]);

    if (!initialData) return <div className="p-4 text-center text-muted-foreground">Loading...</div>;

    const selectedAccount = nodes?.accounts.find(a => a.id === selectedNode);

    return (
        <div className="px-4 py-5 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-black tracking-tight">{t('intel.title') || 'Intelligence'}</h1>
                <span className="text-[10px] text-primary font-bold uppercase tracking-wider animate-pulse">● Connected</span>
            </div>

            {/* Graph Container */}
            <div
                ref={containerRef}
                className="bg-card border border-primary/20 rounded-2xl relative overflow-hidden shadow-sm"
                style={{ height: '50vh' }}
            >
                {/* Background grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.05)_1px,transparent_1px)] bg-[size:30px_30px]" />

                {/* SVG connections */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {nodes?.accounts.map(acc => (
                        <line
                            key={acc.id}
                            x1={nodes.core.x} y1={nodes.core.y}
                            x2={acc.x} y2={acc.y}
                            stroke="hsl(var(--primary))"
                            strokeWidth={selectedNode === acc.id ? 2 : 1}
                            opacity={selectedNode === acc.id ? 0.6 : 0.15}
                        />
                    ))}
                </svg>

                {/* Core node */}
                {nodes && (
                    <button
                        className="absolute bg-background rounded-full flex flex-col items-center justify-center border-2 border-primary shadow-lg z-20"
                        style={{
                            left: nodes.core.x, top: nodes.core.y,
                            width: nodes.core.size, height: nodes.core.size,
                            marginLeft: -nodes.core.size / 2, marginTop: -nodes.core.size / 2,
                        }}
                        onClick={() => setSelectedNode(null)}
                    >
                        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Net Worth</span>
                        <span className="text-base font-black text-foreground">
                            ₩{totalNetWorth > 0 ? (totalNetWorth >= 100000000 ? `${(totalNetWorth / 100000000).toFixed(1)}억` : totalNetWorth.toLocaleString()) : '0'}
                        </span>
                    </button>
                )}

                {/* Account nodes */}
                {nodes?.accounts.map(acc => (
                    <button
                        key={acc.id}
                        className={`absolute rounded-full flex items-center justify-center z-10 border-2 transition-all ${selectedNode === acc.id
                                ? 'border-primary bg-primary/10 shadow-lg scale-110'
                                : 'border-border bg-background/80 shadow-sm'
                            }`}
                        style={{
                            left: acc.x, top: acc.y,
                            width: acc.size, height: acc.size,
                            marginLeft: -acc.size / 2, marginTop: -acc.size / 2,
                        }}
                        onClick={() => setSelectedNode(acc.id === selectedNode ? null : acc.id)}
                    >
                        <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[8px] font-black text-primary/80 uppercase tracking-tighter leading-none">
                                {acc.name.substring(0, 6)}
                            </span>
                            <span className="text-[7px] text-muted-foreground font-bold">
                                {totalNetWorth > 0 ? `${(acc.value / totalNetWorth * 100).toFixed(0)}%` : '0%'}
                            </span>
                        </div>
                    </button>
                ))}
            </div>

            {/* Selected Account Detail */}
            {selectedAccount && (
                <div className="bg-card border border-primary/20 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1">{selectedAccount.broker}</p>
                    <p className="text-lg font-black">{selectedAccount.name}</p>
                    <p className="text-2xl font-bold text-primary mt-1">₩{selectedAccount.value.toLocaleString()}</p>
                    {selectedAccount.children && selectedAccount.children.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                            {selectedAccount.children.map((child: any) => (
                                <div key={child.id} className="flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground">{child.name || child.symbol || child.type?.toUpperCase()}</span>
                                    <span className="font-bold">₩{(child.value || 0).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Status */}
            <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-primary font-bold tracking-wider uppercase">Portfolio Intelligence</span>
                    <span className="text-[9px] text-muted-foreground animate-pulse uppercase">Sync Ready</span>
                </div>
                <p className="text-xs text-foreground/80">
                    <span className="text-primary font-bold mr-1">{'>'}</span>
                    Capital distributed across <span className="text-primary font-bold">{accounts.length} nodes</span>. Stability <span className="text-primary font-bold italic">NOMINAL</span>.
                </p>
            </div>

            <ViewModeToggle />
        </div>
    );
}
