export interface User {
  id: string;
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
  avatarInitials: string;
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
  contributions: { date: string; memberId: string; amount: number }[];
}

export type AppState = {
  user: User;
  transactions: Transaction[];
  upcomingBills: Bill[];
  friends: Friend[];
  splitRequests: SplitRequest[];
  splitRules: SplitRule[];
  investments: InvestmentEntry[];
  portfolio: Portfolio;
  goals: SharedGoal[];
};
