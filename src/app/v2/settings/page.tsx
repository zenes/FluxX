import { auth } from "@/../auth";
import { redirect } from "next/navigation";
import { getPredefinedAccounts } from "@/lib/actions";
import ClientSettingsDashboard from "./ClientSettingsDashboard";

export default async function SettingsPage() {
    const session = await auth();

    if (!session || !session.user) {
        redirect("/login");
    }

    const predefinedAccounts = await getPredefinedAccounts();

    return (
        <ClientSettingsDashboard
            userImage={(session.user as any).image}
            userEmail={session.user.email ?? ''}
            userRole={(session.user as any).role ?? ''}
            predefinedAccounts={predefinedAccounts}
        />
    );
}
