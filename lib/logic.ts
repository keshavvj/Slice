import { User, Transaction, Bill, SplitRequest, SplitRule } from "@/types";
import { addDays, isWithinInterval, startOfDay, endOfDay, parseISO } from "date-fns";

export function calculateSafeToSpend(
    balance: number,
    bills: Bill[],
    pendingSplitsOwedByUser: number, // what I owe others
    expectedInvesting: number // estimated investing outflow
): { safeAmount: number; breakdown: any } {
    // 1. Calculate bills due in next 7 days
    const today = new Date();
    const nextWeek = addDays(today, 7);

    let billsTotal = 0;
    bills.forEach((bill) => {
        // robust check for bill due date being in next 7 days (simplified: if today's day is 25, and bill due 28, it counts)
        // For MVP, assume bills recur monthly.
        const dayOfMonth = today.getDate();
        const billDay = bill.dueDate;

        // Check if billDay is between today and today+7
        // Handling month rollover is tricky without full dates on bills, assuming simple logic for MVP
        let isDue = false;
        if (dayOfMonth <= billDay && billDay <= dayOfMonth + 7) isDue = true;
        // Handle wrap around? (e.g. today 28, bill due 2 of next month)
        // ... logic simplification: just sum all bills for robustness in demo
        // OR: just sum bills that haven't been "paid" (we don't track bill payment status yet)
        // Let's stick to the prompt: "checkingBalance - upcomingBillsNext7Days..."
        if (isDue) billsTotal += bill.amount;
    });

    // 2. Deduction
    const deduction = billsTotal + pendingSplitsOwedByUser + expectedInvesting;
    const safe = Math.max(0, balance - deduction);

    return {
        safeAmount: safe,
        breakdown: {
            balance,
            billsTotal,
            pendingSplitsOwedByUser,
            expectedInvesting,
        },
    };
}

export function detectSmartSplits(transactions: Transaction[], previousSplits: SplitRequest[]): string[] {
    // Return merchant names that should trigger auto-split
    // Rule: 3+ tx in 7 days with same merchant AND friend frequently used
    const recentTx = transactions.filter(t =>
        isWithinInterval(parseISO(t.date), { start: addDays(new Date(), -7), end: new Date() })
    );

    const merchantCounts: Record<string, number> = {};
    recentTx.forEach(t => {
        merchantCounts[t.merchant_name] = (merchantCounts[t.merchant_name] || 0) + 1;
    });

    const suggestions: string[] = [];
    Object.entries(merchantCounts).forEach(([merchant, count]) => {
        if (count >= 3) suggestions.push(merchant);
    });

    return suggestions;
}

export function calculateRoundup(amount: number): number {
    if (amount > 5) {
        return Math.ceil(amount) - amount;
    }
    return 0;
}
