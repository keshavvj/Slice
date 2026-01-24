'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

export function PortfolioCard() {
    const { portfolio } = useStore();

    return (
        <Card className="col-span-2 md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Investing Portfolio</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">${portfolio.balance.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                    +{portfolio.weeklyChangePercent}% this week
                </p>
                <div className="h-[120px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={portfolio.chartPoints}>
                            <XAxis
                                dataKey="date"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                hide
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <span className="font-bold text-muted-foreground">
                                                        {payload[0].payload.date}
                                                    </span>
                                                    <span className="font-bold">
                                                        ${(payload[0].value as number).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="var(--color-primary)" // Use CSS variable or fallback
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
