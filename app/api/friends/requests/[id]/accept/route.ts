
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

        // Verify request exists and is for current user
        const friendRequest = await prisma.friendRequest.findUnique({
            where: { id },
        });

        if (!friendRequest) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        if (friendRequest.toUserId !== currentUser.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        if (friendRequest.status !== 'pending') {
            return NextResponse.json({ error: 'Request is not pending' }, { status: 400 });
        }

        // Transaction: update request status AND create friendship
        // Canonical order: userAId < userBId
        const [userAId, userBId] = [friendRequest.fromUserId, friendRequest.toUserId].sort();

        await prisma.$transaction([
            prisma.friendRequest.update({
                where: { id },
                data: { status: 'accepted' }
            }),
            prisma.friendship.create({
                data: {
                    userAId,
                    userBId
                }
            })
        ]);

        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error('Error accepting friend request:', error);
        return NextResponse.json({ error: 'Failed to accept request' }, { status: 500 });
    }
}
