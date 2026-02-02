
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/currentUser';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const currentUser = await requireUser();

        // Friendships are stored canonically (userAId < userBId)
        // We need to fetch both where currentUser is userA AND userB
        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [
                    { userAId: currentUser.id },
                    { userBId: currentUser.id }
                ]
            },
            include: {
                userA: {
                    select: { id: true, handle: true, displayName: true }
                },
                userB: {
                    select: { id: true, handle: true, displayName: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Map to just the "other" user
        const friends = friendships.map(f => {
            if (f.userAId === currentUser.id) {
                return { ...f.userB, since: f.createdAt };
            } else {
                return { ...f.userA, since: f.createdAt };
            }
        });

        return NextResponse.json({ friends });

    } catch (error) {
        console.error('Error fetching friends:', error);
        return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 });
    }
}
