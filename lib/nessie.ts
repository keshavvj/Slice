import { Transaction } from "@/types";
import { SEED_TRANSACTIONS } from "@/data/seed";

const API_KEY = process.env.NEXT_PUBLIC_NESSIE_API_KEY;
const BASE_URL = "http://api.nessieisreal.com";

export async function getNessieCustomer(customerId: string) {
    if (!API_KEY) return null;
    try {
        const res = await fetch(`${BASE_URL}/customers/${customerId}?key=${API_KEY}`);
        if (!res.ok) throw new Error("Failed to fetch customer");
        return await res.json();
    } catch (error) {
        console.error("Nessie API Error:", error);
        return null;
    }
}

export async function getNessieAccounts(customerId: string) {
    if (!API_KEY) return null;
    try {
        const res = await fetch(`${BASE_URL}/customers/${customerId}/accounts?key=${API_KEY}`);
        if (!res.ok) throw new Error("Failed to fetch accounts");
        return await res.json();
    } catch (error) {
        console.error("Nessie API Error:", error);
        return null;
    }
}

export async function getNessieTransactions(accountId: string): Promise<Transaction[] | null> {
    if (!API_KEY) return null;
    try {
        const res = await fetch(`${BASE_URL}/accounts/${accountId}/transactions?key=${API_KEY}`);
        if (!res.ok) throw new Error("Failed to fetch transactions");
        const data = await res.json();

        // Map Nessie tx format to our internal format
        return data.map((tx: any) => ({
            id: tx._id,
            date: tx.purchase_date || new Date().toISOString().split("T")[0],
            merchant_name: tx.merchant_id || "Unknown Merchant", // Real Nessie might need a merchant fetch, simplification for MVP
            category: tx.category || "General", // Nessie might not provide category on tx directly without merchant lookup
            amount: tx.amount,
            status: "posted",
            accountId: tx.account_id,
            // Heuristics for paycheck?
            isPaycheck: tx.type === "deposit",
        }));
    } catch (error) {
        console.error("Nessie API Error:", error);
        return null;
    }
}

export async function getTransactionsWithFallback(accountId: string): Promise<Transaction[]> {
    const realData = await getNessieTransactions(accountId);
    if (realData && realData.length > 0) return realData;
    return SEED_TRANSACTIONS;
}
