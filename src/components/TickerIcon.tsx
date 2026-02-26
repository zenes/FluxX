'use client';

import { useState } from 'react';

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

    // Sources prioritized for quality and reliability
    // TradingView SVG is high quality and works for most US tickers
    const sources = isKorean
        ? [`https://file.alphasquare.co.kr/media/symbol/stock/KRX/${baseSymbol}.png`]
        : [
            `https://s3-symbol-logo.tradingview.com/${baseSymbol}.svg`,
            `https://financialmodelingprep.com/image-stock/${baseSymbol}.png`,
            `https://logo.clearbit.com/${baseSymbol.toLowerCase()}.com`
        ];

    const handleImageError = () => {
        if (sourceIndex < sources.length - 1) {
            setSourceIndex(prev => prev + 1);
        } else {
            setError(true);
        }
    };

    // Fallback Design: Letter/Number (Minimalist, no background)
    const firstChar = baseSymbol.charAt(0);

    // Use a clean, themed border
    const borderColor = 'border-primary/30';

    return (
        <div
            className={`relative rounded-sm overflow-hidden flex items-center justify-center shrink-0 border ${borderColor} ${className}`}
            style={{ width: size, height: size }}
        >
            {/* Base: Fallback Letter (Visible as fallback or background) */}
            <div
                className="w-full h-full flex items-center justify-center font-black text-primary/60 uppercase"
                style={{ fontSize: size * 0.7 }}
            >
                {firstChar}
            </div>

            {/* Over: Real Logo (Fades in over the fallback only when loaded) */}
            {!error && (
                <img
                    src={sources[sourceIndex]}
                    alt="" // Empty alt to prevent broken icon + text flicker
                    className={`absolute inset-0 w-full h-full object-contain p-1.5 bg-white transition-opacity duration-300 z-20 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setLoaded(true)}
                    onError={handleImageError}
                />
            )}
        </div>
    );
}
