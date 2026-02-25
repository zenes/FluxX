import { auth } from "@/../auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ClientAccountDashboard from "./ClientAccountDashboard";

export default async function AccountPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    // Fetch all accounts and assets for the user to pass down
    const accounts = await prisma.predefinedAccount.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "asc" }
    });

    // Also fetch the standard parsed assets to pass
    const { getAssets } = await import('@/lib/actions');
    const assets = await getAssets();

    return (
        <div className="flex-1 w-full bg-background overflow-hidden flex flex-col h-[calc(100vh-3.5rem)] md:h-screen">
            <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 w-full">
                <div className="mb-10 max-w-5xl mx-auto">
                    <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
                        <span className="h-6 w-1 bg-primary"></span>
                        account
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1 opacity-60">
                        consolidated multi-account asset tracking and management.
                    </p>
                </div>
                <ClientAccountDashboard accounts={accounts} assets={assets} />
            </main>
        </div>
    );
}
