import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await (prisma.user as any).findUnique({
            where: { email: session.user.email },
            include: { 
                predefinedAccounts: true,
                stockAliases: true
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            userImage: user.image,
            userEmail: user.email,
            userRole: user.role,
            predefinedAccounts: (user as any).predefinedAccounts,
            stockAliases: (user as any).stockAliases,
            appTheme: (user as any).appTheme || 'DARK',
            stockColorMode: (user as any).stockColorMode || 'KOREA'
        });
    } catch (error) {
        console.error("Failed to fetch settings data", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
