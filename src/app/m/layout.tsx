'use client';

import { MobileHeader, MobileBottomNav } from "@/components/mobile/MobileLayout";
import { usePathname } from "next/navigation";

export default function MobileRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isV2 = pathname?.startsWith('/m/v2');

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {!isV2 && <MobileHeader />}
            <main className={isV2 ? "flex-1 overflow-y-auto" : "flex-1 overflow-y-auto pb-16"}>
                {children}
            </main>
            {!isV2 && <MobileBottomNav />}
        </div>
    );
}
