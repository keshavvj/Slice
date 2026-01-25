import { User, Transaction, Bill, SplitRequest, SplitRule, Friend } from "@/types";
import { addDays, isWithinInterval, startOfDay, endOfDay, parseISO } from "date-fns";

export function calculateSafeToSpend(
    balance: number,
    bills: Bill[],
    pendingSplitsOwedByUser: number, // what I owe others
    expectedInvesting: number, // estimated investing outflow
    safetyBuffer: number = 0 // minimum buffer to keep
): { safeAmount: number; breakdown: any } {
    const today = new Date();

    // 1. Forecast Payday (Simplified: Assume bi-weekly, next one is this Friday or next Friday)
    // For demo robustness: Assume payday is in 7 days.
    const daysToPayday = 7;

    // 2. Identify "Survival Bills" (Due before payday)
    let billsDueTotal = 0;
    bills.forEach((bill) => {
        const dayOfMonth = today.getDate();
        const billDay = bill.dueDate;

        // Simple check: is bill due in next 7 days? via month wrap logic or simple "day > today"
        // MVP: Just check if billDay is within current range
        if (billDay >= dayOfMonth && billDay <= dayOfMonth + daysToPayday) {
            billsDueTotal += bill.amount;
        }
    });

    // 3. Variable Spend Forecasting (Food, Gas, etc.)
    // Estimate daily burn rate. Reduced to $25/day to be more lenient.
    const estimatedDailyBurn = 25;
    const survivalVariableSpend = estimatedDailyBurn * daysToPayday;

    // 4. Deduction
    const totalObligations = billsDueTotal + pendingSplitsOwedByUser + expectedInvesting + survivalVariableSpend;
    const deduction = totalObligations + safetyBuffer;
    const safe = Math.max(0, balance - deduction);

    return {
        safeAmount: safe,
        breakdown: {
            balance,
            billsTotal: billsDueTotal,
            pendingSplitsOwedByUser,
            expectedInvesting,
            variableSpend: survivalVariableSpend, // New metric
            daysToPayday // New metric
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

export function generatePendingSummary(
    requests: SplitRequest[],
    friends: Friend[],
    transactions: Transaction[],
    userId: string
): { summary: string, total: number } {
    const pending = requests.filter(r => r.requesterId === userId && r.status === 'pending');

    const total = pending.reduce((sum, r) => sum + r.amountOwed, 0);

    if (pending.length === 0) {
        return { summary: "All settled up!", total: 0 };
    }

    // 1. Identify Friends
    const friendIds = Array.from(new Set(pending.map(r => r.friendId)));
    const friendNames = friendIds.map(id => friends.find(f => f.id === id)?.name.split(' ')[0] || "Someone"); // Use first names

    let friendsText = "";
    if (friendNames.length === 1) friendsText = friendNames[0];
    else if (friendNames.length === 2) friendsText = `${friendNames[0]} and ${friendNames[1]}`;
    else friendsText = `${friendNames[0]} and ${friendNames.length - 1} others`;

    // 2. Identify Reasons (Merchants)
    const txIds = Array.from(new Set(pending.map(r => r.transactionId)));
    const merchants = txIds.map(id => transactions.find(t => t.id === id)?.merchant_name || "Expenses").filter(m => m !== "Expenses");
    // specific cleanup for "Expenses" fallback distinctness

    let reasonsText = "";
    if (merchants.length === 0) reasonsText = "expenses";
    else if (merchants.length === 1) reasonsText = `"${merchants[0]}"`;
    else if (merchants.length === 2) reasonsText = `"${merchants[0]}" and "${merchants[1]}"`;
    else reasonsText = `"${merchants[0]}" and ${merchants.length - 1} other expenses`;

    return {
        summary: `${friendsText} owe${friendNames.length === 1 ? 's' : ''} you for ${reasonsText}`,
        total
    };
}

export function generateSmartTransaction(): { merchant: string; category: string; amount: number } {
    // Weighted Categories (No time dependency, just general spending patterns)
    // 0.35 Dining, 0.25 Groceries, 0.15 Transport, 0.15 Shopping, 0.1 Entertainment
    const categories = [
        { cat: "Dining", weight: 0.35, merchants: ["Starbucks", "Dunkin'", "Chipotle", "Sweetgreen", "Shake Shack", "Local Thai", "Pizza Place", "Sushi Spot", "McDonald's", "Local Cafe"], min: 5, max: 45 },
        { cat: "Groceries", weight: 0.25, merchants: ["Whole Foods", "Trader Joe's", "Kroger", "Wegmans", "Safeway", "Target Grocery", "Local Market"], min: 25, max: 180 },
        { cat: "Transport", weight: 0.15, merchants: ["Uber", "Lyft", "Shell", "BP Station", "Subway", "Train Ticket", "City Parking"], min: 3, max: 45 },
        { cat: "Shopping", weight: 0.15, merchants: ["Amazon", "Target", "CVS", "Walgreens", "Apple", "Uniqlo", "Nike"], min: 15, max: 120 },
        { cat: "Entertainment", weight: 0.1, merchants: ["Netflix", "Spotify", "Cinema", "Steam", "PlayStation", "Kindle", "Event Ticket"], min: 10, max: 60 }
    ];

    // Probabilistic Selection
    const totalWeight = categories.reduce((sum, c) => sum + c.weight, 0);
    const random = Math.random() * totalWeight;
    let accumulatedWeight = 0;
    let selectedCat = categories[0];

    for (const cat of categories) {
        accumulatedWeight += cat.weight;
        if (random <= accumulatedWeight) {
            selectedCat = cat;
            break;
        }
    }

    const merchant = selectedCat.merchants[Math.floor(Math.random() * selectedCat.merchants.length)];
    // Add some "cents" randomness to make it look real (e.g. .99, .45, .23)
    const baseAmount = Math.random() * (selectedCat.max - selectedCat.min) + selectedCat.min;
    const amount = Number(baseAmount.toFixed(2));

    return { merchant, category: selectedCat.cat, amount };
}
