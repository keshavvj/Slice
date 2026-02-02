
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/currentUser';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const updateProfileSchema = z.object({
    handle: z.string()
        .min(3, 'Handle must be at least 3 characters')
        .max(20, 'Handle must be less than 20 characters')
        .regex(/^[a-z0-9_]+$/, 'Handle can only contain lowercase letters, numbers, and underscores'),
});

export async function PATCH(request: NextRequest) {
    try {
        const currentUser = await requireUser();
        const body = await request.json();

        const result = updateProfileSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { error: result.error.errors[0].message },
                { status: 400 }
            );
        }

        const { handle } = result.data;

        // Check uniqueness (if changing)
        if (handle !== currentUser.handle) {
            const existing = await prisma.user.findUnique({
                where: { handle }
            });
            if (existing) {
                return NextResponse.json(
                    { error: 'Handle already taken' },
                    { status: 409 }
                );
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: currentUser.id },
            data: { handle }
        });

        return NextResponse.json({ ok: true, user: updatedUser });

    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
