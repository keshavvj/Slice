import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Transaction, Friend, SplitRequest, Bill, Portfolio, SharedGoal, InvestmentEntry, AppState } from '@/types';
import { SEED_USER, SEED_FRIENDS, SEED_TRANSACTIONS, SEED_BILLS, SEED_SPLIT_REQUESTS, SEED_PORTFOLIO, SEED_GOAL } from '@/data/seed';
import { calculateRoundup } from './logic';
import { nessieClient } from './nessie';
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
                // If connected, sync with API
                if (state.nessieConnected && state.selectedAccountId) {
                    try {
                        await nessieClient.createPurchase(state.selectedAccountId, {
                            merchant_id: "57cf75ce2e25f755279b6343", // Generic "Investment" merchant or similar
                            amount: amount,
                            description: description || `Investment (${type})`,
                            medium: "balance"
                        });
                        // Re-sync after delay to catch update
                        setTimeout(() => get().syncNessieData(true), 1000);
                    } catch (e) {
                        console.error("Investment API call failed", e);
                    }
                }

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

                    // Match other customers to friends or create new ones
                    const otherCustomers = customers.slice(1);
                    const newFriends: Friend[] = [];

                    // Helper to get account for a customer
                    // We need to fetch accounts for other customers to get their IDs
                    // This might be slow if there are many, so we'll do it for the first few
                    for (const otherCust of otherCustomers.slice(0, 3)) {
                        const existingFriend = state.friends.find(f => f.name === `${otherCust.first_name} ${otherCust.last_name}`);

                        try {
                            const otherAccRes = await nessieClient.getAccounts(otherCust._id);
                            const otherAccs = otherAccRes.data || (Array.isArray(otherAccRes) ? otherAccRes : []);
                            const mainAcc = otherAccs.find((a: any) => a.type?.toLowerCase().includes('checking')) || otherAccs[0];

                            if (mainAcc) {
                                if (existingFriend) {
                                    // Update existing
                                    existingFriend.nessieAccountId = mainAcc._id;
                                } else {
                                    // Create new
                                    newFriends.push({
                                        id: `friend_${otherCust._id}`,
                                        name: `${otherCust.first_name} ${otherCust.last_name}`,
                                        avatarInitials: `${otherCust.first_name[0]}${otherCust.last_name[0]}`.toUpperCase(),
                                        nessieAccountId: mainAcc._id
                                    });
                                }
                            }
                        } catch (e) {
                            console.error("Failed to fetch friend account", e);
                        }
                    }

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
                        merchant_name: p.merchant_id ? `Merchant ${p.merchant_id.substring(0, 6)}` : (p.description || p.payee_id || "Unknown Activity"),
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
                        friends: [...state.friends, ...newFriends], // Simplified join
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

            simulateNessieTransaction: async (merchant, amount) => {
                const state = get();
                if (state.nessieConnected && state.selectedAccountId) {
                    try {
                        await nessieClient.createPurchase(state.selectedAccountId, {
                            amount: amount,
                            description: merchant,
                            medium: "balance"
                        });
                        // Re-sync
                        setTimeout(() => get().syncNessieData(true), 1000);
                    } catch (e) {
                        console.error("Simulation API call failed", e);
                    }
                }

                // Optimistic Local update
                const newTx: Transaction = {
                    id: `sim_${Date.now()}`,
                    date: new Date().toISOString().split('T')[0],
                    merchant_name: merchant,
                    amount: amount,
                    category: 'Shopping',
                    status: 'posted',
                    accountId: state.selectedAccountId || 'demo_account'
                };
                get().addTransaction(newTx);
            },

            simulatePaycheck: async (overrideAmount) => {
                const state = get();
                const paycheckAmount = overrideAmount !== undefined ? overrideAmount : (state.user.paycheckAmount || 2000);

                // 1. Nessie Deposit (Income)
                if (state.nessieConnected && state.selectedAccountId) {
                    try {
                        await nessieClient.createDeposit(state.selectedAccountId, {
                            medium: "balance",
                            amount: paycheckAmount,
                            description: "Payroll Direct Deposit",
                            transaction_date: new Date().toISOString().split('T')[0]
                        });
                    } catch (e) {
                        console.error("Paycheck API deposit failed", e);
                    }
                }

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
                    amount: paycheckAmount,
                    status: "posted",
                    isPaycheck: true,
                    accountId: state.selectedAccountId || "demo_account"
                };

                // Add income tx (which increases balance in addTransaction logic if negative? No, logic needs review)
                // Existing addTransaction logic subtracts amount. We need to handle Income/Deposits differently?
                // Looking at addTransaction: checkingBalance: s.user.checkingBalance - tx.amount
                // So for income, we should probably manually update or pass negative amount?
                // Standard convention: Expense positive, Income negative? Or type checking?
                // Let's do manual update here to be safe and clear.

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

                // 5. Nessie Sync to confirm
                if (state.nessieConnected) {
                    setTimeout(() => get().syncNessieData(true), 1500);
                }
            },

            settleSplit: async (friendId: string, amount: number) => {
                const state = get();
                const friend = state.friends.find(f => f.id === friendId);
                const roundedAmount = Number(amount.toFixed(2));

                console.log(`[Store] Attempting Settle: Friend=${friend?.name || 'Unknown'}, Amount=${roundedAmount}`);

                // 1. Nessie Transfer
                if (state.nessieConnected && state.selectedAccountId && friend?.nessieAccountId) {
                    try {
                        await nessieClient.createTransfer(state.selectedAccountId, {
                            medium: "balance",
                            payee_id: friend.nessieAccountId,
                            amount: roundedAmount,
                            description: "Slice Settle Up"
                        });
                        setTimeout(() => get().syncNessieData(true), 1000);
                    } catch (e) {
                        console.error("Friend Settle API call failed", e);
                    }
                }

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
                    accountId: state.selectedAccountId || "demo_account"
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

                // 1. Nessie Transfer
                if (state.nessieConnected && state.selectedAccountId && friend?.nessieAccountId) {
                    try {
                        await nessieClient.createTransfer(state.selectedAccountId, {
                            medium: "balance",
                            payee_id: friend.nessieAccountId,
                            amount: roundedAmount,
                            description: note || `Sent to ${friend.name}`
                        });
                        // Re-sync
                        setTimeout(() => get().syncNessieData(true), 1000);
                    } catch (e) {
                        console.error("Send Money API call failed", e);
                    }
                }

                // 2. Local Update (Optimistic Transaction)
                const newTx: Transaction = {
                    id: `tx_sent_${Date.now()}`,
                    date: new Date().toISOString(),
                    merchant_name: `Sent to ${friend?.name || 'Friend'}`,
                    category: 'Transfer',
                    amount: roundedAmount,
                    status: "posted",
                    accountId: state.selectedAccountId || "demo_account"
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
