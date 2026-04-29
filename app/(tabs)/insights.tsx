import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, formatCompact, formatCurrency } from '@/constants/theme';
import { AppText, Card, Chip, ProgressBar, SectionHeader } from '@/components/ui';
import { BarChart, Donut, LegendRow, LineChart } from '@/components/charts';
import { activeTransactions, useAppStore } from '@/store/useAppStore';
import { daysInMonth, filterMonth, forecast, groupByCategory, sumByType } from '@/utils/finance';

type Range = 'month' | '3m' | 'year';

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const txs = useAppStore(activeTransactions);
  const categories = useAppStore((s) => s.categories);
  const [range, setRange] = useState<Range>('month');

  const now = new Date();
  const thisMonth = filterMonth(txs, now.getFullYear(), now.getMonth());
  const { income, expense } = sumByType(thisMonth);
  const days = daysInMonth(now.getFullYear(), now.getMonth());
  const predicted = forecast(expense, now.getDate(), days);

  const catBreakdown = useMemo(() => {
    const expenses = thisMonth.filter((t) => t.type === 'expense');
    return groupByCategory(expenses, categories).slice(0, 6);
  }, [thisMonth, categories]);

  const slices = catBreakdown.map((g) => ({
    label: g.category?.name ?? 'Other',
    value: g.total,
    color: g.category?.color ?? Colors.gold,
  }));

  // bar data: last 6 months expense
  const bars = useMemo(() => {
    const arr: { label: string; value: number; highlight?: boolean }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const ms = filterMonth(txs, d.getFullYear(), d.getMonth()).filter((t) => t.type === 'expense');
      const total = ms.reduce((a, t) => a + t.amount, 0);
      arr.push({
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        value: total,
        highlight: i === 0,
      });
    }
    return arr;
  }, [txs]);

  // line data: daily cumulative this month expense
  const line = useMemo(() => {
    const arr = new Array(days).fill(0);
    const today = new Date().getDate();
    thisMonth
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const d = new Date(t.date).getDate() - 1;
        if (d >= 0) arr[d] += t.amount;
      });
    const cum: number[] = [];
    let c = 0;
    arr.forEach((v, i) => {
      c += v;
      if (i <= today - 1) cum.push(c);
    });
    return cum;
  }, [thisMonth, days]);

  // Financial health score
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
  const healthScore = Math.max(0, Math.min(100, Math.round(savingsRate * 1.2 + 40)));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + Spacing.md,
        paddingBottom: 120,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.lg,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <AppText weight="bold" size={24}>
            Insights
          </AppText>
          <AppText size={12} color={Colors.textMuted}>
            Your financial pulse
          </AppText>
        </View>
        <Link href="/reports/monthly" asChild>
          <Pressable
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: Colors.gold + '22',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 10,
            }}
          >
            <Ionicons name="document-text" size={14} color={Colors.gold} />
            <AppText size={12} weight="semiBold" color={Colors.gold}>
              Full Report
            </AppText>
          </Pressable>
        </Link>
      </View>

      {/* Financial health score */}
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View
            style={{
              width: 90,
              height: 90,
              borderRadius: 45,
              borderWidth: 6,
              borderColor: healthScore > 70 ? Colors.income : healthScore > 40 ? Colors.gold : Colors.expense,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppText weight="bold" size={26}>
              {healthScore}
            </AppText>
            <AppText size={9} color={Colors.textMuted}>
              / 100
            </AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText size={11} weight="semiBold" color={Colors.textMuted} style={{ letterSpacing: 1 }}>
              FINANCIAL HEALTH
            </AppText>
            <AppText weight="bold" size={18} style={{ marginTop: 4 }}>
              {healthScore > 70 ? 'Excellent' : healthScore > 40 ? 'Steady' : 'Needs attention'}
            </AppText>
            <AppText size={12} color={Colors.textSecondary} style={{ marginTop: 4 }}>
              Savings rate: {savingsRate.toFixed(1)}%
            </AppText>
          </View>
        </View>
      </Card>

      {/* Forecast card */}
      <Card>
        <SectionHeader
          title="Month forecast"
          subtitle={`Day ${now.getDate()} of ${days}`}
        />
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
          <View style={{ flex: 1 }}>
            <AppText size={10} color={Colors.textMuted}>
              SPENT SO FAR
            </AppText>
            <AppText weight="bold" size={20} color={Colors.expense} style={{ fontVariant: ['tabular-nums'] }}>
              {formatCompact(expense)}
            </AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText size={10} color={Colors.textMuted}>
              PROJECTED TOTAL
            </AppText>
            <AppText weight="bold" size={20} color={Colors.gold} style={{ fontVariant: ['tabular-nums'] }}>
              {formatCompact(predicted)}
            </AppText>
          </View>
        </View>
        {line.length > 1 ? <LineChart data={line} color={Colors.gold} /> : null}
      </Card>

      {/* Range selector */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip label="This month" active={range === 'month'} onPress={() => setRange('month')} />
        <Chip label="3 months" active={range === '3m'} onPress={() => setRange('3m')} />
        <Chip label="Year" active={range === 'year'} onPress={() => setRange('year')} />
      </View>

      {/* Income vs Expense */}
      <Card>
        <SectionHeader title="Income vs Expense" subtitle="6-month trend" />
        <BarChart data={bars} height={160} />
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
          <View style={{ flex: 1 }}>
            <AppText size={11} color={Colors.textMuted}>
              INCOME (THIS MO)
            </AppText>
            <AppText weight="bold" size={18} color={Colors.income}>
              +{formatCurrency(income)}
            </AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText size={11} color={Colors.textMuted}>
              EXPENSE (THIS MO)
            </AppText>
            <AppText weight="bold" size={18} color={Colors.expense}>
              -{formatCurrency(expense)}
            </AppText>
          </View>
        </View>
      </Card>

      {/* Category breakdown */}
      <Card>
        <SectionHeader title="Where your money goes" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.lg }}>
          <Donut
            data={slices}
            size={140}
            thickness={18}
            centerLabel={formatCompact(expense)}
            centerSublabel="spent"
          />
          <LegendRow data={slices} />
        </View>
      </Card>

      {/* Top Merchants */}
      <TopMerchantsCard />

      {/* Budget status */}
      <Card>
        <SectionHeader title="Budget status" subtitle={`${categories.filter(c => c.budget && !c.parentId).length} active budgets`} />
        <View style={{ gap: 12 }}>
          {categories
            .filter((c) => !c.parentId && c.type === 'expense' && c.budget)
            .map((c) => {
              const spent = thisMonth
                .filter((t) => t.categoryId === c.id || categories.find((x) => x.id === t.categoryId)?.parentId === c.id)
                .reduce((a, t) => a + t.amount, 0);
              const pct = c.budget! > 0 ? (spent / c.budget!) * 100 : 0;
              return (
                <View key={c.id} style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        backgroundColor: c.color + '22',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name={c.icon as never} size={12} color={c.color} />
                    </View>
                    <AppText size={13} style={{ flex: 1 }}>
                      {c.name}
                    </AppText>
                    <AppText size={12} weight="semiBold" color={pct > 100 ? Colors.expense : Colors.text}>
                      {pct.toFixed(0)}%
                    </AppText>
                  </View>
                  <ProgressBar value={spent} max={c.budget!} color={c.color} showOverflow />
                </View>
              );
            })}
        </View>
      </Card>
    </ScrollView>
  );
}

function TopMerchantsCard() {
  const txs = useAppStore(activeTransactions);
  const now = new Date();
  const month = filterMonth(txs, now.getFullYear(), now.getMonth());
  const byMerchant = new Map<string, number>();
  month
    .filter((t) => t.type === 'expense' && t.merchant)
    .forEach((t) => {
      byMerchant.set(t.merchant!, (byMerchant.get(t.merchant!) ?? 0) + t.amount);
    });
  const list = Array.from(byMerchant.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (list.length === 0) return null;

  const max = list[0][1];
  return (
    <Card>
      <SectionHeader title="Top merchants" subtitle="This month" />
      <View style={{ gap: 10 }}>
        {list.map(([m, total], i) => (
          <View key={m} style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText size={13} weight="medium">
                {i + 1}. {m}
              </AppText>
              <AppText size={13} weight="semiBold" style={{ fontVariant: ['tabular-nums'] }}>
                {formatCompact(total)}
              </AppText>
            </View>
            <View
              style={{
                height: 4,
                borderRadius: 2,
                backgroundColor: Colors.surfaceHigh,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${(total / max) * 100}%`,
                  height: '100%',
                  backgroundColor: Colors.gold,
                }}
              />
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}
