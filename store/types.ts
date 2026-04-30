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
  isArchived?: boolean;
  merchant?: string;
}

export interface Transfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  fromAmount: number;
  toAmount: number;
  fromCurrency: string;
  toCurrency: string;
  date: string; // ISO
  fee?: number; // amount deducted from source in source currency, already included in fromAmount when present
  notes?: string;
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

export type WidgetKey =
  | 'balance'
  | 'budgets'
  | 'recent'
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
}

export type FontScale = 'small' | 'medium' | 'large';

export interface Preferences {
  currency: string;
  theme: 'dark' | 'light';
  name: string;
  pin?: string;
  biometric?: boolean;
  alerts: AlertConfig;
  /**
   * Global font-size preference. Multiplies every text size across the app.
   * Defaults to 'medium' (1.0×). Small = 0.88×, Large = 1.15×.
   */
  fontScale: FontScale;
}
