'use client';

import { useState } from 'react';

interface TickerIconProps {
    symbol: string;
    size?: number;
    className?: string;
}

export default function TickerIcon({ symbol, size = 32, className = "" }: TickerIconProps) {
    const [error, setError] = useState(false);

    // Clean symbol for the API (remove .KS, .KQ etc for global search if needed, but FMP usually wants the full one or just base)
    const baseSymbol = symbol.split('.')[0];
    const isKorean = symbol.endsWith('.KS') || symbol.endsWith('.KQ');

    // Primary: Financial Modeling Prep (FMP)
    // Secondary: Yahoo Finance / Generic
    const iconUrl = isKorean
        ? `https://file.alphasquare.co.kr/media/symbol/stock/KRX/${baseSymbol}.png` // Good source for KRX
        : `https://financialmodelingprep.com/image-stock/${baseSymbol}.png`;

    if (error) {
        const firstLetter = symbol.charAt(0).toUpperCase();
        const colors = [
            'bg-blue-500', 'bg-purple-500', 'bg-green-500',
            'bg-red-500', 'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500'
        ];
        const colorIndex = symbol.charCodeAt(0) % colors.length;
        const bgColor = colors[colorIndex];

        return (
            <div
                className={`${bgColor} flex items-center justify-center rounded-sm font-bold text-white uppercase shadow-sm ${className}`}
                style={{ width: size, height: size, fontSize: size * 0.5 }}
            >
                {firstLetter}
            </div>
        );
    }

    return (
        <div
            className={`relative bg-white rounded-sm border border-border/50 overflow-hidden flex items-center justify-center shadow-sm ${className}`}
            style={{ width: size, height: size }}
        >
            <img
                src={iconUrl}
                alt={symbol}
                className="w-full h-full object-contain p-1"
                onError={() => setError(true)}
            />
        </div>
    );
}
