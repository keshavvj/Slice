"use client"

import * as React from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/lib/store"

export function AssetAllocation() {
    const { user } = useStore()

    const data = React.useMemo(() => {
        const selected = user.selectedStocks || ["AAPL", "MSFT", "SPY", "BINANCE:BTCUSDT"] // Default fallbacks

        let stockCount = 0
        let cryptoCount = 0

        selected.forEach(s => {
            if (s.includes("BINANCE:")) {
                cryptoCount++
            } else {
                stockCount++
            }
        })

        const totalSelected = stockCount + cryptoCount

        // Define base allocation
        const cashValue = 15 // Keeps 15% cash
        const investableValue = 100 - cashValue

        let stockValue = 0
        let cryptoValue = 0

        if (totalSelected > 0) {
            stockValue = (stockCount / totalSelected) * investableValue
            cryptoValue = (cryptoCount / totalSelected) * investableValue
        } else {
            // If nothing selected, maybe just default allocation?
            stockValue = 65
            cryptoValue = 20
        }

        // Filter out zero values so labels don't look weird if 0
        return [
            { name: "Stocks", value: Math.round(stockValue), color: "#6366f1" }, // Indigo
            { name: "Crypto", value: Math.round(cryptoValue), color: "#8b5cf6" }, // Violet
            { name: "Cash", value: cashValue, color: "#10b981" },   // Emerald
        ].filter(item => item.value > 0)

    }, [user.selectedStocks])

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-sm font-medium">Asset Allocation</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'oklch(var(--card))',
                                    borderColor: 'oklch(var(--border))',
                                    borderRadius: '8px'
                                }}
                                itemStyle={{ color: 'oklch(var(--foreground))' }}
                                formatter={(value: number | undefined) => [`${value}%`, '']}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                        <span className="text-2xl font-bold">100%</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Diversified</span>
                    </div>
                </div>
                <div className="flex justify-center gap-4 mt-4 flex-wrap">
                    {data.map((item) => (
                        <div key={item.name} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-xs font-medium text-muted-foreground">{item.name} ({item.value}%)</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
