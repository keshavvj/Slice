
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/currentUser';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const currentUser = await requireUser();
        const body = await request.json();
        const { handle, toUserId } = body;

        let recipientId = toUserId;

        // If handle provided, resolve to userId
        if (handle) {
            const recipient = await prisma.user.findUnique({
                where: { handle },
                select: { id: true }
            });
            if (!recipient) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }
            recipientId = recipient.id;
        }

        if (!recipientId) {
            return NextResponse.json({ error: 'Recipient required' }, { status: 400 });
        }

        if (recipientId === currentUser.id) {
            return NextResponse.json({ error: 'Cannot add yourself' }, { status: 400 });
        }

        // Check existing friendship
        const existingFriendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { userAId: currentUser.id, userBId: recipientId },
                    { userAId: recipientId, userBId: currentUser.id }
                ]
            }
        });

        if (existingFriendship) {
            return NextResponse.json({ status: 'already_friends' });
        }

        // Upsert pending request
        // We use upsert so re-sending doesn't fail, just updates timestamp
        const friendRequest = await prisma.friendRequest.upsert({
            where: {
                fromUserId_toUserId: {
                    fromUserId: currentUser.id,
                    toUserId: recipientId
                }
            },
            update: {
                status: 'pending' // Reactivate if it was declined/canceled
            },
            create: {
                fromUserId: currentUser.id,
                toUserId: recipientId,
                status: 'pending'
            }
        });

        return NextResponse.json({ ok: true, request: friendRequest });

    } catch (error) {
        console.error('Error sending friend request:', error);
        return NextResponse.json({ error: 'Failed to send request' }, { status: 500 });
    }
}
