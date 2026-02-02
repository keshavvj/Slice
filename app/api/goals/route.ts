
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/currentUser';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const createGoalSchema = z.object({
    title: z.string().min(1, "Title is required"),
    targetAmount: z.number().min(1, "Target amount must be at least 1"),
    category: z.string().default("General"),
    members: z.array(z.string()).optional(), // Array of user IDs to invite
});

export async function GET(request: NextRequest) {
    try {
        const user = await requireUser();

        // Fetch goals where the user is a member
        const goals = await prisma.goal.findMany({
            where: {
                members: {
                    some: {
                        userId: user.id
                    }
                }
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                displayName: true,
                                handle: true,
                                email: true, // Only if needed?
                            }
                        }
                    }
                },
                contributions: true, // We might want to just aggregate this optionally?
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        // Compute currentAmount dynamically to be safe? 
        // Or trust the field `currentAmount` if we maintain it well.
        // Let's rely on standardizing the response.

        return NextResponse.json({ goals });
    } catch (error) {
        console.error('Error fetching goals:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await requireUser();
        const body = await request.json();
        const { title, targetAmount, category, members } = createGoalSchema.parse(body);

        // Transaction to create goal and add members
        const goal = await prisma.$transaction(async (tx) => {
            const newGoal = await tx.goal.create({
                data: {
                    title,
                    targetAmount,
                    category,
                    currentAmount: 0,
                }
            });

            // Add Creator as OWNER
            await tx.goalMember.create({
                data: {
                    goalId: newGoal.id,
                    userId: user.id,
                    role: 'OWNER'
                }
            });

            // Add other members as MEMBER
            if (members && members.length > 0) {
                // Filter out self if included
                const otherMembers = members.filter(id => id !== user.id);

                if (otherMembers.length > 0) {
                    await tx.goalMember.createMany({
                        data: otherMembers.map(memberId => ({
                            goalId: newGoal.id,
                            userId: memberId,
                            role: 'MEMBER'
                        }))
                    });
                }
            }

            return newGoal;
        });

        return NextResponse.json({ goal }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error('Error creating goal:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
