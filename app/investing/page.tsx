'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import { PortfolioCard } from '@/components/dashboard/PortfolioCard';

export default function InvestingPage() {
    const { user, updateUserParams, performInvestment } = useStore();

    const handlePercentChange = (val: number[]) => {
        updateUserParams({ investPercent: val[0] });
    };

    const handleSimulatePaycheck = () => {
        // Simulate $2000 paycheck investing
        const amount = (user.investPercent / 100) * 2000;
        performInvestment(amount, "paycheck", `Paycheck allocation (${user.investPercent}%)`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Micro-Investing</h1>
                <Button onClick={handleSimulatePaycheck}>Simulate Paycheck</Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Controls</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-sm font-medium">Paycheck Allocation</label>
                                <span className="text-sm font-bold">{user.investPercent}%</span>
                            </div>
                            <Slider
                                defaultValue={[user.investPercent]}
                                max={20}
                                step={1}
                                onValueChange={handlePercentChange}
                            />
                            <p className="text-xs text-muted-foreground">
                                Automatically moves {user.investPercent}% of every deposit into your portfolio.
                            </p>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Round-ups</label>
                            <Button
                                variant={user.roundupsEnabled ? "default" : "outline"}
                                onClick={() => updateUserParams({ roundupsEnabled: !user.roundupsEnabled })}
                                size="sm"
                            >
                                {user.roundupsEnabled ? "On" : "Off"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <PortfolioCard />
            </div>
        </div>
    );
}
