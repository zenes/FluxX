import { AppSidebar, MobileTabs } from "@/components/AppSidebar";

export default function DesktopLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground">
            <AppSidebar />
            <main className="flex-1 w-full overflow-y-auto">
                <MobileTabs />
                {children}
            </main>
        </div>
    );
}
