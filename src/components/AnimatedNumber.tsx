'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * AnimatedNumber
 * Renders a number with a slot-machine / odometer reel effect.
 * Each character column (digit, comma, period) animates independently
 * by scrolling a vertical strip of characters into place.
 */

interface AnimatedNumberProps {
    value: number;
    /** Locale-format options forwarded to toLocaleString */
    formatOptions?: Intl.NumberFormatOptions;
    /** Total animation duration in ms (default 900) */
    duration?: number;
    /** Extra Tailwind classes on the outer span */
    className?: string;
    /** Optional prefix rendered at normal size before the number (e.g. '₩' '$') */
    prefix?: React.ReactNode;
    /** If true, play the animation whenever value changes (not just on mount) */
    animateOnChange?: boolean;
}

const DIGITS = '0123456789';
// Height of one character cell in the reel (px). Must match font-size + line-height.
const CELL_H = 1; // We'll use `em` via CSS custom property instead

function CharReel({
    char,
    delay,
    duration,
    isNew,
}: {
    char: string;
    delay: number;
    duration: number;
    isNew: boolean;
}) {
    const isDigit = DIGITS.includes(char);

    // For non-digit characters (comma, period, space) just render static
    if (!isDigit) {
        return (
            <span className="inline-block" style={{ lineHeight: 'inherit' }}>
                {char}
            </span>
        );
    }

    const targetIndex = parseInt(char, 10);
    // Build a longer reel for visual drama: random start + a few full rotations
    const spinRounds = 2;
    const startIndex = Math.floor(Math.random() * 10);
    // Reel: startIndex → ... wrap around ... → targetIndex
    const reel: string[] = [];
    let idx = startIndex;
    for (let i = 0; i < spinRounds * 10 + targetIndex + 1; i++) {
        reel.push(DIGITS[idx % 10]);
        idx++;
    }
    // Ensure last element is target digit
    reel[reel.length - 1] = DIGITS[targetIndex];

    const totalCells = reel.length;

    return (
        <span
            className="inline-block overflow-hidden align-bottom"
            style={{ lineHeight: 'inherit', height: '1.1em', verticalAlign: 'baseline' }}
        >
            <span
                style={{
                    display: 'inline-flex',
                    flexDirection: 'column',
                    transform: isNew
                        ? `translateY(-${(totalCells - 1) * 1.1}em)`
                        : 'translateY(0)',
                    transition: isNew
                        ? `transform ${duration}ms cubic-bezier(0.15, 0.85, 0.35, 1.0) ${delay}ms`
                        : 'none',
                    lineHeight: '1.1em',
                }}
            >
                {reel.map((d, i) => (
                    <span key={i} className="block" style={{ height: '1.1em', lineHeight: '1.1em' }}>
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
    prefix,
    animateOnChange = true,
}: AnimatedNumberProps) {
    const [displayValue, setDisplayValue] = useState(value);
    const [animKey, setAnimKey] = useState(0);
    const [playing, setPlaying] = useState(false);
    const prevValue = useRef<number | null>(null);

    useEffect(() => {
        if (prevValue.current === null) {
            // First render: animate from 0
            prevValue.current = value;
            setDisplayValue(value);
            setPlaying(true);
            setAnimKey(k => k + 1);
        } else if (animateOnChange && value !== prevValue.current) {
            prevValue.current = value;
            setDisplayValue(value);
            setPlaying(true);
            setAnimKey(k => k + 1);
        }
    }, [value, animateOnChange]);

    const formatted = displayValue.toLocaleString(undefined, formatOptions);
    const chars = formatted.split('');

    return (
        <span className={`inline-flex items-baseline ${className}`} aria-label={formatted}>
            {prefix && <span className="mr-0.5 opacity-50">{prefix}</span>}
            {chars.map((char, i) => (
                <CharReel
                    key={`${animKey}-${i}-${char}`}
                    char={char}
                    delay={i * 18}      // cascade: left digits settle first
                    duration={duration}
                    isNew={playing}
                />
            ))}
        </span>
    );
}
