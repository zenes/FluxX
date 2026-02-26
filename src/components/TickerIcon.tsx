'use client';

import { useState, useEffect } from 'react';

interface TickerIconProps {
    symbol: string;
    size?: number;
    className?: string;
}

export default function TickerIcon({ symbol, size = 32, className = "" }: TickerIconProps) {
    const [sourceIndex, setSourceIndex] = useState(0);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    // Clean symbol and normalize to uppercase
    const baseSymbol = symbol.split('.')[0].toUpperCase();
    const isKorean = symbol.toUpperCase().endsWith('.KS') || symbol.toUpperCase().endsWith('.KQ');

    // Sources prioritized for quality and reliability (Toss is very reliable for KR/US)
    const sources = isKorean
        ? [
            `https://static.toss.im/png-logos/stock/ticker/KR:${baseSymbol}.png`,
            `https://file.alphasquare.co.kr/media/symbol/stock/KRX/${baseSymbol}.png`
        ]
        : [
            `https://static.toss.im/png-logos/stock/ticker/${baseSymbol}.png`,
            `https://financialmodelingprep.com/image-stock/${baseSymbol}.png`,
            `https://s.yimg.com/cv/apiv2/default/24/${baseSymbol}.png`
        ];

    const handleImageError = () => {
        if (sourceIndex < sources.length - 1) {
            setSourceIndex(prev => prev + 1);
            setLoaded(false); // Reset loaded state for the next source
        } else {
            setError(true);
        }
    };

    // Fallback Design: Letter/Number (Minimalist, no background color)
    const firstChar = baseSymbol.charAt(0);

    // Theme-compatible border
    const borderColor = 'border-primary/20';

    return (
        <div
            className={`relative rounded-sm overflow-hidden flex items-center justify-center shrink-0 border ${borderColor} ${className}`}
            style={{ width: size, height: size }}
        >
            {/* Fallback Letter: Always rendered as background/placeholder */}
            <div
                className="w-full h-full flex items-center justify-center font-black text-primary/40 uppercase"
                style={{ fontSize: size * 0.75 }}
            >
                {firstChar}
            </div>

            {/* Real Logo Overlay: Fades in only on success */}
            {!error && (
                <img
                    key={sources[sourceIndex]} // Force remount on source change
                    src={sources[sourceIndex]}
                    alt=""
                    className={`absolute inset-0 w-full h-full object-contain p-1.5 bg-background transition-opacity duration-300 z-20 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setLoaded(true)}
                    onError={handleImageError}
                />
            )}
        </div>
    );
}
