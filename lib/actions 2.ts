"use server"

import { signIn, signOut } from "@/lib/auth"
import { fetchQuote, FinnhubQuote } from "@/lib/finnhub"

export async function getStockQuote(symbol: string): Promise<FinnhubQuote | null> {
    return await fetchQuote(symbol);
}

export async function handleSignIn() {
    await signIn("google", { redirectTo: "/dashboard" })
}

export async function handleSignOut() {
    await signOut({ redirectTo: "/" })
}
