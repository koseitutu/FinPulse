import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Account,
  ArchiveConfig,
  Category,
  DashboardConfig,
  Debt,
  Frequency,
  Preferences,
  RecurringTransaction,
  SavingsGoal,
  Tag,
  Transaction,
  WidgetKey,
} from './types';
import {
  seedAccounts,
  seedCategories,
  seedDebts,
  seedRecurring,
  seedSavingsGoals,
  seedTags,
  seedTransactions,
} from './seed';

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const addFrequency = (iso: string, f: Frequency): string => {
  const d = new Date(iso);
  switch (f) {
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'biweekly':
      d.setDate(d.getDate() + 14);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d.toISOString();
};

interface AppState {
  preferences: Preferences;
  accounts: Account[];
  categories: Category[];
  tags: Tag[];
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  recurring: RecurringTransaction[];
  debts: Debt[];
  dashboard: DashboardConfig;
  archiveConfig: ArchiveConfig;
  exchangeRates: Record<string, number>;
  lastRatesFetch?: string;

  // actions
  setPreferences: (p: Partial<Preferences>) => void;
  setAlerts: (a: Partial<Preferences['alerts']>) => void;

  addTransaction: (t: Omit<Transaction, 'id'>) => Transaction;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  addCategory: (c: Omit<Category, 'id'>) => Category;
  updateCategory: (id: string, patch: Partial<Category>) => void;

  addAccount: (a: Omit<Account, 'id'>) => Account;

  addTag: (t: Omit<Tag, 'id'>) => Tag;

  addGoal: (g: Omit<SavingsGoal, 'id' | 'contributions' | 'createdAt'>) => SavingsGoal;
  updateGoal: (id: string, patch: Partial<SavingsGoal>) => void;
  deleteGoal: (id: string) => void;
  contributeGoal: (id: string, amount: number) => void;

  addRecurring: (r: Omit<RecurringTransaction, 'id' | 'createdAt'>) => RecurringTransaction;
  updateRecurring: (id: string, patch: Partial<RecurringTransaction>) => void;
  deleteRecurring: (id: string) => void;
  toggleRecurring: (id: string) => void;
  processDueRecurring: () => void;

  addDebt: (d: Omit<Debt, 'id' | 'createdAt' | 'amountPaid' | 'isPaid'>) => Debt;
  updateDebt: (id: string, patch: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  payDebt: (id: string, amount: number) => void;

  setDashboardOrder: (order: WidgetKey[]) => void;
  toggleWidget: (key: WidgetKey) => void;

  archiveOld: (months: number) => number;
  restoreTransaction: (id: string) => void;
  setAutoArchive: (months: 6 | 12 | 24) => void;

  setExchangeRates: (rates: Record<string, number>) => void;
}

const defaultDashboard: DashboardConfig = {
  widgetOrder: ['balance', 'forecast', 'budgets', 'savings', 'debts', 'recent', 'accounts'],
  visibleWidgets: {
    balance: true,
    forecast: true,
    budgets: true,
    savings: true,
    debts: true,
    recent: true,
    accounts: true,
  },
};

const defaultPrefs: Preferences = {
  currency: 'GHS',
  theme: 'dark',
  name: 'Kwame',
  alerts: {
    budget50: true,
    budget80: true,
    budget100: true,
    dailyDigest: false,
    weeklyDigest: true,
    debtReminders: true,
  },
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      preferences: defaultPrefs,
      accounts: seedAccounts,
      categories: seedCategories,
      tags: seedTags,
      transactions: seedTransactions,
      savingsGoals: seedSavingsGoals,
      recurring: seedRecurring,
      debts: seedDebts,
      dashboard: defaultDashboard,
      archiveConfig: { autoArchiveMonths: 12 },
      exchangeRates: { GHS: 1, USD: 0.067, EUR: 0.061, GBP: 0.053, NGN: 107.2 },

      setPreferences: (p) => set((s) => ({ preferences: { ...s.preferences, ...p } })),
      setAlerts: (a) =>
        set((s) => ({ preferences: { ...s.preferences, alerts: { ...s.preferences.alerts, ...a } } })),

      addTransaction: (t) => {
        const tx: Transaction = { ...t, id: uid() };
        set((s) => ({
          transactions: [tx, ...s.transactions],
          accounts: s.accounts.map((a) =>
            a.id === tx.accountId
              ? { ...a, balance: a.balance + (tx.type === 'income' ? tx.amount : -tx.amount) }
              : a
          ),
        }));
        return tx;
      },
      updateTransaction: (id, patch) => {
        set((s) => ({
          transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }));
      },
      deleteTransaction: (id) => {
        const t = get().transactions.find((x) => x.id === id);
        if (!t) return;
        set((s) => ({
          transactions: s.transactions.filter((x) => x.id !== id),
          accounts: s.accounts.map((a) =>
            a.id === t.accountId
              ? { ...a, balance: a.balance - (t.type === 'income' ? t.amount : -t.amount) }
              : a
          ),
        }));
      },

      addCategory: (c) => {
        const cat: Category = { ...c, id: uid() };
        set((s) => ({ categories: [...s.categories, cat] }));
        return cat;
      },
      updateCategory: (id, patch) => {
        set((s) => ({ categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
      },

      addAccount: (a) => {
        const acc: Account = { ...a, id: uid() };
        set((s) => ({ accounts: [...s.accounts, acc] }));
        return acc;
      },

      addTag: (t) => {
        const tag: Tag = { ...t, id: uid() };
        set((s) => ({ tags: [...s.tags, tag] }));
        return tag;
      },

      addGoal: (g) => {
        const goal: SavingsGoal = {
          ...g,
          id: uid(),
          createdAt: new Date().toISOString(),
          contributions: [],
        };
        set((s) => ({ savingsGoals: [...s.savingsGoals, goal] }));
        return goal;
      },
      updateGoal: (id, patch) => {
        set((s) => ({ savingsGoals: s.savingsGoals.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
      },
      deleteGoal: (id) => set((s) => ({ savingsGoals: s.savingsGoals.filter((g) => g.id !== id) })),
      contributeGoal: (id, amount) => {
        set((s) => ({
          savingsGoals: s.savingsGoals.map((g) =>
            g.id === id
              ? {
                  ...g,
                  currentAmount: g.currentAmount + amount,
                  contributions: [
                    ...g.contributions,
                    { id: uid(), amount, date: new Date().toISOString() },
                  ],
                }
              : g
          ),
        }));
      },

      addRecurring: (r) => {
        const rec: RecurringTransaction = { ...r, id: uid(), createdAt: new Date().toISOString() };
        set((s) => ({ recurring: [...s.recurring, rec] }));
        return rec;
      },
      updateRecurring: (id, patch) =>
        set((s) => ({ recurring: s.recurring.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      deleteRecurring: (id) => set((s) => ({ recurring: s.recurring.filter((r) => r.id !== id) })),
      toggleRecurring: (id) =>
        set((s) => ({
          recurring: s.recurring.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)),
        })),
      processDueRecurring: () => {
        const now = Date.now();
        const due = get().recurring.filter(
          (r) => r.isActive && new Date(r.nextDueDate).getTime() <= now
        );
        if (!due.length) return;
        due.forEach((r) => {
          get().addTransaction({
            amount: r.amount,
            currency: 'GHS',
            type: r.type,
            categoryId: r.categoryId,
            tagIds: [],
            date: new Date().toISOString(),
            notes: r.notes,
            accountId: r.accountId,
            isRecurring: true,
            recurringId: r.id,
          });
          get().updateRecurring(r.id, { nextDueDate: addFrequency(r.nextDueDate, r.frequency) });
        });
      },

      addDebt: (d) => {
        const debt: Debt = {
          ...d,
          id: uid(),
          createdAt: new Date().toISOString(),
          amountPaid: 0,
          isPaid: false,
        };
        set((s) => ({ debts: [...s.debts, debt] }));
        return debt;
      },
      updateDebt: (id, patch) =>
        set((s) => ({ debts: s.debts.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
      deleteDebt: (id) => set((s) => ({ debts: s.debts.filter((d) => d.id !== id) })),
      payDebt: (id, amount) => {
        set((s) => ({
          debts: s.debts.map((d) => {
            if (d.id !== id) return d;
            const paid = Math.min(d.amount, d.amountPaid + amount);
            return { ...d, amountPaid: paid, isPaid: paid >= d.amount };
          }),
        }));
      },

      setDashboardOrder: (order) =>
        set((s) => ({ dashboard: { ...s.dashboard, widgetOrder: order } })),
      toggleWidget: (key) =>
        set((s) => ({
          dashboard: {
            ...s.dashboard,
            visibleWidgets: { ...s.dashboard.visibleWidgets, [key]: !s.dashboard.visibleWidgets[key] },
          },
        })),

      archiveOld: (months) => {
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - months);
        const cutoffMs = cutoff.getTime();
        let count = 0;
        set((s) => ({
          transactions: s.transactions.map((t) => {
            if (!t.isArchived && new Date(t.date).getTime() < cutoffMs) {
              count += 1;
              return { ...t, isArchived: true };
            }
            return t;
          }),
          archiveConfig: { ...s.archiveConfig, lastArchiveDate: new Date().toISOString() },
        }));
        return count;
      },
      restoreTransaction: (id) =>
        set((s) => ({
          transactions: s.transactions.map((t) => (t.id === id ? { ...t, isArchived: false } : t)),
        })),
      setAutoArchive: (months) =>
        set((s) => ({ archiveConfig: { ...s.archiveConfig, autoArchiveMonths: months } })),

      setExchangeRates: (rates) =>
        set(() => ({ exchangeRates: rates, lastRatesFetch: new Date().toISOString() })),
    }),
    {
      name: 'finpulse-storage-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Selectors
// IMPORTANT: These derive a NEW array on every call. Using them with a bare
// `useAppStore(selector)` call would break zustand v5's default strict-equality
// snapshot check and cause an "infinite getSnapshot" loop. Always consume them
// through the hooks below (which use `useShallow`) or `useAppStore(useShallow(selector))`.
export const selectActiveTransactions = (s: AppState) => s.transactions.filter((t) => !t.isArchived);
export const selectArchivedTransactions = (s: AppState) => s.transactions.filter((t) => t.isArchived);

export const useActiveTransactions = () => useAppStore(useShallow(selectActiveTransactions));
export const useArchivedTransactions = () => useAppStore(useShallow(selectArchivedTransactions));

// Back-compat aliases (kept so existing imports don't break). Prefer the hooks above.
export const activeTransactions = selectActiveTransactions;
export const archivedTransactions = selectArchivedTransactions;
