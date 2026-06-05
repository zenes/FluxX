import { auth } from "@/../auth";
import { redirect } from "next/navigation";
import { getPredefinedAccounts } from "@/lib/actions";
import SettingsPageClient from "@/components/SettingsPageClient";

export default async function SettingsPage() {
    const session = await auth();

    if (!session || !session.user) {
        redirect("/login");
    }

    const predefinedAccounts = await getPredefinedAccounts();

    return (
        <SettingsPageClient
            userImage={(session.user as any).image}
            userEmail={session.user.email ?? ''}
            userRole={(session.user as any).role ?? ''}
            predefinedAccounts={predefinedAccounts}
        />
    );
}
