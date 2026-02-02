
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/currentUser';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const createSplitSchema = z.object({
    splits: z.array(z.object({
        friendId: z.string(),
        amount: z.number().positive(),
        description: z.string().optional(),
        payerId: z.string().optional() // Defaults to current user if not provided
    }))
});

export async function GET(request: NextRequest) {
    try {
        const user = await requireUser();

        // Fetch requests where user is sender (owed money) or receiver (owes money)
        const sentRequests = await prisma.splitRequest.findMany({
            where: { fromUserId: user.id },
            include: {
                toUser: {
                    select: { id: true, displayName: true, handle: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const receivedRequests = await prisma.splitRequest.findMany({
            where: { toUserId: user.id },
            include: {
                fromUser: {
                    select: { id: true, displayName: true, handle: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            sent: sentRequests,
            received: receivedRequests
        });

    } catch (error) {
        console.error('Error fetching splits:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await requireUser();
        const body = await request.json();
        const { splits } = createSplitSchema.parse(body);

        // Verify all friends exist? (Prisma will throw)

        await prisma.$transaction(
            splits.map(split => {
                const payerId = split.payerId || user.id;
                // If payer is ME, implies I lent money to friend (friend owes me).
                // SplitRequest: from=Me, to=Friend.
                // If payer is Friend, implies Friend lent money to ME (I owe friend).
                // SplitRequest: from=Friend, to=Me.

                // However, the input might be explicit:
                // "Alice paid $20 for Bob". 
                // Entry: Alice -> Bob $20.

                // Assuming logic:
                // User is creating the record.
                // If payerId == user.id, then `from` = user.id, `to` = friendId.
                // If payerId == friendId, then `from` = friendId, `to` = user.id.

                let fromUserId, toUserId;
                if (payerId === user.id) {
                    fromUserId = user.id;
                    toUserId = split.friendId;
                } else {
                    fromUserId = split.friendId; // friend paid
                    toUserId = user.id;          // I owe
                }

                return prisma.splitRequest.create({
                    data: {
                        fromUserId,
                        toUserId,
                        amount: split.amount,
                        description: split.description || 'Split Expense',
                        status: 'pending'
                    }
                });
            })
        );

        return NextResponse.json({ success: true }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error('Error creating split:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
