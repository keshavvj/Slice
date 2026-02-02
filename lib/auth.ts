import { auth0 } from "@/lib/auth0";

export const requireAuthSession = async () => {
    const session = await auth0.getSession();

    if (!session || !session.user) {
        throw new Error('Unauthorized');
    }

    return session;
};

export const getAuth0User = async () => {
    try {
        const session = await auth0.getSession();
        return session?.user || null;
    } catch (error) {
        return null;
    }
}
