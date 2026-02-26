"use client";

import { useState, useEffect } from "react";

/**
 * SSR-safe media query hook.
 * Returns `true` when the viewport matches the given CSS media query string.
 *
 * @example
 *   const isMobile = useMediaQuery("(max-width: 767px)");
 *   const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const mql = window.matchMedia(query);
        const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

        setMatches(mql.matches);
        mql.addEventListener("change", handler);
        return () => mql.removeEventListener("change", handler);
    }, [query]);

    return matches;
}
