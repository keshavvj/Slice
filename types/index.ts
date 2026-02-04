export interface User {
  id: string;
  auth0Id?: string;
  handle?: string;
  displayName?: string;
  name: string;
  email: string;
  avatarUrl?: string; // e.g. /avatars/user.png
  checkingBalance: number;
  safetyThreshold: number; // e.g. $500 buffer
  paycheckSchedule: "weekly" | "biweekly" | "monthly";
  paycheckAmount: number;
  investPercent: number; // 0-20
  investFixedOverride?: number; // if set, use this amount instead of %
  investDestination: "portfolio" | "hysa";
  roundupsEnabled: boolean;
  selectedStocks: string[];
}

export interface Transaction {
  id: string;
  date: string; // ISO date string
  merchant_name: string;
  category: string;
  amount: number;
  status: "pending" | "posted";
  isPaycheck?: boolean;
  accountId: string; // Nessie account ID
}

export interface Bill {
  id: string;
  name: string; // "Rent", "Spotify"
  dueDate: number; // Day of month (1-31)
  amount: number;
}

export interface Friend {
  id: string;
  name: string;
  phoneNumber?: string;
  avatarInitials: string;
  nessieAccountId?: string;
}

export interface SplitRequest {
  id: string;
  transactionId: string;
  requesterId: string; // usually 'me'
  friendId: string;
  totalAmount: number; // original tx amount
  amountOwed: number; // what friend owes
  status: "pending" | "paid";
  createdAt: string;
}

export interface SplitRule {
  id: string;
  merchantPattern: string; // e.g. "Uber" matches "Uber *Trip"
  friendId: string; // who to split with
  splitType: "equal" | "fixed" | "percentage";
  enabled: boolean;
}

// For investing simulation
export interface InvestmentEntry {
  id: string;
  date: string;
  type: "roundup" | "paycheck" | "manual";
  amount: number;
  destination: "portfolio" | "hysa";
  description: string;
}

export interface Portfolio {
  balance: number;
  weeklyChangePercent: number;
  chartPoints: { date: string; value: number }[];
}

export interface SharedGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  weeklyContribution: number;
  members: Friend[];
  contributions: {
    id?: string;
    date: string;
    memberId: string;
    amount: number;
    type?: "manual" | "recurring";
  }[];
  recurring?: {
    enabled: boolean;
    frequency: "weekly" | "biweekly" | "monthly";
    amount: number;
    scope: "everyone" | "me";
    startDateISO: string;
    nextRunDateISO: string;
    lastRunAtISO?: string;
  };
}

export type AppState = {
  user: User;
  transactions: Transaction[];
  upcomingBills: Bill[];
  bills: Bill[]; // Added missing property
  friends: Friend[];
  splitRequests: SplitRequest[];
  splitRules: SplitRule[];
  investments: InvestmentEntry[];
  portfolio: Portfolio;
  goals: SharedGoal[];

  // Plaid Integration State
  bankConnected: boolean;
  lastFetchedAt: string | null;

  // Actions
  setTransactions: (txs: Transaction[]) => void;
  addTransaction: (tx: Transaction) => void;
  createSplitRequest: (req: SplitRequest) => void;
  markSplitPaid: (id: string) => void;
  updateUserParams: (params: Partial<User>) => void;
  toggleStock: (symbol: string) => void;
  performInvestment: (amount: number, type: "roundup" | "paycheck" | "manual", description: string) => void;
  checkAutoSplits: () => void;
  addGoal: (goal: SharedGoal) => void;
  contributeToGoal: (goalId: string, amount: number, memberId?: string) => void;
  updateGoalRecurring: (goalId: string, settings: SharedGoal['recurring']) => void;
  checkRecurringGoals: () => void;
  addFriend: (friend: Friend) => void;
  removeFriend: (id: string) => void;

  fetchBankingData: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  simulatePaycheck: (overrideAmount?: number) => Promise<void>;
  settleSplit: (friendId: string, amount: number) => Promise<void>;
  sendMoney: (friendId: string, amount: number, note: string) => Promise<void>;
  fetchIdentity: () => Promise<void>;
  fetchGoals: () => Promise<void>;
  fetchSplits: () => Promise<void>;
  resetAll: () => void;
};
