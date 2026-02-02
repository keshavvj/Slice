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

    // Find or create the user in the database
    // Using upsert to handle race conditions and ensure latest email is captured
    const user = await prisma.user.upsert({
        where: { auth0Id },
        update: {
            email: email || undefined
        },
        create: {
            auth0Id,
            email: email || null,
        },
    });

    return user;
};
