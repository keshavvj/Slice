'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';

const timeRanges = [
    { label: '1D', value: '1d' },
    { label: '1W', value: '1w' },
    { label: '1M', value: '1m' },
    { label: '3M', value: '3m' },
    { label: '1Y', value: '1y' },
    { label: 'ALL', value: 'all' },
];

export function PortfolioCard() {
    const { portfolio } = useStore();
    const [selectedRange, setSelectedRange] = React.useState('1M');

    // Generate realistic "Robinhood-style" data using Brownian Bridge
    const { chartData, color } = React.useMemo(() => {

        let points = 50;

        // Settings based on range that allow for more "meandering" (random walk)
        switch (selectedRange) {
            case '1D': points = 48; break; // 30 min intervals
            case '1W': points = 84; break; // 2 hour intervals
            case '1M': points = 60; break; // 12 hour intervals
            case '3M': points = 90; break; // Daily
            case '1Y': points = 52; break; // Weekly
            case 'ALL': points = 100; break;
        }

        const endPrice = portfolio.balance;

        // Derive startPrice from the stored percent change
        // Formula: End = Start * (1 + percent/100) -> Start = End / (1 + percent/100)
        let percentChange = portfolio.weeklyChangePercent;

        // Adjust simulated percent based on range (just for visual variety if user clicks around)
        // But keep the base anchor bounded by the real data if possible, or just scale it.
        // For simplicity and correctness request: Let's use the store's percent as the truth for the default view.
        // If range changes, we can scale it to look realistic.
        switch (selectedRange) {
            case '1D': percentChange /= 7; break;
            case '1W': percentChange *= 1; break;
            case '1M': percentChange *= 4; break;
            case '3M': percentChange *= 12; break;
            case '1Y': percentChange *= 52; break;
            case 'ALL': percentChange *= 100; break; // Long term
        }

        // Avoid division by zero issues or weird negative growth inversions for this simple chart
        if (percentChange <= -100) percentChange = -99;

        const startPrice = endPrice / (1 + (percentChange / 100));

        const data = [];

        // Calculate dates based on range
        const now = new Date();
        const getPointDate = (index: number, totalPoints: number): string => {
            const date = new Date(now);
            switch (selectedRange) {
                case '1D':
                    // 30 min intervals
                    date.setMinutes(date.getMinutes() - (totalPoints - 1 - index) * 30);
                    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                case '1W':
                    // ~2 hour intervals
                    date.setHours(date.getHours() - (totalPoints - 1 - index) * 2);
                    return date.toLocaleDateString([], { weekday: 'short' });
                case '1M':
                    // ~12 hour intervals
                    date.setHours(date.getHours() - (totalPoints - 1 - index) * 12);
                    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                case '3M':
                    // Daily
                    date.setDate(date.getDate() - (totalPoints - 1 - index));
                    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                case '1Y':
                    // Weekly
                    date.setDate(date.getDate() - (totalPoints - 1 - index) * 7);
                    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                case 'ALL':
                    // Monthly-ish (just distributing over points)
                    date.setMonth(date.getMonth() - Math.floor((totalPoints - 1 - index) / 2));
                    return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
                default:
                    return `Pt ${index}`;
            }
        };

        // Generate Exponential Curve with slight noise
        for (let i = 0; i < points; i++) {
            const t = i / (points - 1); // Progress 0 to 1

            // Exponential Trend: t^3 gives a nice slow start and rapid finish
            // Price = Start + (TotalGain * t^3)
            const trend = Math.pow(t, 3);
            let price = startPrice + (endPrice - startPrice) * trend;

            // Add slight consistent volatility that doesn't break the curve
            // Noise grows slightly as price grows (volatility drag)
            const noise = (Math.random() - 0.5) * (endPrice * 0.02);

            data.push({
                date: getPointDate(i, points),
                value: price + noise
            });
        }

        // Determine color based on performance
        const isPositive = true; // Always positive for this exponential view
        const color = "#22c55e"; // Green-500

        return { chartData: data, color };
    }, [portfolio.balance, portfolio.weeklyChangePercent, selectedRange]);

    return (
        <Card className="col-span-2 shadow-none border rounded-xl">
            <CardHeader className="p-6 pb-0">
                <div className="flex flex-col gap-1">
                    <CardDescription className="font-semibold text-xs tracking-wider uppercase opacity-70">Investing</CardDescription>
                    <div className="flex items-baseline gap-2">
                        <div className="text-4xl font-bold tracking-tight" style={{ color: color }}>
                            ${portfolio.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: color }}>
                        <ArrowUpRight className="w-4 h-4" />
                        {/* Calculate actual profit based on current range scaling */
                            (() => {
                                let percent = portfolio.weeklyChangePercent;
                                switch (selectedRange) {
                                    case '1D': percent /= 7; break;
                                    case '1W': percent *= 1; break;
                                    case '1M': percent *= 4; break;
                                    case '3M': percent *= 12; break;
                                    case '1Y': percent *= 52; break;
                                    case 'ALL': percent *= 100; break;
                                }
                                const start = portfolio.balance / (1 + (percent / 100));
                                const profit = portfolio.balance - start;

                                return (
                                    <>
                                        <span>{profit >= 0 ? '+' : ''}${profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                        <span>({profit >= 0 ? '+' : ''}{percent.toFixed(2)}%)</span>
                                    </>
                                );
                            })()
                        }
                        <span className="text-muted-foreground ml-1 font-normal">past {selectedRange.toLowerCase()}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="h-[280px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={color} stopOpacity={0.1} />
                                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke="oklch(var(--border))" strokeDasharray="3 3" opacity={0.5} />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'oklch(var(--muted-foreground))', fontSize: 11 }}
                                tickMargin={10}
                                minTickGap={30}
                            />
                            <YAxis
                                domain={['dataMin', 'dataMax']}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'oklch(var(--muted-foreground))', fontSize: 11 }}
                                tickFormatter={(value) => `$${value.toFixed(0)}`}
                                width={50}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'oklch(var(--card))',
                                    borderColor: 'oklch(var(--border))',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    borderRadius: '8px',
                                }}
                                itemStyle={{ color: color }}
                                labelStyle={{ display: 'none' }}
                                formatter={(value: number | undefined) => [`$${Number(value || 0).toFixed(2)}`, '']}
                                cursor={{ stroke: 'oklch(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={color}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Time Range Selectors */}
                <div className="flex justify-between px-6 pb-6 pt-2 border-t">
                    {timeRanges.map((range) => (
                        <button
                            key={range.value}
                            onClick={() => setSelectedRange(range.label)}
                            className={`text-xs font-bold transition-colors hover:text-foreground ${selectedRange === range.label
                                ? 'text-foreground'
                                : 'text-muted-foreground'
                                }`}
                            style={selectedRange === range.label ? { color: color } : {}}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
