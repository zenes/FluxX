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

    // Fallback Design: Letter/Number (Minimalist, no background)
    const firstChar = baseSymbol.charAt(0);

    // Use a clean, themed border
    const borderColor = 'border-primary/40';

    return (
        <div
            className={`relative rounded-sm overflow-hidden flex items-center justify-center shrink-0 border ${borderColor} ${className}`}
            style={{ width: size, height: size }}
        >
            {/* Base: Fallback Letter (Clean themed text, no background color) */}
            <div
                className="w-full h-full flex items-center justify-center font-black text-primary/80 uppercase"
                style={{ fontSize: size * 0.7 }}
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
