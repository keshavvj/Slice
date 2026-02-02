
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/currentUser';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const currentUser = await requireUser();

        // Fetch incoming and outgoing requests
        const [incoming, outgoing] = await Promise.all([
            prisma.friendRequest.findMany({
                where: {
                    toUserId: currentUser.id,
                    status: 'pending'
                },
                include: {
                    fromUser: {
                        select: { id: true, handle: true, displayName: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.friendRequest.findMany({
                where: {
                    fromUserId: currentUser.id,
                    status: 'pending'
                },
                include: {
                    toUser: {
                        select: { id: true, handle: true, displayName: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            })
        ]);

        return NextResponse.json({
            incoming: incoming.map(req => ({
                id: req.id,
                user: req.fromUser,
                type: 'incoming',
                createdAt: req.createdAt
            })),
            outgoing: outgoing.map(req => ({
                id: req.id,
                user: req.toUser,
                type: 'outgoing',
                createdAt: req.createdAt
            }))
        });

    } catch (error) {
        console.error('Error fetching friend requests:', error);
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }
}
