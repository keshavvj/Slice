
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/currentUser';
import prisma from '@/lib/prisma';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Updated for Next.js 15+ async params
) {
    try {
        const currentUser = await requireUser();
        const { id } = await params;

        const friendRequest = await prisma.friendRequest.findUnique({
            where: { id },
        });

        if (!friendRequest) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        if (friendRequest.toUserId !== currentUser.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await prisma.friendRequest.update({
            where: { id },
            data: { status: 'declined' }
        });

        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error('Error declining friend request:', error);
        return NextResponse.json({ error: 'Failed to decline request' }, { status: 500 });
    }
}
