
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/currentUser';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const currentUser = await requireUser();

        // Generate a random code (8 chars base62-ish)
        // using hex and slicing is easy enough
        const code = crypto.randomBytes(6).toString('hex').slice(0, 10);

        const invite = await prisma.friendInvite.create({
            data: {
                code,
                createdByUserId: currentUser.id,
                status: 'active'
                // expiresAt could be added here
            }
        });

        return NextResponse.json({
            ok: true,
            code: invite.code,
            url: `${process.env.APP_BASE_URL}/friends/invite/${invite.code}`
        });

    } catch (error) {
        console.error('Error creating invite:', error);
        return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
    }
}
