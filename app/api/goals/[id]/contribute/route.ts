
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/currentUser';
import prisma from '@/lib/prisma';
import { z } from 'zod';

type Props = {
    params: Promise<{ id: string }>
}

const contributionSchema = z.object({
    amount: z.number().positive(),
    note: z.string().optional(),
    type: z.string().default('manual')
});

export async function POST(request: NextRequest, { params }: Props) {
    try {
        const user = await requireUser();
        const { id } = await params;
        const body = await request.json();
        const { amount, note, type } = contributionSchema.parse(body);

        // Verify membership
        const membership = await prisma.goalMember.findUnique({
            where: {
                goalId_userId: {
                    goalId: id,
                    userId: user.id
                }
            }
        });

        if (!membership) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Transaction: Create contribution + Update Goal total
        const result = await prisma.$transaction(async (tx) => {
            const contribution = await tx.contribution.create({
                data: {
                    goalId: id,
                    userId: user.id,
                    amount,
                    note,
                    type
                }
            });

            const updatedGoal = await tx.goal.update({
                where: { id },
                data: {
                    currentAmount: {
                        increment: amount
                    }
                }
            });

            return { contribution, updatedGoal };
        });

        return NextResponse.json(result);

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error('Error adding contribution:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
