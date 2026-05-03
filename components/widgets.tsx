import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Colors, Radius, Spacing, formatCompact, formatCurrency } from '@/constants/theme';
import { AppText, Card, IconCircle, ProgressBar, SectionHeader } from './ui';
import { Sparkline } from './charts';
import { useActiveTransactions, useAppStore } from '@/store/useAppStore';
import { filterMonth, sumByType } from '@/utils/finance';
import type { WidgetKey } from '@/store/types';
import { TransactionItem } from './transaction-item';

export function BalanceWidget() {
  const accounts = useAppStore((s) => s.accounts);
  const txs = useActiveTransactions();
  const preferredCcy = useAppStore((s) => s.preferences.currency);

  const safeCcy = preferredCcy || 'USD';

  // Sum balances only from accounts that match the preferred display currency.
  // Accounts in other currencies keep their native balance on the Accounts
  // widget — we no longer do live FX conversion.
  const total = useMemo(() => {
    const list = accounts ?? [];
    return list.reduce((acc, a) => {
      if (!a || typeof a.balance !== 'number' || Number.isNaN(a.balance)) return acc;
      const ccy = a.currency || safeCcy;
      if (ccy !== safeCcy) return acc;
      return acc + a.balance;
    }, 0);
  }, [accounts, safeCcy]);

  const spark = useMemo(() => {
    const n = new Date();
    const days = 30;
    const arr: number[] = new Array(days).fill(0);
    (txs ?? []).forEach((t) => {
      if (!t?.date) return;
      const d = new Date(t.date);
      if (Number.isNaN(d.getTime())) return;
      const diff = Math.floor((n.getTime() - d.getTime()) / 86400000);
      if (diff >= 0 && diff < days) {
        const amt = typeof t.amount === 'number' && !Number.isNaN(t.amount) ? t.amount : 0;
        arr[days - 1 - diff] += t.type === 'income' ? amt : -amt;
      }
    });
    const cum: number[] = [];
    let c = 0;
    arr.forEach((v) => {
      c += v;
      cum.push(c);
    });
    return cum;
  }, [txs]);

  const now = new Date();
  const thisMonthTx = filterMonth(txs ?? [], now.getFullYear(), now.getMonth());
  const { income, expense } = sumByType(thisMonthTx);
  const safeTotal = Number.isFinite(total) ? total : 0;
  const safeIncome = Number.isFinite(income) ? income : 0;
  const safeExpense = Number.isFinite(expense) ? expense : 0;

  const tone = Colors.tones.purple;
  return (
    <View
      style={{
        backgroundColor: tone.bg,
        borderRadius: Radius.xl,
        padding: Spacing.xl,
        borderWidth: 1,
        borderColor: tone.border,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          position: 'absolute',
          right: -40,
          top: -40,
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: tone.accent + '22',
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: -30,
          bottom: -60,
          width: 160,
          height: 160,
          borderRadius: 80,
          backgroundColor: Colors.info + '1A',
        }}
      />
      <AppText size={11} weight="semiBold" color={Colors.textMuted} style={{ letterSpacing: 1.2 }}>
        TOTAL BALANCE · {safeCcy}
      </AppText>
      <AppText weight="bold" size={36} style={{ marginTop: 8, fontVariant: ['tabular-nums'] }} selectable>
        {formatCurrency(safeTotal, safeCcy)}
      </AppText>

      <View style={{ marginTop: Spacing.lg, flexDirection: 'row', gap: Spacing.md }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: Colors.income,
            }}
          />
          <View>
            <AppText size={10} color={Colors.textMuted}>
              Income this month
            </AppText>
            <AppText weight="semiBold" size={14} color={Colors.income}>
              +{formatCompact(safeIncome, safeCcy)}
            </AppText>
          </View>
        </View>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: Colors.expense,
            }}
          />
          <View>
            <AppText size={10} color={Colors.textMuted}>
              Spent this month
            </AppText>
            <AppText weight="semiBold" size={14} color={Colors.expense}>
              -{formatCompact(safeExpense, safeCcy)}
            </AppText>
          </View>
        </View>
      </View>

      {spark.length > 1 ? (
        <View style={{ marginTop: Spacing.lg, height: 40 }}>
          <Sparkline values={spark} color={Colors.gold} />
        </View>
      ) : null}
    </View>
  );
}

