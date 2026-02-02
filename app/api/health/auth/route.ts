import { NextResponse } from 'next/server';
import { auth0 } from "@/lib/auth0";
import { requireUser } from '@/lib/currentUser';

export async function GET() {
    try {
        const session = await auth0.getSession();

        if (!session || !session.user) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        try {
            const dbUser = await requireUser();
            return NextResponse.json({
                authenticated: true,
                auth0Sub: session.user.sub,
                userId: dbUser.id,
                userEmail: dbUser.email
            });
        } catch (dbError) {
            return NextResponse.json({
                authenticated: true,
                auth0Sub: session.user.sub,
                dbError: 'Failed to sync user'
            }, { status: 500 });
        }

    } catch (error) {
        return NextResponse.json(
            { status: 'error', message: 'Auth check failed' },
            { status: 500 }
        );
    }
}
