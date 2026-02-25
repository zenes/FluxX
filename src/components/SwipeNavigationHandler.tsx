"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";
import { TAB_ITEMS } from "./AppSidebar";

const SWIPE_THRESHOLD = 100;

export default function SwipeNavigationHandler({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const x = useMotionValue(0);
    const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);
    const controls = useAnimation();

    const currentIndex = TAB_ITEMS.findIndex(item => item.href === pathname);
    const isNavigationEnabled = currentIndex !== -1 || pathname === "/";

    const handleDragEnd = async (event: any, info: any) => {
        const offset = info.offset.x;
        const velocity = info.velocity.x;

        if (Math.abs(offset) > SWIPE_THRESHOLD || Math.abs(velocity) > 500) {
            if (offset < 0) {
                // Drag Left -> Next
                const nextIndex = currentIndex + 1;
                if (nextIndex < TAB_ITEMS.length) {
                    await controls.start({ x: -window.innerWidth, opacity: 0 });
                    router.push(TAB_ITEMS[nextIndex].href);
                    // Reset position for new page (though layout key should handle it)
                    x.set(0);
                    controls.set({ x: 0, opacity: 1 });
                } else {
                    controls.start({ x: 0 });
                }
            } else {
                // Drag Right -> Prev
                const prevIndex = currentIndex - 1;
                if (prevIndex >= 0) {
                    await controls.start({ x: window.innerWidth, opacity: 0 });
                    router.push(TAB_ITEMS[prevIndex].href);
                    x.set(0);
                    controls.set({ x: 0, opacity: 1 });
                } else {
                    controls.start({ x: 0 });
                }
            }
        } else {
            controls.start({ x: 0 });
        }
    };

    if (!isNavigationEnabled) return <>{children}</>;

    return (
        <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.8}
            onDragEnd={handleDragEnd}
            style={{ x, opacity }}
            animate={controls}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex-1 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
        >
            {children}
        </motion.div>
    );
}
