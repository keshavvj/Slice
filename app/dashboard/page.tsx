
'use client';

import * as React from 'react';
import { SafeToSpendCard } from '@/components/dashboard/SafeToSpendCard';
import { PortfolioCard } from '@/components/dashboard/PortfolioCard';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useSession } from "next-auth/react";

export default function Dashboard() {
    const { user, transactions, setTransactions, addTransaction } = useStore();
    const { data: session } = useSession();

    React.useEffect(() => {
        // Initial fetch if empty (demo logic)
        // Actually we seeded data in store, so it's never empty. 
        // To demo Nessie, we could force fetch if configured.
        if (process.env.NEXT_PUBLIC_NESSIE_API_KEY) {
            // fetch logic
        }
    }, []);

    const handleSimulateRide = () => {
        addTransaction({
            id: `tx_${Date.now()}`,
            date: new Date().toISOString(),
            merchant_name: "Uber",
            category: "Transport",
            amount: 32.50,
            status: "posted",
            accountId: "acc_1"
        });
        // Maybe trigger toast?
        alert("Simulated Uber ride for $32.50");
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    {session?.user?.name && <p className="text-muted-foreground">Welcome back, {session.user.name}</p>}
                </div>
                <Button onClick={handleSimulateRide}>
                    <Plus className="mr-2 h-4 w-4" />
                    Simulate Ride
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <SafeToSpendCard />
                <PortfolioCard />

                <Card className="col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Pending Splits</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3</div>
                        <p className="text-xs text-muted-foreground">
                            Needs review
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <RecentTransactions />
                {/* Could add Pending Splits table here */}
            </div>
        </div>
    );
}
