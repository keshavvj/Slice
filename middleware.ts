import { auth0 } from "@/lib/auth0";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    return await auth0.middleware(request);
}

export const config = {
    matcher: [
        '/auth/:path*', // Ensure middleware handles auth routes
        '/dashboard/:path*',
        '/friends/:path*',
        '/investing/:path*',
        '/splits/:path*',
        '/goal/:path*',
        '/settings/:path*',
        '/api/nessie/:path*', // Protect backend API routes except auth/health
    ],
};
