
'use client';

import * as React from 'react';
import { SafeToSpendCard } from '@/components/dashboard/SafeToSpendCard';
import { PortfolioCard } from '@/components/dashboard/PortfolioCard';
import { AIInsightsCards } from '@/components/dashboard/AIInsightsCards';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import { generatePendingSummary, generateSmartTransaction } from '@/lib/logic';
import { Button } from '@/components/ui/button';
import { Plus, Send, Zap, Split, ArrowUpRight } from 'lucide-react';
import { useSession } from "next-auth/react";
import Link from 'next/link';
import { useEffect } from 'react';

export default function Dashboard() {
    const { user, transactions, setTransactions, addTransaction, nessieConnected, syncNessieData, portfolio, splitRequests, friends } = useStore();
    const { data: session } = useSession();

    // Calculate pending summary
    const { summary: pendingSummary, total: pendingTotal } = generatePendingSummary(splitRequests, friends, transactions, user.id);

    useEffect(() => {
        // Attempt to sync on mount
        syncNessieData();
    }, []);

    const handleSimulateCharge = () => {
        const { merchant, category, amount } = generateSmartTransaction();
        useStore.getState().simulateNessieTransaction(merchant, amount);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Data Source Banner */}
            {!nessieConnected && (
                <div className="w-full py-2 px-4 text-center text-xs font-bold uppercase tracking-wider rounded border bg-amber-50 text-amber-700 border-amber-200">
                    ⚠ Using Demo Data
                </div>
            )}

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-medium text-muted-foreground">
                        Total Balance
                    </h2>
                    <div className="text-5xl font-black tracking-tighter mt-1">
                        ${(user.checkingBalance + portfolio.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Welcome back, {session?.user?.name?.split(' ')[0] || 'Friend'}
                    </p>
                </div>
                <div className="flex gap-2">
                    {/* Add Money button removed as per feedback */}
                </div>
            </div>

            {/* Quick Actions Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/splits">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-dashed border-2 shadow-none hover:border-primary/50 group">
                        <CardContent className="p-6 flex flex-col items-center justify-center gap-3 text-center">
                            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Split className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="font-bold">Split a Bill</div>
                                <div className="text-xs text-muted-foreground">Scan or select</div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/friends">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-dashed border-2 shadow-none hover:border-primary/50 group">
                        <CardContent className="p-6 flex flex-col items-center justify-center gap-3 text-center">
                            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Send className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="font-bold">Send Cash</div>
                                <div className="text-xs text-muted-foreground">Free to friends</div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/investing">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-dashed border-2 shadow-none hover:border-primary/50 group">
                        <CardContent className="p-6 flex flex-col items-center justify-center gap-3 text-center">
                            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ArrowUpRight className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="font-bold">Invest</div>
                                <div className="text-xs text-muted-foreground">Auto-deposit</div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
                <div onClick={handleSimulateCharge} className="cursor-pointer">
                    <Card className="hover:bg-muted/50 transition-colors border-dashed border-2 shadow-none hover:border-primary/50 group h-full">
                        <CardContent className="p-6 flex flex-col items-center justify-center gap-3 text-center">
                            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Zap className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="font-bold">Simulate Charge</div>
                                <div className="text-xs text-muted-foreground">Demo feature</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Left Column (Spending) */}
                <div className="space-y-6 lg:col-span-2">
                    <div className="grid gap-6 md:grid-cols-2">
                        <SafeToSpendCard />
                        <PortfolioCard />
                    </div>
                    <RecentTransactions />
                </div>
                {/* Right Column (Social/Status) */}
                <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-primary to-violet-600 text-primary-foreground border-none shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Split className="w-5 h-5" /> Pending Requests
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black mb-2">${pendingTotal.toFixed(2)}</div>
                            <p className="text-primary-foreground/80 text-sm mb-4">
                                {pendingSummary}
                            </p>
                            <Button variant="secondary" className="w-full text-primary font-bold" asChild>
                                <Link href="/splits">
                                    View Details
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <AIInsightsCards />

                    <SocialFeedMock />
                </div>
            </div>
        </div>
    );
}

function SocialFeedMock() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Friends Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-3 items-start border-b pb-4 last:border-0 last:pb-0">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
                        JD
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm">
                            <span className="font-medium">John Doe</span> paid <span className="font-medium">Sarah</span>
                        </p>
                        <p className="text-xs text-muted-foreground">Pizza Night 🍕 • 2m ago</p>
                    </div>
                </div>
                <div className="flex gap-3 items-start border-b pb-4 last:border-0 last:pb-0">
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-xs">
                        AK
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm">
                            <span className="font-medium">Amy K</span> achieved a goal
                        </p>
                        <p className="text-xs text-muted-foreground">Bali Trip 🌴 • 1h ago</p>
                    </div>
                </div>
                <div className="flex gap-3 items-start border-b pb-4 last:border-0 last:pb-0">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-xs">
                        MS
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm">
                            <span className="font-medium">Mike S</span> invested in <span className="font-medium">Tech ETF</span>
                        </p>
                        <p className="text-xs text-muted-foreground">Round-ups 📈 • 4h ago</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
