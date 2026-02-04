import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Transaction, Friend, SplitRequest, Bill, Portfolio, SharedGoal, InvestmentEntry, AppState } from '@/types';
import { SEED_USER, SEED_FRIENDS, SEED_TRANSACTIONS, SEED_BILLS, SEED_SPLIT_REQUESTS, SEED_PORTFOLIO, SEED_GOAL } from '@/data/seed';
import { calculateRoundup } from './logic';
import { computeNextRunDate } from './goals';
import { isAfter, parseISO } from 'date-fns';

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

            // Plaid / Banking
            bankConnected: false,
            lastFetchedAt: null,

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

            fetchSplits: async () => {
                try {
                    const res = await fetch('/api/splits');
                    if (res.ok) {
                        const data = await res.json();
                        // API returns { sent: [], received: [] }
                        // Store expects flat list of SplitRequest
                        const sent = data.sent.map((s: any) => ({
                            id: s.id,
                            transactionId: 'manual', // DB doesn't link to TX yet directly in MVP, or s.txId
                            requesterId: s.fromUserId,
                            friendId: s.toUserId,
                            totalAmount: s.amount, // Approximate
                            amountOwed: s.amount,
                            status: s.status,
                            createdAt: s.createdAt
                        }));
                        const received = data.received.map((s: any) => ({
                            id: s.id,
                            transactionId: 'manual',
                            requesterId: s.fromUserId,
                            friendId: s.toUserId,
                            totalAmount: s.amount,
                            amountOwed: s.amount,
                            status: s.status,
                            createdAt: s.createdAt
                        }));
                        set({ splitRequests: [...sent, ...received] });
                    }
                } catch (e) {
                    console.error("Failed to fetch splits", e);
                }
            },

            createSplitRequest: async (req) => {
                try {
                    const res = await fetch('/api/splits', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            splits: [{
                                friendId: req.friendId,
                                amount: req.amountOwed,
                                description: 'Split Request',
                                payerId: req.requesterId
                            }]
                        })
                    });

                    if (res.ok) {
                        get().fetchSplits();
                    }
                } catch (e) {
                    console.error("Failed to create split", e);
                }
            },

            markSplitPaid: async (id) => {
                try {
                    const res = await fetch(`/api/splits/${id}/settle`, {
                        method: 'POST'
                    });
                    if (res.ok) {
                        get().fetchSplits();
                    }
                } catch (e) {
                    console.error("Failed to settle split", e);
                }
            },

            updateUserParams: (params) => set((state) => ({
                user: { ...state.user, ...params }
            })),

            fetchIdentity: async () => {
                try {
                    const res = await fetch('/api/me');
                    if (res.ok) {
                        const data = await res.json();
                        set((state) => ({
                            user: { ...state.user, ...data }
                        }));
                        console.log("Identity fetched:", data);
                    }
                } catch (e) {
                    console.error("Failed to fetch identity", e);
                }
            },

            toggleStock: (symbol) => set((state) => {
                const current = state.user.selectedStocks || [];
                const exists = current.includes(symbol);
                return {
                    user: {
                        ...state.user,
                        selectedStocks: exists
                            ? current.filter(s => s !== symbol)
                            : [...current, symbol]
                    }
                };
            }),

            performInvestment: async (amount, type, description) => {
                const state = get();
                // Removed Nessie investment sync

                set((state) => {
                    const newEntry: InvestmentEntry = {
                        id: `inv_${Date.now()}_${Math.random()}`,
                        date: new Date().toISOString(),
                        type,
                        amount,
                        destination: state.user.investDestination,
                        description
                    };

                    const newBalance = state.portfolio.balance + amount;
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
                            checkingBalance: state.user.checkingBalance - amount
                        }
                    };
                });
            },

            checkAutoSplits: () => { },

            updateGoalRecurring: (goalId, recurring) => set((state) => ({
                goals: state.goals.map(g => g.id === goalId ? { ...g, recurring } : g)
            })),

            checkRecurringGoals: () => {
                const state = get();
                const now = new Date();
                let hasUpdates = false;

                const updatedGoals = state.goals.map(goal => {
                    if (!goal.recurring || !goal.recurring.enabled) return goal;

                    const nextRun = parseISO(goal.recurring.nextRunDateISO);
                    // Check if due (and not already run today - primitive check, ideally strict simpler logic)
                    if (isAfter(now, nextRun) || now.toISOString().split('T')[0] === goal.recurring.nextRunDateISO.split('T')[0]) {
                        // Prevent multi-run on same day if logic is loose
                        if (goal.recurring.lastRunAtISO && goal.recurring.lastRunAtISO.split('T')[0] === now.toISOString().split('T')[0]) {
                            return goal;
                        }

                        hasUpdates = true;

                        // Create contribution
                        const newContribution = {
                            id: `contrib_rec_${Date.now()}`,
                            date: now.toISOString(),
                            memberId: goal.recurring.scope === 'me' ? state.user.id : 'ALL', // Special handling needed for "ALL"
                            amount: goal.recurring.amount,
                            type: 'recurring' as const
                        };

                        // If scope is everyone, we might want separate entries for each member?
                        // For MVP: let's assume "Everyone" means "Everyone contributes this amount"
                        // But simpler MVP: Just charge the user if 'me'. 
                        // If 'everyone', we need to loop.
                        const contributionsToAdd: any[] = [];
                        let totalAdded = 0;

                        if (goal.recurring.scope === 'everyone') {
                            goal.members.forEach(m => {
                                contributionsToAdd.push({
                                    id: `contrib_rec_${Date.now()}_${m.id}`,
                                    date: now.toISOString(),
                                    memberId: m.id,
                                    amount: goal.recurring!.amount,
                                    type: 'recurring'
                                });
                                totalAdded += goal.recurring!.amount;
                            });
                            // Don't forget current user
                            contributionsToAdd.push({
                                id: `contrib_rec_${Date.now()}_me`,
                                date: now.toISOString(),
                                memberId: state.user.id,
                                amount: goal.recurring.amount,
                                type: 'recurring'
                            });
                            totalAdded += goal.recurring.amount;

                        } else {
                            contributionsToAdd.push({ ...newContribution, memberId: state.user.id });
                            totalAdded += goal.recurring.amount;
                        }

                        // Calculate NEXT run date
                        const nextDate = computeNextRunDate(goal.recurring.frequency, now);

                        return {
                            ...goal,
                            currentAmount: goal.currentAmount + totalAdded,
                            contributions: [...contributionsToAdd, ...goal.contributions],
                            recurring: {
                                ...goal.recurring,
                                lastRunAtISO: now.toISOString(),
                                nextRunDateISO: nextDate.toISOString()
                            }
                        };
                    }
                    return goal;
                });

                if (hasUpdates) {
                    set({ goals: updatedGoals });
                }
            },

            fetchGoals: async () => {
                try {
                    const res = await fetch('/api/goals');
                    if (res.ok) {
                        const data = await res.json();
                        // Map API response to SharedGoal type if needed, or use as is if compatible
                        // Current SharedGoal type has detailed structure. API returns Prisma Goal with relations.
                        // We need to map it.
                        const mappedGoals: SharedGoal[] = data.goals.map((g: any) => ({
                            id: g.id,
                            name: g.title,
                            targetAmount: g.targetAmount,
                            currentAmount: g.currentAmount,
                            weeklyContribution: 0, // Not in DB yet, inferred or calculated?
                            members: g.members.map((m: any) => ({
                                id: m.user.id,
                                name: m.user.displayName || m.user.handle,
                                avatarInitials: (m.user.displayName || m.user.handle || 'U')[0].toUpperCase(),
                                role: m.role
                            })),
                            contributions: g.contributions.map((c: any) => ({
                                id: c.id,
                                date: c.createdAt,
                                memberId: c.userId,
                                amount: c.amount,
                                type: c.type
                            })),
                            recurring: g.recurringEnabled ? {
                                enabled: true,
                                frequency: g.recurringFrequency as any,
                                amount: g.recurringAmount || 0,
                                scope: 'me', // Defaulting for now
                                startDateISO: g.createdAt,
                                nextRunDateISO: g.recurringNextRun || g.createdAt
                            } : undefined
                        }));
                        set({ goals: mappedGoals });
                    }
                } catch (e) {
                    console.error("Failed to fetch goals", e);
                }
            },

            addGoal: async (goal) => {
                try {
                    const res = await fetch('/api/goals', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: goal.name,
                            targetAmount: goal.targetAmount,
                            category: "General",
                            members: goal.members.map(m => m.id)
                        })
                    });

                    if (res.ok) {
                        get().fetchGoals(); // Refresh list
                    }
                } catch (e) {
                    console.error("Failed to create goal", e);
                }
            },

            contributeToGoal: async (goalId, amount) => { // Removed memberId
                try {
                    // API Call
                    const res = await fetch(`/api/goals/${goalId}/contribute`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ amount, type: 'manual' })
                    });

                    if (res.ok) {
                        // Optimistic or Refresh
                        get().fetchGoals();

                        // Deduct from balance locally or refetch identity/transactions
                        // For now, let's just create a local tx for feedback
                        const state = get();
                        const newTx: Transaction = {
                            id: `tx_goal_${Date.now()}`,
                            date: new Date().toISOString(),
                            merchant_name: "Goal Contribution",
                            category: "Savings",
                            amount: amount,
                            status: "posted",
                            accountId: state.selectedAccountId || "demo_account"
                        };
                        state.addTransaction(newTx);
                    }
                } catch (e) {
                    console.error("Goal Contribution API call failed", e);
                }
            },

            addFriend: (friend) => set((state) => ({
                friends: [...state.friends, friend]
            })),

            removeFriend: (id) => set((state) => ({
                friends: state.friends.filter(f => f.id !== id)
            })),

            fetchBankingData: async () => {
                const state = get();
                // Avoid too frequent fetching if synced recently (e.g. 1 min)
                if (state.lastFetchedAt && (Date.now() - new Date(state.lastFetchedAt).getTime() < 60000)) {
                    // return; 
                }

                try {
                    // 1. Fetch Summary (Balance & Connection Status)
                    const summaryRes = await fetch('/api/banking/summary');
                    if (summaryRes.ok) {
                        const data = await summaryRes.json();
                        set(s => ({
                            bankConnected: data.connections.length > 0,
                            user: {
                                ...s.user,
                                checkingBalance: data.totalBalance || s.user.checkingBalance
                            }
                        }));
                    }

                    // 2. Fetch Transactions
                    await get().fetchTransactions();

                    set({ lastFetchedAt: new Date().toISOString() });

                } catch (e) {
                    console.error("Failed to fetch banking data", e);
                }
            },

            fetchTransactions: async () => {
                try {
                    const res = await fetch('/api/transactions');
                    if (res.ok) {
                        const data = await res.json();
                        // Map API txs to store Transaction type
                        // API returns: id, plaidTransactionId, name, merchantName, amount, date, category, pending, accountName
                        const apiTxs = data.transactions || [];
                        const mappedTxs: Transaction[] = apiTxs.map((t: any) => ({
                            id: t.id,
                            date: t.date, // ISO string
                            merchant_name: t.merchantName || t.name,
                            amount: t.amount,
                            category: t.category || 'Uncategorized',
                            status: t.pending ? 'pending' : 'posted',
                            accountId: t.accountName || 'plaid_account'
                        }));

                        set({ transactions: mappedTxs });
                    }
                } catch (e) {
                    console.error("Failed to fetch transactions", e);
                }
            },

            // Removed simulateNessieTransaction
            simulateNessieTransaction: async (merchant, amount) => {
                // No-op or purely local for now if called
            },


            simulatePaycheck: async (overrideAmount) => {
                const state = get();
                const paycheckAmount = overrideAmount !== undefined ? overrideAmount : (state.user.paycheckAmount || 2000);

                // 2. Logic: Calculate Auto-Invest
                let investAmount = 0;
                if (state.user.investFixedOverride && state.user.investFixedOverride > 0) {
                    investAmount = state.user.investFixedOverride;
                } else if (state.user.investPercent > 0) {
                    investAmount = (paycheckAmount * state.user.investPercent) / 100;
                }

                // 3. Local State Update (Income Transaction)
                const incomeTx: Transaction = {
                    id: `pay_${Date.now()}`,
                    date: new Date().toISOString(),
                    merchant_name: "Work Gusto",
                    category: "Income",
                    amount: paycheckAmount, // Income defined as positive amount but might need negative for "spending" logic? 
                    // Usually income adds to balance. Logic below adds it.
                    status: "posted",
                    isPaycheck: true,
                    accountId: "manual_account"
                };

                set(s => ({
                    transactions: [incomeTx, ...s.transactions],
                    user: {
                        ...s.user,
                        checkingBalance: s.user.checkingBalance + paycheckAmount
                    }
                }));

                // 4. Perform Investment (Deduct form checking, Add to Portfolio)
                if (investAmount > 0) {
                    // small delay to ensure ordering
                    setTimeout(() => {
                        get().performInvestment(investAmount, "paycheck", `Auto-Invest ${state.user.investPercent}% of Paycheck`);
                    }, 500);
                }
            },

            settleSplit: async (friendId: string, amount: number) => {
                const state = get();
                const friend = state.friends.find(f => f.id === friendId);
                const roundedAmount = Number(amount.toFixed(2));

                console.log(`[Store] Attempting Settle: Friend=${friend?.name || 'Unknown'}, Amount=${roundedAmount}`);

                // 2. Mark pending splits as paid via API
                const pendingOwing = state.splitRequests.filter(
                    req => req.requesterId === friendId && req.status === 'pending'
                );

                for (const req of pendingOwing) {
                    await get().markSplitPaid(req.id);
                }

                get().fetchSplits();

                // 3. Create Local Transaction Record
                const newTx: Transaction = {
                    id: `tx_settle_${Date.now()}`,
                    date: new Date().toISOString(),
                    merchant_name: `Paid ${friend?.name || 'Friend'}`,
                    category: 'Transfer',
                    amount: roundedAmount,
                    status: "posted",
                    accountId: "manual_account"
                };

                set((state) => ({
                    user: {
                        ...state.user,
                        checkingBalance: state.user.checkingBalance - roundedAmount
                    },
                    transactions: [newTx, ...state.transactions]
                }));
            },

            sendMoney: async (friendId: string, amount: number, note: string) => {
                const state = get();
                const friend = state.friends.find(f => f.id === friendId);
                const roundedAmount = Number(amount.toFixed(2));

                // 2. Local Update (Optimistic Transaction)
                const newTx: Transaction = {
                    id: `tx_sent_${Date.now()}`,
                    date: new Date().toISOString(),
                    merchant_name: `Sent to ${friend?.name || 'Friend'}`,
                    category: 'Transfer',
                    amount: roundedAmount,
                    status: "posted",
                    accountId: "manual_account"
                };

                set((state) => ({
                    user: {
                        ...state.user,
                        checkingBalance: state.user.checkingBalance - roundedAmount
                    },
                    transactions: [newTx, ...state.transactions]
                }));
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
