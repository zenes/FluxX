import { auth } from "@/../auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import MobileAccounts from "@/components/mobile/MobileAccounts";

export default async function MobileAccountPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const accounts = await prisma.predefinedAccount.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "asc" }
    });

    const { getAssets } = await import('@/lib/actions');
    const assets = await getAssets();

    return <MobileAccounts accounts={accounts} assets={assets} />;
}
