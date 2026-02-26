'use client';

import { useEffect, useRef, useState } from 'react';

interface TickerIconProps {
    symbol: string;
    size?: number;
    className?: string;
}

export default function TickerIcon({ symbol, size = 32, className = "" }: TickerIconProps) {
    const [sourceIndex, setSourceIndex] = useState(0);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    // Clean symbol and normalize to uppercase
    const baseSymbol = symbol.split('.')[0].toUpperCase();
    const isKorean = symbol.toUpperCase().endsWith('.KS') || symbol.toUpperCase().endsWith('.KQ');

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

    // Fix: if the image was already loaded from cache before onLoad was attached
    // (happens on hard refresh), img.complete will be true but onLoad never fires.
    useEffect(() => {
        const img = imgRef.current;
        if (img && img.complete && img.naturalWidth > 0) {
            setLoaded(true);
        }
    }, [sourceIndex]);

    const handleImageError = () => {
        if (sourceIndex < sources.length - 1) {
            setSourceIndex(prev => prev + 1);
            setLoaded(false);
        } else {
            setError(true);
        }
    };

    const firstChar = baseSymbol.charAt(0);
    const fontSize = Math.max(size * 0.42, 11);

    return (
        <div
            className={`relative rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-border/40 bg-muted/30 ${className}`}
            style={{ width: size, height: size }}
        >
            {/* Fallback: ticker letter, always shown until logo loads */}
            <span
                className="font-black text-foreground/30 uppercase select-none leading-none"
                style={{ fontSize }}
            >
                {firstChar}
            </span>

            {/* Logo overlay */}
            {!error && (
                <div
                    className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                >
                    <div
                        className="rounded-md bg-white flex items-center justify-center overflow-hidden"
                        style={{ width: size - 6, height: size - 6 }}
                    >
                        <img
                            ref={imgRef}
                            key={sources[sourceIndex]}
                            src={sources[sourceIndex]}
                            alt=""
                            className="w-full h-full object-contain p-1"
                            onLoad={() => setLoaded(true)}
                            onError={handleImageError}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
