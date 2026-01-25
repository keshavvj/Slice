
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useStore } from "@/lib/store"
import { Plus, Check, Search, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Curated list of popular stocks/crypto supported by Finnhub Free Tier
const AVAILABLE_ASSETS = [
    { symbol: "AAPL", name: "Apple Inc.", type: "Stock" },
    { symbol: "MSFT", name: "Microsoft Corp.", type: "Stock" },
    { symbol: "GOOGL", name: "Alphabet Inc.", type: "Stock" },
    { symbol: "AMZN", name: "Amazon.com Inc.", type: "Stock" },
    { symbol: "TSLA", name: "Tesla Inc.", type: "Stock" },
    { symbol: "NVDA", name: "NVIDIA Corp.", type: "Stock" },
    { symbol: "META", name: "Meta Platforms", type: "Stock" },
    { symbol: "NFLX", name: "Netflix Inc.", type: "Stock" },
    { symbol: "SPY", name: "SPDR S&P 500 ETF", type: "ETF" },
    { symbol: "QQQ", name: "Invesco QQQ Trust", type: "ETF" },
    { symbol: "BINANCE:BTCUSDT", name: "Bitcoin", type: "Crypto" },
    { symbol: "BINANCE:ETHUSDT", name: "Ethereum", type: "Crypto" },
    { symbol: "BINANCE:SOLUSDT", name: "Solana", type: "Crypto" },
]

export function StockSelector() {
    const { user, toggleStock } = useStore()
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")

    const filteredAssets = AVAILABLE_ASSETS.filter(asset =>
        asset.name.toLowerCase().includes(search.toLowerCase()) ||
        asset.symbol.toLowerCase().includes(search.toLowerCase())
    )

    const selectedStocks = user.selectedStocks || []

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Manage</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Manage Auto-Invest Allocation</DialogTitle>
                    <DialogDescription>
                        Select the assets you want to automatically invest in with every paycheck.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-2">
                    <div className="relative mb-4">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search stocks, ETFs, crypto..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-2">
                            {filteredAssets.map((asset) => {
                                const isSelected = selectedStocks.includes(asset.symbol)
                                return (
                                    <div
                                        key={asset.symbol}
                                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${isSelected
                                            ? "bg-primary/5 border-primary/50"
                                            : "hover:bg-muted/50"
                                            }`}
                                        onClick={() => toggleStock(asset.symbol)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                                                <TrendingUp className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-sm">
                                                    {asset.symbol.replace('BINANCE:', '')}
                                                </div>
                                                <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                                                    {asset.name}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="text-[10px] h-5 font-normal">
                                                {asset.type}
                                            </Badge>
                                            <div className={`h-5 w-5 rounded-full flex items-center justify-center border ${isSelected
                                                ? "bg-primary border-primary text-primary-foreground"
                                                : "border-muted-foreground/30"
                                                }`}>
                                                {isSelected && <Check className="h-3 w-3" />}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            {filteredAssets.length === 0 && (
                                <div className="text-center text-sm text-muted-foreground py-8">
                                    No assets found matching "{search}"
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    )
}
