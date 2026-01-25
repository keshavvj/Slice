'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { calculateSafeToSpend } from '@/lib/logic';
import { useStore } from '@/lib/store';

export function SafeToSpendCard() {
    const { user, bills, splitRequests, investments } = useStore();

    // Calculate expected investing for next 7 days (simplified estimate)
    // For MVP, just assume 10% of balance if paycheck coming soon? 
    // Or just 0 for now as it's "safe to spend" meaning "discretionary".
    const expectedInvesting = 0;

    // Pending splits I OWE
    const pendingSplitsOwed = splitRequests
        .filter(r => r.friendId === user.id && r.status === 'pending') // wait, splitRequest structure: requesterId, friendId. If I am friendId, I owe? Usually requester is "me" splitting "my" tx. If friend pays, they create request.
        // Let's assume: requester paid, friend owes.
        // If I am requester, friend owes me. (Asset)
        // If I am friend, I owe requester. (Liability)
        // "Safe to spend" should subtract what I OWE.
        .filter(r => r.friendId === user.id && r.status === 'pending')
        .reduce((acc, r) => acc + r.amountOwed, 0);

    const { safeAmount, breakdown } = calculateSafeToSpend(
        user.checkingBalance,
        bills,
        pendingSplitsOwed,
        expectedInvesting,
        user.safetyThreshold
    );

    const percent = Math.min(100, Math.max(0, (safeAmount / user.checkingBalance) * 100));

    return (
        <Card className="col-span-2">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Safe-to-Spend
                    </CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Balance - Bills (7d) - Owings</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <div className="flex items-baseline space-x-2">
                    <span className="text-4xl font-bold tracking-tight">
                        ${safeAmount.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                        of ${user.checkingBalance.toFixed(2)}
                    </span>
                </div>
            </CardHeader>
            <CardContent>
                <Progress value={percent} className="h-3" />
                <div className="mt-4 flex justify-between text-xs text-muted-foreground">
                    <div>
                        <span className="block font-semibold text-foreground">-${breakdown.billsTotal.toFixed(2)}</span>
                        Bills (7d)
                    </div>
                    <div>
                        <span className="block font-semibold text-foreground">-${breakdown.pendingSplitsOwedByUser.toFixed(2)}</span>
                        Pending Splits
                    </div>
                    <div>
                        <span className="block font-semibold text-foreground">-${user.safetyThreshold}</span>
                        Safety Buffer
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
