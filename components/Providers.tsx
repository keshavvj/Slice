"use client"

import { Auth0Provider } from '@auth0/nextjs-auth0/client';
import { ThemeProvider } from "next-themes"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <Auth0Provider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                {children}
            </ThemeProvider>
        </Auth0Provider>
    )
}
