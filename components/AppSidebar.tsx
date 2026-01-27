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
    LogOut,
    Sun,
    Moon
} from 'lucide-react';
import { handleSignOut } from '@/lib/actions';
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";

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
                <div className="mt-4 pt-4 border-t flex items-center justify-between px-2">
                    <span className="text-xs text-muted-foreground font-medium px-2">Theme</span>
                    <ThemeToggle />
                </div>
            </div>
        </div>
    );
}

function ThemeToggle() {
    const { setTheme, theme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}
