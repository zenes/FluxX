"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TAB_ITEMS } from "./AppSidebar";

const SWIPE_THRESHOLD = 50;

export default function SwipeNavigationHandler({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const [startX, setStartX] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleStart = (clientX: number) => {
        setStartX(clientX);
        setIsDragging(true);
    };

    const handleEnd = (clientX: number) => {
        if (!startX || !isDragging) return;

        const distance = startX - clientX;
        const isLeftSwipe = distance > SWIPE_THRESHOLD;
        const isRightSwipe = distance < -SWIPE_THRESHOLD;

        setIsDragging(false);
        setStartX(null);

        // Find current index
        const currentIndex = TAB_ITEMS.findIndex(item => item.href === pathname);

        if (currentIndex === -1 && pathname !== "/") return;

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
            }
        }
    };

    // Touch Handlers
    const onTouchStart = (e: React.TouchEvent) => handleStart(e.targetTouches[0].clientX);
    const onTouchEnd = (e: React.TouchEvent) => handleEnd(e.changedTouches[0].clientX);

    // Mouse Handlers
    const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX);
    const onMouseUp = (e: React.MouseEvent) => handleEnd(e.clientX);
    const onMouseLeave = () => {
        setIsDragging(false);
        setStartX(null);
    };

    return (
        <div
            className="flex-1 w-full h-full md:touch-auto touch-pan-y"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
        >
            {children}
        </div>
    );
}
