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
            <header className="flex h-16 shrink-0 items-center justify-between border-b px-6 bg-card/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold tracking-tight">Account Portfolios</h1>
                </div>
            </header>

            <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                <ClientAccountDashboard accounts={accounts} assets={assets} />
            </main>
        </div>
    );
}
