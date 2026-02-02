
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/currentUser';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Define params type correctly as a Promise for Next.js 15+
type Props = {
    params: Promise<{ id: string }>
}

const updateGoalSchema = z.object({
    title: z.string().optional(),
    targetAmount: z.number().optional(),
    // Recurring settings
    recurringEnabled: z.boolean().optional(),
    recurringAmount: z.number().optional(),
    recurringFrequency: z.string().optional(),
    recurringNextRun: z.string().optional(), // ISO String
});

export async function GET(request: NextRequest, { params }: Props) {
    try {
        const user = await requireUser();
        const { id } = await params;

        const goal = await prisma.goal.findUnique({
            where: { id },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                displayName: true,
                                handle: true,
                                email: true,
                            }
                        }
                    }
                },
                contributions: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                displayName: true,
                                handle: true,
                            }
                        }
                    }
                }
            }
        });

        if (!goal) {
            return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
        }

        // Authorization: Check if user is a member
        const isMember = goal.members.some(m => m.userId === user.id);
        if (!isMember) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json({ goal });

    } catch (error) {
        console.error('Error fetching goal details:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: Props) {
    try {
        const user = await requireUser();
        const { id } = await params;
        const body = await request.json();
        const updates = updateGoalSchema.parse(body);

        // Check authorization (Ownership)
        const membership = await prisma.goalMember.findUnique({
            where: {
                goalId_userId: {
                    goalId: id,
                    userId: user.id
                }
            }
        });

        if (!membership || membership.role !== 'OWNER') {
            return NextResponse.json({ error: 'Only the owner can update goal settings' }, { status: 403 });
        }

        const updatedGoal = await prisma.goal.update({
            where: { id },
            data: updates
        });

        return NextResponse.json({ goal: updatedGoal });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error('Error updating goal:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
