
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { PortfolioCard } from '@/components/dashboard/PortfolioCard';
import { TrendingUp, PieChart, ArrowUpRight, DollarSign } from 'lucide-react';

export default function InvestingPage() {
    const { user, updateUserParams, performInvestment } = useStore();

    const handlePercentChange = (val: number[]) => {
        updateUserParams({ investPercent: val[0] });
    };

    const handleSimulatePaycheck = () => {
        const amount = (user.investPercent / 100) * 2000;
        performInvestment(amount, "paycheck", `Paycheck allocation (${user.investPercent}%)`);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Micro-Investing</h1>
                    <p className="text-muted-foreground">Grow your wealth automatically.</p>
                </div>
                <Button onClick={handleSimulatePaycheck} size="lg" className="rounded-full">
                    <DollarSign className="mr-2 h-4 w-4" /> Simulate Paycheck
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Portfolio Graphic */}
                <div className="lg:col-span-2 space-y-6">
                    <PortfolioCard />

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">+12.5%</div>
                                <p className="text-xs text-muted-foreground">All time</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Dividends</CardTitle>
                                <PieChart className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">$34.20</div>
                                <p className="text-xs text-muted-foreground">Reinvested automatically</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Controls Sidebar */}
                <div className="space-y-6">
                    <Card className="h-fit">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ArrowUpRight className="w-5 h-5" /> Automation
                            </CardTitle>
                            <CardDescription>Configure your auto-invest rules.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Paycheck Split</label>
                                    <span className="px-2 py-1 rounded bg-primary text-primary-foreground text-xs font-bold">
                                        {user.investPercent}%
                                    </span>
                                </div>
                                <Slider
                                    defaultValue={[user.investPercent]}
                                    max={30}
                                    step={1}
                                    onValueChange={handlePercentChange}
                                    className="cursor-pointer"
                                />
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Whenever a deposit over $500 hits your account, we'll automatically move <strong>{user.investPercent}%</strong> to your portfolio.
                                </p>
                            </div>

                            <div className="pt-4 border-t space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium text-sm">Round-ups</div>
                                        <div className="text-xs text-muted-foreground">Invest spare change</div>
                                    </div>
                                    <Button
                                        variant={user.roundupsEnabled ? "default" : "outline"}
                                        onClick={() => updateUserParams({ roundupsEnabled: !user.roundupsEnabled })}
                                        size="sm"
                                        className={user.roundupsEnabled ? "bg-green-600 hover:bg-green-700" : ""}
                                    >
                                        {user.roundupsEnabled ? "Enabled" : "Disabled"}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-none">
                        <CardHeader>
                            <CardTitle className="text-lg">Invite Squad</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-indigo-100 mb-4">
                                Investing is better together. Create a shared portfolio goal with friends.
                            </p>
                            <Button variant="secondary" className="w-full text-indigo-600 font-bold">
                                Create Squad
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
