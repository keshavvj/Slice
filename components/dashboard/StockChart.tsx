
"use client"

import { useMemo } from "react"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { FinnhubCandles } from "@/lib/finnhub"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface StockChartProps {
    symbol: string
    name: string
    data: FinnhubCandles | null
    loading?: boolean
    error?: string | null
}

export function StockChart({ symbol, name, data, loading, error }: StockChartProps) {
    const chartData = useMemo(() => {
        if (!data || !data.t) return []

        return data.t.map((timestamp, index) => ({
            date: new Date(timestamp * 1000),
            price: data.c[index],
            open: data.o[index],
            high: data.h[index],
            low: data.l[index],
        }))
    }, [data])

    if (loading) {
        return (
            <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading chart data...
            </div>
        )
    }

    if (error) {
        return (
            <div className="h-[300px] w-full flex flex-col items-center justify-center text-red-500 p-4 text-center">
                <p className="font-semibold mb-2">Unable to load chart</p>
                <p className="text-xs text-muted-foreground break-all">{error}</p>
            </div>
        )
    }

    if (!data || chartData.length === 0) {
        return (
            <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
                No chart data available for this timeframe.
            </div>
        )
    }

    const startPrice = chartData[0]?.price || 0
    const endPrice = chartData[chartData.length - 1]?.price || 0
    const isPositive = endPrice >= startPrice
    const color = isPositive ? "#22c55e" : "#ef4444" // green-500 : red-500

    return (
        <div className="w-full h-[350px]">
            <div className="mb-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold">${endPrice.toFixed(2)}</span>
                <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? '+' : ''}{((endPrice - startPrice) / startPrice * 100).toFixed(2)}% (30d)
                </span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={(val) => format(val, "MMM d")}
                        minTickGap={30}
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        domain={['auto', 'auto']}
                        tickFormatter={(val) => `$${val.toFixed(0)}`}
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        width={60}
                    />
                    <Tooltip
                        content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="flex flex-col">
                                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                    Date
                                                </span>
                                                <span className="font-bold text-muted-foreground">
                                                    {label ? format(new Date(label), "MMM d, yyyy") : ""}
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                    Price
                                                </span>
                                                <span className="font-bold text-foreground">
                                                    ${Number(payload[0].value).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }
                            return null
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="price"
                        stroke={color}
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
