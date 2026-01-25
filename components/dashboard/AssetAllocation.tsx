"use client"

import * as React from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const data = [
    { name: "Stocks", value: 65, color: "#6366f1" }, // Indigo
    { name: "Crypto", value: 20, color: "#8b5cf6" }, // Violet
    { name: "Cash", value: 15, color: "#10b981" },   // Emerald
]

export function AssetAllocation() {
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
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                        <span className="text-2xl font-bold">100%</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Diversified</span>
                    </div>
                </div>
                <div className="flex justify-center gap-4 mt-4">
                    {data.map((item) => (
                        <div key={item.name} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-xs font-medium text-muted-foreground">{item.name}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
