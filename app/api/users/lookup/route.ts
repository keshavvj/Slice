
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/currentUser';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const currentUser = await requireUser();
        const searchParams = request.nextUrl.searchParams;
        const handleQuery = searchParams.get('handle');

        if (!handleQuery || handleQuery.length < 3) {
            return NextResponse.json({ users: [] });
        }

        // Normalize query
        const query = handleQuery.toLowerCase().trim();

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { handle: query }, // Exact match
                    { handle: { startsWith: query } } // Prefix match
                ],
                NOT: {
                    id: currentUser.id // Exclude self
                }
            },
            take: 5,
            select: {
                id: true,
                handle: true,
                displayName: true,
                // NO PII (email, auth0Id)
            }
        });

        return NextResponse.json({ users });

    } catch (error) {
        console.error('Error looking up users:', error);
        return NextResponse.json({ error: 'Failed to lookup users' }, { status: 500 });
    }
}
