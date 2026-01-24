'use client';

import * as React from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { usePathname } from 'next/navigation';

export function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isPublic = pathname === "/" || pathname === "/login";

    if (isPublic) {
        return <main>{children}</main>;
    }

    return (
        <div className="flex min-h-screen w-full bg-muted/20">
            <Aside className="hidden md:block" />
            <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto p-6 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

function Aside({ className }: { className?: string }) {
    return (
        <aside className={className}>
            <AppSidebar />
        </aside>
    );
}
