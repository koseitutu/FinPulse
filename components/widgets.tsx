import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Colors, Radius, Spacing, formatCompact, formatCurrency } from '@/constants/theme';
import { AppText, Card, IconCircle, ProgressBar, SectionHeader } from './ui';
import { Sparkline } from './charts';
import { activeTransactions, useAppStore } from '@/store/useAppStore';
import { daysInMonth, filterMonth, forecast, formatRelative, sumByType } from '@/utils/finance';
import type { WidgetKey } from '@/store/types';

export function BalanceWidget() {
  const accounts = useAppStore((s) => s.accounts);
  const txs = useAppStore(activeTransactions);
  const rates = useAppStore((s) => s.exchangeRates);
  const preferredCcy = useAppStore((s) => s.preferences.currency);

  const convertToBase = (amount: number, ccy: string) => {
    const rate = rates[ccy] ?? 1;
    const baseRate = rates[preferredCcy] ?? 1;
    if (ccy === preferredCcy) return amount;
    // amount ccy -> GHS base = amount / rate * (rates of base)
    return (amount / rate) * baseRate;
  };
  const total = accounts.reduce((acc, a) => acc + convertToBase(a.balance, a.currency), 0);

  const spark = useMemo(() => {
    const n = new Date();
    const days = 30;
    const arr: number[] = new Array(days).fill(0);
    txs.forEach((t) => {
      const d = new Date(t.date);
      const diff = Math.floor((n.getTime() - d.getTime()) / 86400000);
      if (diff >= 0 && diff < days) {
        arr[days - 1 - diff] += t.type === 'income' ? t.amount : -t.amount;
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
  const thisMonthTx = filterMonth(txs, now.getFullYear(), now.getMonth());
  const { income, expense } = sumByType(thisMonthTx);

  return (
    <View
      style={{
        backgroundColor: Colors.bgElevated,
        borderRadius: Radius.xl,
        padding: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.border,
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
          backgroundColor: Colors.gold + '15',
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
          backgroundColor: Colors.info + '10',
        }}
      />
      <AppText size={11} weight="semiBold" color={Colors.textMuted} style={{ letterSpacing: 1.2 }}>
        TOTAL BALANCE · {preferredCcy}
      </AppText>
      <AppText weight="bold" size={36} style={{ marginTop: 8, fontVariant: ['tabular-nums'] }} selectable>
        {formatCurrency(total, preferredCcy)}
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
              +{formatCompact(income, preferredCcy)}
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
              -{formatCompact(expense, preferredCcy)}
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

export function ForecastWidget() {
  const txs = useAppStore(activeTransactions);
  const now = new Date();
  const monthTx = filterMonth(txs, now.getFullYear(), now.getMonth());
  const spent = monthTx.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const days = daysInMonth(now.getFullYear(), now.getMonth());
  const currentDay = now.getDate();
  const predicted = forecast(spent, currentDay, days);
  const totalBudget = useAppStore((s) =>
    s.categories
      .filter((c) => c.type === 'expense' && !c.parentId && c.budget)
      .reduce((acc, c) => acc + (c.budget ?? 0), 0)
  );

  const onPace = totalBudget > 0 && predicted <= totalBudget;

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconCircle icon="trending-up" color={onPace ? Colors.income : Colors.expense} size={44} />
        <View style={{ flex: 1 }}>
          <AppText size={11} weight="semiBold" color={Colors.textMuted} style={{ letterSpacing: 0.8 }}>
            SPENDING FORECAST
          </AppText>
          <AppText weight="semiBold" size={16} style={{ marginTop: 2 }}>
            {formatCompact(predicted)} by month-end
          </AppText>
        </View>
      </View>
      <View style={{ marginTop: Spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <AppText size={11} color={Colors.textSecondary}>
            Day {currentDay} of {days}
          </AppText>
          <AppText size={11} weight="semiBold" color={onPace ? Colors.income : Colors.expense}>
            {onPace ? 'On track' : 'Over pace'}
          </AppText>
        </View>
        <ProgressBar
          value={predicted}
          max={Math.max(totalBudget, predicted) || 1}
          color={onPace ? Colors.income : Colors.expense}
          showOverflow
        />
        <AppText size={11} color={Colors.textMuted} style={{ marginTop: 8 }}>
          At this pace, you&apos;ll spend {formatCompact(predicted)} this month ({formatCompact(spent)} so far).
        </AppText>
      </View>
    </Card>
  );
}

export function BudgetsWidget() {
  const categories = useAppStore((s) => s.categories);
  const txs = useAppStore(activeTransactions);
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
    <Card>
      <SectionHeader
        title="Budget pulse"
        subtitle={`${monthTx.filter((t) => t.type === 'expense').length} expenses this month`}
        action={
          <Link href="/insights" asChild>
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

export function SavingsWidget() {
  const goals = useAppStore((s) => s.savingsGoals).slice(0, 3);
  if (goals.length === 0) return null;
  return (
    <Card>
      <SectionHeader
        title="Savings goals"
        subtitle={`${goals.length} active`}
        action={
          <Link href="/goals" asChild>
            <Pressable>
              <AppText size={12} color={Colors.gold} weight="semiBold">
                Manage
              </AppText>
            </Pressable>
          </Link>
        }
      />
      <View style={{ gap: 14 }}>
        {goals.map((g) => {
          const pct = (g.currentAmount / g.targetAmount) * 100;
          return (
            <View key={g.id} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    backgroundColor: g.color + '22',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={g.icon as never} size={15} color={g.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText size={13} weight="semiBold">
                    {g.name}
                  </AppText>
                  <AppText size={11} color={Colors.textMuted}>
                    {formatCompact(g.currentAmount)} of {formatCompact(g.targetAmount)}
                  </AppText>
                </View>
                <AppText size={12} weight="semiBold" color={g.color}>
                  {pct.toFixed(0)}%
                </AppText>
              </View>
              <ProgressBar value={g.currentAmount} max={g.targetAmount} color={g.color} />
            </View>
          );
        })}
      </View>
    </Card>
  );
}

export function RecentWidget() {
  const txs = useAppStore(activeTransactions).slice(0, 5);
  const categories = useAppStore((s) => s.categories);
  const accounts = useAppStore((s) => s.accounts);

  return (
    <Card>
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
      <View style={{ gap: 12 }}>
        {txs.map((t) => {
          const cat = categories.find((c) => c.id === t.categoryId);
          const acc = accounts.find((a) => a.id === t.accountId);
          const color = t.type === 'income' ? Colors.income : cat?.color ?? Colors.expense;
          return (
            <Link key={t.id} href={{ pathname: '/transactions/[id]', params: { id: t.id } }} asChild>
              <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: color + '22',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={(cat?.icon as never) ?? 'pricetag'} size={18} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText weight="semiBold" size={13}>
                    {t.merchant || cat?.name || 'Transaction'}
                  </AppText>
                  <AppText size={11} color={Colors.textMuted}>
                    {formatRelative(t.date)} · {acc?.name}
                  </AppText>
                </View>
                <AppText weight="semiBold" size={13} color={t.type === 'income' ? Colors.income : Colors.text}>
                  {t.type === 'income' ? '+' : '-'}
                  {formatCompact(t.amount, t.currency)}
                </AppText>
              </Pressable>
            </Link>
          );
        })}
      </View>
    </Card>
  );
}

export function DebtsWidget() {
  const debts = useAppStore((s) => s.debts).filter((d) => !d.isPaid);
  const owed = debts.filter((d) => d.type === 'owed').reduce((a, d) => a + (d.amount - d.amountPaid), 0);
  const lent = debts.filter((d) => d.type === 'lent').reduce((a, d) => a + (d.amount - d.amountPaid), 0);
  const overdue = debts.filter((d) => new Date(d.dueDate).getTime() < Date.now()).length;

  return (
    <Card>
      <SectionHeader
        title="Debt summary"
        subtitle={overdue > 0 ? `${overdue} overdue` : 'All on schedule'}
        action={
          <Link href="/debts" asChild>
            <Pressable>
              <AppText size={12} color={Colors.gold} weight="semiBold">
                Manage
              </AppText>
            </Pressable>
          </Link>
        }
      />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: Colors.expenseSoft,
            borderRadius: Radius.md,
            padding: Spacing.md,
            borderWidth: 1,
            borderColor: Colors.expense + '44',
          }}
        >
          <AppText size={11} color={Colors.textMuted}>
            You owe
          </AppText>
          <AppText weight="bold" size={18} color={Colors.expense}>
            {formatCompact(owed)}
          </AppText>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: Colors.incomeSoft,
            borderRadius: Radius.md,
            padding: Spacing.md,
            borderWidth: 1,
            borderColor: Colors.income + '44',
          }}
        >
          <AppText size={11} color={Colors.textMuted}>
            Owed to you
          </AppText>
          <AppText weight="bold" size={18} color={Colors.income}>
            {formatCompact(lent)}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

export function AccountsWidget() {
  const accounts = useAppStore((s) => s.accounts);
  return (
    <Card>
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
  forecast: { label: 'Spending Forecast', icon: 'trending-up', render: () => <ForecastWidget /> },
  budgets: { label: 'Budget Pulse', icon: 'speedometer', render: () => <BudgetsWidget /> },
  savings: { label: 'Savings Goals', icon: 'flag', render: () => <SavingsWidget /> },
  debts: { label: 'Debt Summary', icon: 'cash', render: () => <DebtsWidget /> },
  recent: { label: 'Recent Activity', icon: 'list', render: () => <RecentWidget /> },
  accounts: { label: 'Accounts', icon: 'grid', render: () => <AccountsWidget /> },
};
