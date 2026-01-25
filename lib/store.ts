import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Transaction, Friend, SplitRequest, Bill, Portfolio, SharedGoal, InvestmentEntry } from '@/types';
import { SEED_USER, SEED_FRIENDS, SEED_TRANSACTIONS, SEED_BILLS, SEED_SPLIT_REQUESTS, SEED_PORTFOLIO, SEED_GOAL } from '@/data/seed';
import { calculateRoundup } from './logic';

interface AppState {
    user: User;
    friends: Friend[];
    transactions: Transaction[];
    bills: Bill[];
    splitRequests: SplitRequest[];
    portfolio: Portfolio;
    goals: SharedGoal[];
    investments: InvestmentEntry[];

    // Actions
    setTransactions: (txs: Transaction[]) => void;
    addTransaction: (tx: Transaction) => void;
    createSplitRequest: (req: SplitRequest) => void;
    markSplitPaid: (id: string) => void;
    updateUserParams: (params: Partial<User>) => void;
    performInvestment: (amount: number, type: "roundup" | "paycheck" | "manual", description: string) => void;
    checkAutoSplits: () => void; // dummy for now
    addGoal: (goal: SharedGoal) => void;
    contributeToGoal: (goalId: string, amount: number) => void;
}

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            user: SEED_USER,
            friends: SEED_FRIENDS,
            transactions: SEED_TRANSACTIONS,
            bills: SEED_BILLS,
            splitRequests: SEED_SPLIT_REQUESTS,
            portfolio: SEED_PORTFOLIO,
            goals: [SEED_GOAL],
            investments: [],

            setTransactions: (txs) => set({ transactions: txs }),

            addTransaction: (tx) => {
                set((state) => {
                    // Check for roundups
                    if (state.user.roundupsEnabled) {
                        const roundup = calculateRoundup(tx.amount);
                        if (roundup > 0) {
                            get().performInvestment(roundup, "roundup", `Roundup from ${tx.merchant_name}`);
                        }
                    }
                    return { transactions: [tx, ...state.transactions] };
                });
            },

            createSplitRequest: (req) => set((state) => ({
                splitRequests: [req, ...state.splitRequests]
            })),

            markSplitPaid: (id) => set((state) => ({
                splitRequests: state.splitRequests.map(r =>
                    r.id === id ? { ...r, status: 'paid' } : r
                )
            })),

            updateUserParams: (params) => set((state) => ({
                user: { ...state.user, ...params }
            })),

            performInvestment: (amount, type, description) => set((state) => {
                const newEntry: InvestmentEntry = {
                    id: `inv_${Date.now()}_${Math.random()}`,
                    date: new Date().toISOString(),
                    type,
                    amount,
                    destination: state.user.investDestination,
                    description
                };

                const newBalance = state.portfolio.balance + amount;
                // Simulate chart update
                const newChart = [...state.portfolio.chartPoints, {
                    date: new Date().toISOString().split('T')[0],
                    value: newBalance
                }];

                return {
                    investments: [newEntry, ...state.investments],
                    portfolio: {
                        ...state.portfolio,
                        balance: newBalance,
                        chartPoints: newChart
                    },
                    user: {
                        ...state.user,
                        checkingBalance: state.user.checkingBalance - amount // Deduct from checking
                    }
                };
            }),

            checkAutoSplits: () => { },

            addGoal: (goal) => set((state) => ({
                goals: [...state.goals, goal]
            })),

            contributeToGoal: (goalId, amount) => set((state) => ({
                goals: state.goals.map(g => {
                    if (g.id !== goalId) return g;
                    const newContribution = {
                        date: new Date().toISOString(),
                        memberId: state.user.id,
                        amount: amount
                    };
                    return {
                        ...g,
                        currentAmount: g.currentAmount + amount,
                        contributions: [newContribution, ...g.contributions]
                    };
                }),
                // Optionally deduct from user balance? The user didn't explicitly ask, but it makes sense.
                // I'll stick to just the goal update as requested to keep it simple and safe.
            })),
        }),
        {
            name: 'slice-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
