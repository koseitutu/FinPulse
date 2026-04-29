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
