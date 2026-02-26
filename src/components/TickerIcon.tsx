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
        'bg-blue-500', 'bg-purple-500', 'bg-green-500',
        'bg-red-500', 'bg-orange-500', 'bg-indigo-500', 'bg-pink-500', 'bg-slate-500'
    ];
    const colorIndex = baseSymbol.charCodeAt(0) % colors.length;
    const bgColor = colors[colorIndex];

    return (
        <div
            className={`relative rounded-sm overflow-hidden flex items-center justify-center shadow-sm shrink-0 border border-border/50 ${className}`}
            style={{ width: size, height: size }}
        >
            {/* Base: Fallback Icon (Always visible initially) */}
            <div
                className={`${bgColor} w-full h-full flex items-center justify-center font-bold text-white uppercase`}
                style={{ fontSize: size * 0.5 }}
            >
                {firstChar}
            </div>

            {/* Over: Real Logo (Only show if loaded correctly) */}
            {!error && (
                <img
                    src={iconUrl}
                    alt={symbol}
                    className={`absolute inset-0 w-full h-full object-contain p-1 bg-white transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setLoaded(true)}
                    onError={() => setError(true)}
                />
            )}
        </div>
    );
}
