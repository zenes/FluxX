import { MobileHeader, MobileBottomNav } from "@/components/mobile/MobileLayout";

export default function MobileRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <MobileHeader />
            <main className="flex-1 overflow-y-auto pb-16">
                {children}
            </main>
            <MobileBottomNav />
        </div>
    );
}
