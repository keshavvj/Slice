import { auth0 } from "@/lib/auth0";
import prisma from '@/lib/prisma';
import { User } from '@prisma/client';

export const requireUser = async (): Promise<User> => {
    const session = await auth0.getSession();

    if (!session || !session.user) {
        throw new Error('Unauthorized');
    }

    const auth0Id = session.user.sub;
    const email = session.user.email;
    const name = session.user.name;

    // Find or create the user in the database
    let user = await prisma.user.upsert({
        where: { auth0Id },
        update: {
            email: email || undefined,
            displayName: name || undefined
        },
        create: {
            auth0Id,
            email: email || null,
            displayName: name || null,
            handle: null, // Will be generated below
        },
    });

    if (!user.handle) {
        const baseHandle = generateBaseHandle(email, name);
        let uniqueHandle = baseHandle;
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 5) {
            try {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { handle: uniqueHandle }
                });
                isUnique = true;
            } catch (error: any) {
                // If unique constraint violation (P2002), try again with random suffix
                if (error.code === 'P2002') {
                    uniqueHandle = `${baseHandle}${Math.floor(Math.random() * 10000)}`;
                    attempts++;
                } else {
                    throw error;
                }
            }
        }
    }

    return user;
};

function generateBaseHandle(email?: string | null, name?: string | null): string {
    let base = 'user';
    if (email) {
        base = email.split('@')[0];
    } else if (name) {
        base = name.replace(/\s+/g, '').slice(0, 15);
    }

    // Normalize: lowercase, alphanumeric + underscore only
    return base.toLowerCase().replace(/[^a-z0-9_]/g, '');
}
