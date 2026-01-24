'use client';

import * as React from 'react';
import { AppSidebar } from '@/components/AppSidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen w-full bg-background">
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
