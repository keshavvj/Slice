
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/currentUser';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const currentUser = await requireUser();

        return NextResponse.json({
            id: currentUser.id,
            auth0Id: currentUser.auth0Id,
            email: currentUser.email,
            handle: currentUser.handle,
            displayName: currentUser.displayName,
            createdAt: currentUser.createdAt
        });

    } catch (error) {
        console.error('Error fetching current user:', error);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}