export function BudgetsWidget() {
  const categories = useAppStore((s) => s.categories);
  const txs = useActiveTransactions();
  const now = new Date();
  const monthTx = filterMonth(txs, now.getFullYear(), now.getMonth());

  const budgets = categories
    .filter((c) => !c.parentId && c.type === 'expense' && c.budget)
    .map((c) => {
      const spent = monthTx
        .filter((t) => {
          const cat = categories.find((x) => x.id === t.categoryId);
          return t.categoryId === c.id || cat?.parentId === c.id;
        })
        .reduce((a, t) => a + t.amount, 0);
      return { cat: c, spent, budget: c.budget ?? 0 };
    })
    .sort((a, b) => b.spent / (b.budget || 1) - a.spent / (a.budget || 1))
    .slice(0, 4);

  return (
    <Card tone="teal">
      <SectionHeader
        title="Budget pulse"
        subtitle={`${monthTx.filter((t) => t.type === 'expense').length} expenses this month`}
        action={
          <Link href="/budgets" asChild>
            <Pressable>
              <AppText size={12} color={Colors.gold} weight="semiBold">
                See all
              </AppText>
            </Pressable>
          </Link>
        }
      />
      <View style={{ gap: 14 }}>
        {budgets.map(({ cat, spent, budget }) => {
          const pct = budget > 0 ? (spent / budget) * 100 : 0;
          const over = pct > 100;
          return (
            <View key={cat.id} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: cat.color + '22',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={cat.icon as never} size={13} color={cat.color} />
                </View>
                <AppText size={13} weight="medium" style={{ flex: 1 }}>
                  {cat.name}
                </AppText>
                <AppText size={12} weight="semiBold" color={over ? Colors.expense : Colors.text} style={{ fontVariant: ['tabular-nums'] }}>
                  {formatCompact(spent)} / {formatCompact(budget)}
                </AppText>
              </View>
              <ProgressBar value={spent} max={budget} color={cat.color} showOverflow />
            </View>
          );
        })}
      </View>
    </Card>
  );
}

export function RecentWidget() {
  const txs = useActiveTransactions().slice(0, 5);
  const categories = useAppStore((s) => s.categories);
  const accounts = useAppStore((s) => s.accounts);

  return (
    <Card tone="blue">
      <SectionHeader
        title="Recent activity"
        action={
          <Link href="/transactions" asChild>
            <Pressable>
              <AppText size={12} color={Colors.gold} weight="semiBold">
                View all
              </AppText>
            </Pressable>
          </Link>
        }
      />
      <View style={{ marginHorizontal: -Spacing.lg }}>
        {txs.map((t, idx) => {
          const cat = categories.find((c) => c.id === t.categoryId);
          const acc = accounts.find((a) => a.id === t.accountId);
          return (
            <TransactionItem
              key={t.id}
              transaction={t}
              category={cat}
              account={acc}
              showSeparator={idx > 0}
            />
          );
        })}
      </View>
    </Card>
  );
}

export function AccountsWidget() {
  const accounts = useAppStore((s) => s.accounts);
  return (
    <Card tone="amber">
      <SectionHeader title="Accounts" subtitle={`${accounts.length} connected`} />
      <View style={{ gap: 10 }}>
        {accounts.map((a) => (
          <View key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <IconCircle icon={a.icon as never} color={a.color} size={34} />
            <View style={{ flex: 1 }}>
              <AppText weight="medium" size={13}>
                {a.name}
              </AppText>
              <AppText size={11} color={Colors.textMuted}>
                {a.type.replace('_', ' ')}
              </AppText>
            </View>
            <AppText weight="semiBold" size={13}>
              {formatCompact(a.balance, a.currency)}
            </AppText>
          </View>
        ))}
      </View>
    </Card>
  );
}

export const WIDGETS: Record<WidgetKey, { label: string; icon: keyof typeof Ionicons.glyphMap; render: () => React.ReactElement }> = {
  balance: { label: 'Total Balance', icon: 'wallet', render: () => <BalanceWidget /> },
  budgets: { label: 'Budget Pulse', icon: 'speedometer', render: () => <BudgetsWidget /> },
  recent: { label: 'Recent Activity', icon: 'list', render: () => <RecentWidget /> },
  accounts: { label: 'Accounts', icon: 'grid', render: () => <AccountsWidget /> },
};
