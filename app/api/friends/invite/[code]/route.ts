
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/currentUser';
import prisma from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    // Public endpoint (protected by obscure code) to preview invite
    try {
        const { code } = await params;
        const invite = await prisma.friendInvite.findUnique({
            where: { code },
            include: {
                createdByUser: {
                    select: { id: true, handle: true, displayName: true }
                }
            }
        });

        if (!invite || invite.status !== 'active') {
            return NextResponse.json({ valid: false });
        }

        return NextResponse.json({
            valid: true,
            user: invite.createdByUser
        });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch invite' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const currentUser = await requireUser();
        const { code } = await params;

        const invite = await prisma.friendInvite.findUnique({
            where: { code },
        });

        if (!invite || invite.status !== 'active') {
            return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 });
        }

        if (invite.createdByUserId === currentUser.id) {
            return NextResponse.json({ error: 'Cannot claim your own invite' }, { status: 400 });
        }

        // Direct Friendship Creation (MVP)
        const [userAId, userBId] = [invite.createdByUserId, currentUser.id].sort();

        // Check if already friends
        const existingFriendship = await prisma.friendship.findUnique({
            where: {
                userAId_userBId: { userAId, userBId }
            }
        });

        if (existingFriendship) {
            return NextResponse.json({ status: 'already_friends' });
        }

        // Create Friendship
        await prisma.$transaction([
            prisma.friendship.create({
                data: {
                    userAId,
                    userBId
                }
            }),
            // Mark invite as disabled (single-use)
            prisma.friendInvite.update({
                where: { id: invite.id },
                data: { status: 'disabled' }
            })
        ]);

        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error('Error claiming invite:', error);
        return NextResponse.json({ error: 'Failed to claim invite' }, { status: 500 });
    }
}
