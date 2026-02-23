import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password || password.length < 6) {
            return NextResponse.json({ error: 'Invalid input. Password must be at least 6 characters.' }, { status: 400 });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create user
        const newUser = await prisma.user.create({
            data: {
                email,
                passwordHash,
            },
            select: {
                id: true,
                email: true,
                createdAt: true,
            }
        });

        return NextResponse.json({ message: 'User created successfully', user: newUser }, { status: 201 });
    } catch (error: any) {
        console.error('Registration error details:', {
            message: error?.message,
            code: error?.code,
            meta: error?.meta,
            stack: error?.stack,
        });
        return NextResponse.json({ error: 'Internal server error', details: error?.message }, { status: 500 });
    }
}
