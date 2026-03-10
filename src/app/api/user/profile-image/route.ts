import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/../auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.email) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { image: true }
        });

        if (!user?.image) {
            return new NextResponse('Not Found', { status: 404 });
        }

        // Handle Base64 strings
        if (user.image.startsWith('data:image/')) {
            const [header, base64Data] = user.image.split(',');
            const mimeType = header.split(':')[1].split(';')[0];
            const buffer = Buffer.from(base64Data, 'base64');

            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': mimeType,
                    'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
                }
            });
        }

        // Handle legacy URLs (if any)
        return NextResponse.redirect(new URL(user.image, req.url));
    } catch (error) {
        console.error('Failed to fetch profile image:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
