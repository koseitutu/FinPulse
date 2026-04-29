/**
 * FinPulse data model
 */

export type TxType = 'income' | 'expense';
export type AccountType = 'cash' | 'bank' | 'mobile_money' | 'card' | 'savings';

export interface Account {
  id: string;
  name: string;
  currency: string;
  balance: number;
  type: AccountType;
  color: string;
  icon: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  parentId?: string;
  budget?: number;
  type: TxType;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  type: TxType;
  categoryId: string;
  subcategoryId?: string;
  tagIds: string[];
  date: string; // ISO
  notes?: string;
  accountId: string;
  isRecurring?: boolean;
  recurringId?: string;
  receiptImageUri?: string;
  isArchived?: boolean;
  merchant?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // ISO
  accountId?: string;
  color: string;
  icon: string;
  createdAt: string;
  contributions: { id: string; amount: number; date: string }[];
}

export type Frequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  type: TxType;
  categoryId: string;
  accountId: string;
  frequency: Frequency;
  nextDueDate: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

export interface Debt {
  id: string;
  name: string;
  contactName: string;
  amount: number;
  amountPaid: number;
  type: 'owed' | 'lent'; // owed = I owe, lent = someone owes me
  dueDate: string;
  isPaid: boolean;
  notes?: string;
  createdAt: string;
}

export type WidgetKey =
  | 'balance'
  | 'budgets'
  | 'savings'
  | 'recent'
  | 'forecast'
  | 'debts'
  | 'accounts';

export interface DashboardConfig {
  widgetOrder: WidgetKey[];
  visibleWidgets: Record<WidgetKey, boolean>;
}

export interface ArchiveConfig {
  autoArchiveMonths: 6 | 12 | 24;
  lastArchiveDate?: string;
}

export interface AlertConfig {
  budget50: boolean;
  budget80: boolean;
  budget100: boolean;
  dailyDigest: boolean;
  weeklyDigest: boolean;
  debtReminders: boolean;
}

export interface Preferences {
  currency: string;
  theme: 'dark' | 'light';
  name: string;
  alerts: AlertConfig;
}
