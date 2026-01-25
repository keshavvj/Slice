
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getStockQuote } from "@/lib/actions"
import { FinnhubQuote } from "@/lib/finnhub"
import { ArrowUp, ArrowDown, Activity, Loader2 } from "lucide-react"
import { useStore } from "@/lib/store"
import { StockSelector } from "./StockSelector"

interface MarketTickerItem {
    symbol: string
    name: string
    quote: FinnhubQuote | null
}

// Map known symbols to names for display (fallback)
const SYMBOL_NAMES: Record<string, string> = {
    "AAPL": "Apple",
    "MSFT": "Microsoft",
    "SPY": "S&P 500",
    "BINANCE:BTCUSDT": "Bitcoin",
    "GOOGL": "Alphabet",
    "AMZN": "Amazon",
    "TSLA": "Tesla",
    "NVDA": "NVIDIA",
    "META": "Meta",
    "NFLX": "Netflix",
    "QQQ": "Invesco QQQ",
    "BINANCE:ETHUSDT": "Ethereum",
    "BINANCE:SOLUSDT": "Solana"
}

export function MarketTicker() {
    const { user } = useStore()
    const [data, setData] = useState<MarketTickerItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            const symbolsToFetch = user.selectedStocks || ["AAPL", "MSFT", "SPY", "BINANCE:BTCUSDT"]

            const results = await Promise.all(
                symbolsToFetch.map(async (symbol) => {
                    const quote = await getStockQuote(symbol)
                    return {
                        symbol,
                        name: SYMBOL_NAMES[symbol] || symbol,
                        quote
                    }
                })
            )
            setData(results)
            setLoading(false)
        }

        fetchData()
        // Optional: Set up an interval to refresh data every minute
        const interval = setInterval(fetchData, 60000)
        return () => clearInterval(interval)
    }, [user.selectedStocks])

    // Loading state is only initial, we want to perform updates cleanly
    // For smoother UX, maybe show skeleton or existing data while refetching? 
    // For now, let's just show loading on initial mount or full change.

    return (
        <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-lg font-semibold tracking-tight">Market Watch</h2>
                </div>
                <StockSelector />
            </div>

            {loading && data.length === 0 ? (
                <Card className="w-full">
                    <CardContent>
                        <div className="flex items-center justify-center py-8 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading market data...
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {data.map((item) => {
                        const quote = item.quote || { c: 0, d: 0, dp: 0, h: 0, l: 0, o: 0, pc: 0, t: 0 };
                        const isPositive = quote.dp >= 0
                        const isAvailable = !!item.quote

                        return (
                            <Card
                                key={item.symbol}
                                className="hover:shadow-md transition-all hover:border-primary/50"
                            >
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-bold text-sm text-muted-foreground">{item.symbol.replace('BINANCE:', '')}</div>
                                            <div className="font-semibold text-lg">
                                                {isAvailable ? `$${quote.c.toFixed(2)}` : "N/A"}
                                            </div>
                                        </div>
                                        {isAvailable && (
                                            <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                {isPositive ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                                                {Math.abs(quote.dp).toFixed(2)}%
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">{item.name}</div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            <div className="flex justify-end pr-2">
                <a href="https://finnhub.io" target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                    Powered by Finnhub
                </a>
            </div>
        </div>
    )
}
