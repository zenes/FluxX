'use client';

import { useState } from 'react';

interface TickerIconProps {
    symbol: string;
    size?: number;
    className?: string;
}

export default function TickerIcon({ symbol, size = 32, className = "" }: TickerIconProps) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    // Clean symbol and normalize to uppercase
    const baseSymbol = symbol.split('.')[0].toUpperCase();
    const isKorean = symbol.toUpperCase().endsWith('.KS') || symbol.toUpperCase().endsWith('.KQ');

    // Sources prioritized
    // 1. FMP 2. Clearbit (US only)
    const iconUrl = isKorean
        ? `https://file.alphasquare.co.kr/media/symbol/stock/KRX/${baseSymbol}.png`
        : `https://financialmodelingprep.com/image-stock/${baseSymbol}.png`;

    // Fallback Design: Letter/Number circle
    const firstChar = baseSymbol.charAt(0);
    const colors = [
        'bg-blue-600', 'bg-purple-600', 'bg-green-600',
        'bg-red-600', 'bg-orange-600', 'bg-indigo-600', 'bg-pink-600', 'bg-slate-600'
    ];
    // Use a very subtle border based on the color to feel "harmonious"
    const borderAccentColors = [
        'border-blue-500/20', 'border-purple-500/20', 'border-green-500/20',
        'border-red-500/20', 'border-orange-500/20', 'border-indigo-500/20', 'border-pink-500/20', 'border-slate-500/20'
    ];
    const colorIndex = baseSymbol.charCodeAt(0) % colors.length;
    const bgColor = colors[colorIndex];
    const borderAccent = borderAccentColors[colorIndex];

    return (
        <div
            className={`relative rounded-sm overflow-hidden flex items-center justify-center shadow-sm shrink-0 border border-border/40 ${className}`}
            style={{ width: size, height: size }}
        >
            {/* Outer Glow/Border Accent */}
            <div className={`absolute inset-0 border-2 ${borderAccent} rounded-sm pointer-events-none z-10`}></div>

            {/* Base: Fallback Icon (Always visible initially) */}
            <div
                className={`${bgColor} w-full h-full flex items-center justify-center font-black text-white uppercase opacity-90`}
                style={{ fontSize: size * 0.55 }}
            >
                {firstChar}
            </div>

            {/* Over: Real Logo (Only show if loaded correctly) */}
            {!error && (
                <img
                    src={iconUrl}
                    alt={symbol}
                    className={`absolute inset-0 w-full h-full object-contain p-2 bg-background transition-opacity duration-300 z-20 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setLoaded(true)}
                    onError={() => setError(true)}
                />
            )}
        </div>
    );
}
