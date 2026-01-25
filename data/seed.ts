import { User, Transaction, Friend, SplitRequest, Bill, Portfolio, SharedGoal } from "@/types";

export const SEED_USER: User = {
    id: "u_123",
    name: "Jordan Lee",
    email: "jordan@slice.app",
    checkingBalance: 2450.75,
    safetyThreshold: 500,
    paycheckSchedule: "biweekly",
    paycheckAmount: 2000,
    investPercent: 10,
    investDestination: "portfolio",
    roundupsEnabled: true,
    selectedStocks: ["AAPL", "MSFT", "SPY", "BINANCE:BTCUSDT"]
};

export const SEED_FRIENDS: Friend[] = [
    { id: "f_1", name: "Alex Chen", avatarInitials: "AC" },
    { id: "f_2", name: "Maya Patel", avatarInitials: "MP" },
    { id: "f_3", name: "Sam Rivera", avatarInitials: "SR" },
];

export const SEED_TRANSACTIONS: Transaction[] = [
    { id: "tx_100", date: new Date().toISOString(), merchant_name: "Uber", category: "Transport", amount: 24.50, status: "posted", accountId: "acc_1" },
    { id: "tx_99", date: new Date(Date.now() - 86400000).toISOString(), merchant_name: "Chipotle", category: "Food", amount: 14.20, status: "posted", accountId: "acc_1" },
    { id: "tx_98", date: new Date(Date.now() - 86400000 * 2).toISOString(), merchant_name: "Starbucks", category: "Food", amount: 6.75, status: "posted", accountId: "acc_1" },
    { id: "tx_97", date: new Date(Date.now() - 86400000 * 5).toISOString(), merchant_name: "Spotify", category: "Bills", amount: 11.99, status: "posted", accountId: "acc_1" },
    { id: "tx_96", date: new Date(Date.now() - 86400000 * 7).toISOString(), merchant_name: "Work Gusto", category: "Income", amount: 2000, status: "posted", isPaycheck: true, accountId: "acc_1" },
    { id: "tx_95", date: new Date(Date.now() - 86400000 * 8).toISOString(), merchant_name: "Uber", category: "Transport", amount: 18.00, status: "posted", accountId: "acc_1" },
    { id: "tx_94", date: new Date(Date.now() - 86400000 * 9).toISOString(), merchant_name: "Uber", category: "Transport", amount: 22.00, status: "posted", accountId: "acc_1" },
];

export const SEED_BILLS: Bill[] = [
    { id: "b_1", name: "Rent", dueDate: 1, amount: 1200 },
    { id: "b_2", name: "Spotify", dueDate: 15, amount: 11.99 },
    { id: "b_3", name: "Internet", dueDate: 20, amount: 65 },
];

export const SEED_SPLIT_REQUESTS: SplitRequest[] = [
    { id: "sr_1", transactionId: "tx_95", requesterId: "u_123", friendId: "f_1", totalAmount: 18.00, amountOwed: 9.00, status: "paid", createdAt: new Date(Date.now() - 86400000 * 8).toISOString() },
    { id: "sr_2", transactionId: "tx_100", requesterId: "u_123", friendId: "f_1", totalAmount: 24.50, amountOwed: 12.25, status: "pending", createdAt: new Date().toISOString() },
    { id: "sr_3", transactionId: "tx_external_1", requesterId: "f_1", friendId: "u_123", totalAmount: 30.00, amountOwed: 15.00, status: "pending", createdAt: new Date(Date.now() - 43200000).toISOString() },
    { id: "sr_4", transactionId: "tx_external_2", requesterId: "f_2", friendId: "u_123", totalAmount: 60.00, amountOwed: 30.00, status: "pending", createdAt: new Date(Date.now() - 21600000).toISOString() },
];

export const SEED_PORTFOLIO: Portfolio = {
    balance: 1450.20,
    weeklyChangePercent: 3.4,
    chartPoints: [
        { date: "Mon", value: 1400 },
        { date: "Tue", value: 1410 },
        { date: "Wed", value: 1405 },
        { date: "Thu", value: 1425 },
        { date: "Fri", value: 1440 },
        { date: "Sat", value: 1450.20 },
        { date: "Sun", value: 1450.20 },
    ],
};

export const SEED_GOAL: SharedGoal = {
    id: "g_1",
    name: "Cabo Trip",
    targetAmount: 2000,
    currentAmount: 650,
    weeklyContribution: 50,
    members: SEED_FRIENDS,
    contributions: [
        { date: "2023-10-01", memberId: "u_123", amount: 50 },
        { date: "2023-10-01", memberId: "f_1", amount: 50 },
    ],
};
