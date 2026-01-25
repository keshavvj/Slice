'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Home,
    Split,
    Users,
    TrendingUp,
    Target,
    Settings,
    LogOut
} from 'lucide-react';
import { handleSignOut } from '@/lib/actions';
import { useSession } from "next-auth/react";

const NAV_ITEMS = [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Splits', href: '/splits', icon: Split },
    { label: 'Friends', href: '/friends', icon: Users },
    { label: 'Investing', href: '/investing', icon: TrendingUp },
    { label: 'Goals', href: '/goal', icon: Target },
    { label: 'Settings', href: '/settings', icon: Settings },
];

import { DASHBOARD_LOGO_DATA_URI } from "@/lib/dashboard-logo-data";

export function AppSidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
            <div className="flex h-32 items-center border-b px-6">
                <img
                    src={DASHBOARD_LOGO_DATA_URI}
                    alt="Slice"
                    className="h-24 w-auto object-contain"
                />
            </div>
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-3">
                    {NAV_ITEMS.map((item) => (
                        <Link key={item.href} href={item.href}>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start",
                                    pathname === item.href && "bg-sidebar-accent text-sidebar-accent-foreground"
                                )}
                            >
                                <item.icon className="mr-2 h-4 w-4" />
                                {item.label}
                            </Button>
                        </Link>
                    ))}
                </nav>
            </div>
            <div className="border-t p-4">
                {session?.user && (
                    <div className="mb-2 px-4 text-xs font-medium text-muted-foreground truncate">
                        {session.user.name || session.user.email}
                    </div>
                )}
                <form action={handleSignOut}>
                    <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        Log Out
                    </Button>
                </form>
            </div>
        </div>
    );
}
