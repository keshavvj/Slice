import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Transaction, Friend, SplitRequest, Bill, Portfolio, SharedGoal, InvestmentEntry, AppState } from '@/types';
import { SEED_USER, SEED_FRIENDS, SEED_TRANSACTIONS, SEED_BILLS, SEED_SPLIT_REQUESTS, SEED_PORTFOLIO, SEED_GOAL } from '@/data/seed';
import { calculateRoundup } from './logic';
import { nessieClient } from './nessie';

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
            splitRules: [],
            upcomingBills: [],

            nessieConnected: false,
            lastFetchedAt: null,
            selectedCustomerId: null,
            selectedAccountId: null,
            lastFetchSamples: {},

            setTransactions: (txs) => set({ transactions: txs }),

            addTransaction: (tx) => {
                const state = get();
                const roundup = state.user.roundupsEnabled ? calculateRoundup(tx.amount) : 0;

                // 1. Process Transaction (deduct amount)
                set((s) => ({
                    transactions: [tx, ...s.transactions],
                    user: {
                        ...s.user,
                        checkingBalance: s.user.checkingBalance - tx.amount
                    }
                }));

                // 2. Process Roundup (if any) - separate update to ensure state consistency
                if (roundup > 0) {
                    get().performInvestment(roundup, "roundup", `Roundup from ${tx.merchant_name}`);
                }
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

            contributeToGoal: (goalId, amount) => {
                const state = get();
                // 1. Create Transaction
                const newTx: Transaction = {
                    id: `tx_goal_${Date.now()}`,
                    date: new Date().toISOString(),
                    merchant_name: "Goal Contribution",
                    category: "Savings",
                    amount: amount,
                    status: "posted",
                    accountId: state.selectedAccountId || "demo_account"
                };

                set((state) => ({
                    // 2. Deduct Balance & Add Transaction
                    user: {
                        ...state.user,
                        checkingBalance: state.user.checkingBalance - amount
                    },
                    transactions: [newTx, ...state.transactions],
                    // 3. Update Goal
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
                }));
            },

            addFriend: (friend) => set((state) => ({
                friends: [...state.friends, friend]
            })),

            removeFriend: (id) => set((state) => ({
                friends: state.friends.filter(f => f.id !== id)
            })),

            syncNessieData: async (force = false) => {
                const state = get();
                // Cache check: if not forced and we have recent data (e.g. < 10 mins) and txs are not empty
                if (!force && state.nessieConnected && state.lastFetchedAt) {
                    const tenMinsAgo = Date.now() - 10 * 60 * 1000;
                    if (new Date(state.lastFetchedAt).getTime() > tenMinsAgo && state.transactions.length > 0) {
                        return;
                    }
                }

                try {
                    // 1. Fetch Customers
                    const custRes = await nessieClient.getCustomers(true); // debug=true to get samples
                    const customers = custRes.data || (Array.isArray(custRes) ? custRes : []);
                    const debugSamples: any = { customers: custRes.sample || customers.slice(0, 2) };

                    if (customers.length === 0) {
                        set({ nessieConnected: true, lastFetchedAt: new Date().toISOString(), lastFetchSamples: debugSamples });
                        return;
                    }

                    const customer = customers[0]; // Pick first

                    // 2. Fetch Accounts
                    const accRes = await nessieClient.getAccounts(customer._id, true);
                    const accounts = accRes.data || (Array.isArray(accRes) ? accRes : []);
                    debugSamples.accounts = accRes.sample || accounts.slice(0, 2);

                    if (accounts.length === 0) {
                        set({
                            nessieConnected: true,
                            selectedCustomerId: customer._id,
                            lastFetchedAt: new Date().toISOString(),
                            lastFetchSamples: debugSamples
                        });
                        return;
                    }

                    // Pick first "checking" or fallback
                    const checkingAccount = accounts.find((a: any) => a.type?.toLowerCase().includes('checking')) || accounts[0];

                    // 3. Fetch Activity (Purchases, Transfers, Deposits)
                    const [purchasesRes, transfersRes, depositsRes, billsRes] = await Promise.all([
                        nessieClient.getPurchases(checkingAccount._id, true).catch(() => ({ data: [], sample: [] })),
                        nessieClient.getTransfers(checkingAccount._id, true).catch(() => ({ data: [], sample: [] })),
                        nessieClient.getDeposits(checkingAccount._id, true).catch(() => ({ data: [], sample: [] })),
                        nessieClient.getBills(checkingAccount._id, true).catch(() => ({ data: [], sample: [] }))
                    ]);

                    debugSamples.purchases = purchasesRes.sample;
                    debugSamples.transfers = transfersRes.sample;
                    debugSamples.deposits = depositsRes.sample;
                    debugSamples.bills = billsRes.sample;

                    // Normalize & Merge
                    const allActivity = [
                        ...(purchasesRes.data || []),
                        ...(transfersRes.data || []),
                        ...(depositsRes.data || [])
                    ];

                    const mappedTransactions: Transaction[] = allActivity.map((p: any) => ({
                        id: p._id || p.id,
                        date: p.purchase_date || p.transaction_date || p.date || new Date().toISOString().split('T')[0],
                        merchant_name: p.merchant_id ? `Merchant ${p.merchant_id.substring(0, 6)}` : (p.description || "Unknown Activity"),
                        amount: p.amount,
                        category: p.type || 'transaction',
                        status: 'posted' as const,
                        accountId: checkingAccount._id
                    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                    const mappedBills: Bill[] = (billsRes.data || []).map((b: any) => ({
                        id: b._id,
                        name: b.nickname || b.payee,
                        amount: b.payment_amount,
                        dueDate: typeof b.recurring_date === 'number' ? b.recurring_date : 1
                    }));

                    set((state) => ({
                        nessieConnected: true,
                        selectedCustomerId: customer._id,
                        selectedAccountId: checkingAccount._id,
                        lastFetchedAt: new Date().toISOString(),
                        lastFetchSamples: debugSamples,
                        transactions: mappedTransactions,
                        bills: mappedBills, // Strict: only use Nessie bills if connected
                        user: {
                            ...state.user,
                            checkingBalance: checkingAccount.balance,
                            name: `${customer.first_name} ${customer.last_name}`
                        }
                    }));

                } catch (error) {
                    console.error("Nessie Sync Failed:", error);
                    set({ nessieConnected: false });
                }
            },

            simulateNessieTransaction: (merchant, amount) => {
                const newTx: Transaction = {
                    id: `sim_${Date.now()}`,
                    date: new Date().toISOString().split('T')[0],
                    merchant_name: merchant,
                    amount: amount,
                    category: 'Shopping',
                    status: 'posted',
                    accountId: get().selectedAccountId || 'demo_account'
                };
                get().addTransaction(newTx);
            },

            resetAll: () => {
                localStorage.clear();
                window.location.reload();
            }
        }),
        {
            name: 'slice-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
