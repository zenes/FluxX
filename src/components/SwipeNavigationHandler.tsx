"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TAB_ITEMS } from "./AppSidebar";

const SWIPE_THRESHOLD = 50;

export default function SwipeNavigationHandler({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > SWIPE_THRESHOLD;
        const isRightSwipe = distance < -SWIPE_THRESHOLD;

        // Find current index
        const currentIndex = TAB_ITEMS.findIndex(item => item.href === pathname);

        // If not in a swipeable tab, don't do anything
        if (currentIndex === -1 && pathname !== "/") {
            // Check if we are in one of the sub-tabs but the URL might be slightly different or Intelligencre #
            return;
        }

        if (isLeftSwipe) {
            // Swipe Left -> Next Tab
            const nextIndex = currentIndex + 1;
            if (nextIndex < TAB_ITEMS.length) {
                router.push(TAB_ITEMS[nextIndex].href);
            }
        } else if (isRightSwipe) {
            // Swipe Right -> Previous Tab
            const prevIndex = currentIndex - 1;
            if (prevIndex >= 0) {
                router.push(TAB_ITEMS[prevIndex].href);
            } else if (currentIndex === 0) {
                // If at first tab, maybe go to dashboard or just stay
                // router.push("/");
            }
        }
    };

    // Only enable on mobile
    return (
        <div
            className="flex-1 w-full h-full md:touch-auto touch-pan-y"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {children}
        </div>
    );
}
