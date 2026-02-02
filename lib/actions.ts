"use server"

import { fetchQuote, FinnhubQuote } from "@/lib/finnhub"

export async function getStockQuote(symbol: string): Promise<FinnhubQuote | null> {
    return await fetchQuote(symbol);
}
