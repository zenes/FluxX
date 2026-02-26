'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
    value: number;
    formatOptions?: Intl.NumberFormatOptions;
    duration?: number;
    className?: string;
    animateOnChange?: boolean;
}

const DIGITS = '0123456789';

/**
 * Single digit reel.
 * Mounts showing the top of the reel, then scrolls down to the target digit
 * via a CSS transition triggered on the next animation frame.
 */
function DigitReel({
    digit,
    duration,
    staggerDelay,
}: {
    digit: string;
    duration: number;
    staggerDelay: number;
}) {
    const targetIndex = parseInt(digit, 10);

    // Build reel: some padding digits on top, then 0-9 repeated a couple of
    // times so the spin looks real, ending exactly at the target digit.
    // We'll spin 2 full rounds then land on targetIndex.
    const reel: string[] = [];
    // Leading digits (random-ish starting point for visual interest)
    const lead = (targetIndex + 3) % 10;
    for (let round = 0; round < 2; round++) {
        for (let d = 0; d < 10; d++) {
            reel.push(DIGITS[(lead + d) % 10]);
        }
    }
    // Append 0..targetIndex to land correctly
    for (let d = 0; d <= targetIndex; d++) {
        reel.push(DIGITS[(lead + d) % 10]);
    }
    // Make the last element exactly the target
    reel[reel.length - 1] = DIGITS[targetIndex];

    const cellH = 1.1; // em
    const totalCells = reel.length;
    const finalOffset = (totalCells - 1) * cellH;

    const stripRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const strip = stripRef.current;
        if (!strip) return;

        // Reset to top without transition
        strip.style.transition = 'none';
        strip.style.transform = 'translateY(0)';

        // Force reflow so the browser registers the starting position
        void strip.offsetHeight;

        // Then fire the transition on the next frame
        const rafId = requestAnimationFrame(() => {
            strip.style.transition = `transform ${duration}ms cubic-bezier(0.1, 0.8, 0.3, 1) ${staggerDelay}ms`;
            strip.style.transform = `translateY(-${finalOffset}em)`;
        });

        return () => cancelAnimationFrame(rafId);
    }, [digit, duration, staggerDelay, finalOffset]);

    return (
        <span
            className="inline-block overflow-hidden align-bottom"
            style={{ height: `${cellH}em`, lineHeight: `${cellH}em` }}
        >
            <span
                ref={stripRef}
                style={{
                    display: 'inline-flex',
                    flexDirection: 'column',
                    lineHeight: `${cellH}em`,
                    willChange: 'transform',
                }}
            >
                {reel.map((d, i) => (
                    <span key={i} style={{ height: `${cellH}em`, lineHeight: `${cellH}em`, display: 'block' }}>
                        {d}
                    </span>
                ))}
            </span>
        </span>
    );
}

export default function AnimatedNumber({
    value,
    formatOptions = { maximumFractionDigits: 0 },
    duration = 900,
    className = '',
    animateOnChange = true,
}: AnimatedNumberProps) {
    const [displayKey, setDisplayKey] = useState(0);
    const [displayValue, setDisplayValue] = useState(value);
    const prevRef = useRef<number | null>(null);

    useEffect(() => {
        if (prevRef.current === null || (animateOnChange && value !== prevRef.current)) {
            prevRef.current = value;
            setDisplayValue(value);
            setDisplayKey(k => k + 1);
        }
    }, [value, animateOnChange]);

    const formatted = displayValue.toLocaleString(undefined, formatOptions);

    return (
        <span className={`inline-flex items-baseline font-[inherit] ${className}`} aria-label={formatted}>
            {formatted.split('').map((char, i) => {
                if (!DIGITS.includes(char)) {
                    // Separators (쉼표, 점) — static
                    return (
                        <span key={`sep-${i}`} className="inline-block" style={{ lineHeight: '1.1em' }}>
                            {char}
                        </span>
                    );
                }
                return (
                    <DigitReel
                        key={`${displayKey}-${i}`}
                        digit={char}
                        duration={duration}
                        staggerDelay={i * 20}
                    />
                );
            })}
        </span>
    );
}
