import type { Category, Transaction } from '@/store/types';

export const monthKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const sameMonth = (iso: string, year: number, month: number) => {
  const d = new Date(iso);
  return d.getFullYear() === year && d.getMonth() === month;
};

export const filterMonth = (txs: Transaction[], year: number, month: number) =>
  txs.filter((t) => sameMonth(t.date, year, month));

// --- Fiscal month utilities ---

/**
 * Returns the start and end dates of the fiscal month period that contains `refDate`.
 * If startDay=1, this is equivalent to a standard calendar month.
 * E.g. startDay=15, refDate=Jan 20 -> period is Jan 15 to Feb 14.
 * E.g. startDay=15, refDate=Jan 10 -> period is Dec 15 to Jan 14.
 */
export const getFiscalMonthRange = (
  refDate: Date,
  startDay: number
): { start: Date; end: Date } => {
  const day = startDay < 1 ? 1 : startDay > 28 ? 28 : startDay;

  if (day === 1) {
    // Standard calendar month
    const start = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
    const end = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }

  const y = refDate.getFullYear();
  const m = refDate.getMonth();
  const d = refDate.getDate();

  if (d >= day) {
    // We are in the fiscal month that started this calendar month
    const start = new Date(y, m, day);
    const end = new Date(y, m + 1, day - 1, 23, 59, 59, 999);
    return { start, end };
  } else {
    // We are still in the fiscal month that started last calendar month
    const start = new Date(y, m - 1, day);
    const end = new Date(y, m, day - 1, 23, 59, 59, 999);
    return { start, end };
  }
};

/**
 * Offset the fiscal month period by N months (positive = future, negative = past).
 */
export const getOffsetFiscalMonthRange = (
  startDay: number,
  offset: number
): { start: Date; end: Date } => {
  const now = new Date();
  // Get current fiscal month, then shift by offset
  const { start } = getFiscalMonthRange(now, startDay);
  const shifted = new Date(start.getFullYear(), start.getMonth() + offset, start.getDate());
  return getFiscalMonthRange(shifted, startDay);
};

/**
 * Filter transactions to those within a fiscal month period.
 */
export const filterFiscalMonth = (
  txs: Transaction[],
  startDay: number,
  refDate?: Date
): Transaction[] => {
  const { start, end } = getFiscalMonthRange(refDate ?? new Date(), startDay);
  return txs.filter((t) => {
    const d = new Date(t.date);
    return d >= start && d <= end;
  });
};

/**
 * Get number of days in the current fiscal month period.
 */
export const fiscalMonthDays = (startDay: number, refDate?: Date): number => {
  const { start, end } = getFiscalMonthRange(refDate ?? new Date(), startDay);
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
};

/**
 * Get the current day number within the fiscal month (1-based).
 */
export const fiscalDayOfMonth = (startDay: number, refDate?: Date): number => {
  const ref = refDate ?? new Date();
  const { start } = getFiscalMonthRange(ref, startDay);
  return Math.floor((ref.getTime() - start.getTime()) / 86400000) + 1;
};

export const sumByType = (txs: Transaction[]) =>
  txs.reduce(
    (acc, t) => {
      if (t.type === 'income') acc.income += t.amount;
      else acc.expense += t.amount;
      return acc;
    },
    { income: 0, expense: 0 }
  );

export const groupByCategory = (txs: Transaction[], categories: Category[]) => {
  const map = new Map<string, number>();
  txs.forEach((t) => {
    const c = categories.find((x) => x.id === t.categoryId);
    const key = c?.parentId ? c.parentId : t.categoryId;
    map.set(key, (map.get(key) ?? 0) + t.amount);
  });
  return Array.from(map.entries())
    .map(([catId, total]) => {
      const cat = categories.find((c) => c.id === catId);
      return { categoryId: catId, category: cat, total };
    })
    .sort((a, b) => b.total - a.total);
};

export const daysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

export const forecast = (spentSoFar: number, currentDay: number, monthDays: number) => {
  if (currentDay <= 0) return 0;
  return (spentSoFar / currentDay) * monthDays;
};

export const formatDate = (iso: string, opts?: Intl.DateTimeFormatOptions) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', opts ?? { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatRelative = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const dayMs = 86400000;
  const diffDays = Math.round(diffMs / dayMs);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays === -1) return 'Tomorrow';
  if (diffDays > 0 && diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 0 && diffDays > -7) return `in ${-diffDays}d`;
  return formatDate(iso);
};

export const monthName = (month: number) =>
  new Date(2000, month, 1).toLocaleDateString('en-US', { month: 'long' });
