import { auth } from "@/../auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ClientAccounts from "@/app/d/accounts/ClientAccounts";

export default async function AccountsPage() {
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
                <ClientAccounts accounts={accounts} assets={assets} />
            </main>
        </div>
    );
}
