import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, formatCompact, formatCurrency } from '@/constants/theme';
import { AppText, Button, Card, IconButton, SectionHeader } from '@/components/ui';
import { BarChart, Donut, LegendRow } from '@/components/charts';
import { useActiveTransactions, useAppStore } from '@/store/useAppStore';
import { filterMonth, groupByCategory, monthName, sumByType } from '@/utils/finance';
import {
  buildCSV,
  buildHTML,
  downloadWeb,
  exportPdfNative,
  openHtmlWeb,
  shareFileNative,
} from '@/utils/export';

export default function MonthlyReportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const txs = useActiveTransactions();
  const categories = useAppStore((s) => s.categories);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const changeMonth = (d: number) => {
    const nd = new Date(year, month + d, 1);
    setYear(nd.getFullYear());
    setMonth(nd.getMonth());
  };

  const monthTx = useMemo(() => filterMonth(txs, year, month), [txs, year, month]);
  const { income, expense } = sumByType(monthTx);
  const net = income - expense;
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

  const byCat = useMemo(
    () => groupByCategory(monthTx.filter((t) => t.type === 'expense'), categories),
    [monthTx, categories]
  );
  const slices = byCat.slice(0, 8).map((g) => ({
    label: g.category?.name ?? 'Other',
    value: g.total,
    color: g.category?.color ?? Colors.gold,
  }));

  // Daily bars for the month
  const dailyBars = useMemo(() => {
    const days = new Date(year, month + 1, 0).getDate();
    const arr: { label: string; value: number }[] = [];
    for (let d = 1; d <= days; d++) {
      const total = monthTx
        .filter((t) => t.type === 'expense' && new Date(t.date).getDate() === d)
        .reduce((acc, t) => acc + t.amount, 0);
      arr.push({ label: d % 5 === 0 ? String(d) : '', value: total });
    }
    return arr;
  }, [monthTx, year, month]);

  const title = `${monthName(month)} ${year} Report`;

  const exportCSV = () => {
    const csv = buildCSV(monthTx, categories);
    const filename = `finpulse-${year}-${String(month + 1).padStart(2, '0')}.csv`;
    if (Platform.OS === 'web') {
      downloadWeb(filename, csv, 'text/csv');
    } else {
      shareFileNative(csv, filename, 'text/csv');
    }
  };

  const exportPDF = () => {
    const html = buildHTML({
      title,
      intro: `${monthTx.length} transactions · Generated ${new Date().toDateString()}`,
      sections: [
        {
          heading: 'Summary',
          rows: [
            { label: 'Income', value: formatCurrency(income), color: '#2ECC71' },
            { label: 'Expenses', value: formatCurrency(expense), color: '#E74C3C' },
            { label: 'Net', value: formatCurrency(net), color: net >= 0 ? '#2ECC71' : '#E74C3C' },
            { label: 'Savings rate', value: `${savingsRate.toFixed(1)}%` },
          ],
        },
        {
          heading: 'Top categories',
          rows: byCat.slice(0, 8).map((g) => ({
            label: g.category?.name ?? 'Other',
            value: formatCurrency(g.total),
            color: g.category?.color,
          })),
        },
        {
          heading: 'Transactions',
          rows: monthTx.slice(0, 40).map((t) => ({
            label: `${new Date(t.date).toLocaleDateString()} · ${t.merchant ?? categories.find((c) => c.id === t.categoryId)?.name ?? ''}`,
            value: `${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount, t.currency)}`,
            color: t.type === 'income' ? '#2ECC71' : '#E74C3C',
          })),
        },
      ],
    });
    if (Platform.OS === 'web') {
      openHtmlWeb(html);
    } else {
      const filename = `finpulse-${year}-${String(month + 1).padStart(2, '0')}.pdf`;
      exportPdfNative(html, filename);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, paddingTop: insets.top }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: Spacing.lg,
          paddingBottom: Spacing.md,
        }}
      >
        <IconButton icon="chevron-back" onPress={() => router.back()} />
        <AppText weight="semiBold" size={16}>
          Monthly Report
        </AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120, gap: Spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {/* Month picker */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: Colors.surface,
            borderRadius: Radius.lg,
            padding: 8,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <IconButton icon="chevron-back" size={36} onPress={() => changeMonth(-1)} />
          <View style={{ alignItems: 'center' }}>
            <AppText weight="bold" size={18}>
              {monthName(month)} {year}
            </AppText>
            <AppText size={11} color={Colors.textMuted}>
              {monthTx.length} transactions
            </AppText>
          </View>
          <IconButton icon="chevron-forward" size={36} onPress={() => changeMonth(1)} />
        </View>

        {/* Summary */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <SummaryBox label="INCOME" value={income} color={Colors.income} icon="arrow-down-circle" />
          <SummaryBox label="EXPENSE" value={expense} color={Colors.expense} icon="arrow-up-circle" />
        </View>
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: (net >= 0 ? Colors.income : Colors.expense) + '22',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name={net >= 0 ? 'trending-up' : 'trending-down'}
                size={20}
                color={net >= 0 ? Colors.income : Colors.expense}
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppText size={11} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1 }}>
                NET SAVINGS
              </AppText>
              <AppText weight="bold" size={22} color={net >= 0 ? Colors.income : Colors.expense}>
                {net >= 0 ? '+' : ''}
                {formatCurrency(net)}
              </AppText>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <AppText size={10} color={Colors.textMuted}>
                SAVINGS RATE
              </AppText>
              <AppText weight="bold" size={16}>
                {savingsRate.toFixed(1)}%
              </AppText>
            </View>
          </View>
        </Card>

        {/* Categories */}
        {slices.length > 0 ? (
          <Card>
            <SectionHeader title="Category breakdown" />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <Donut
                data={slices}
                size={140}
                thickness={16}
                centerLabel={formatCompact(expense)}
                centerSublabel="spent"
              />
              <LegendRow data={slices} />
            </View>
          </Card>
        ) : null}

        {/* Daily bars */}
        {monthTx.length > 0 ? (
          <Card>
            <SectionHeader title="Daily spending" subtitle="Across the month" />
            <BarChart data={dailyBars} height={140} />
          </Card>
        ) : null}

        {/* Export buttons */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button
            label="Export PDF"
            icon="document-text"
            variant="primary"
            style={{ flex: 1 }}
            onPress={exportPDF}
          />
          <Button
            label="Export CSV"
            icon="download"
            variant="secondary"
            style={{ flex: 1 }}
            onPress={exportCSV}
          />
        </View>

        {/* Top transactions */}
        {monthTx.length > 0 ? (
          <Card>
            <SectionHeader title="Largest transactions" />
            <View style={{ gap: 10 }}>
              {[...monthTx]
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 5)
                .map((t) => {
                  const cat = categories.find((c) => c.id === t.categoryId);
                  const color = t.type === 'income' ? Colors.income : cat?.color ?? Colors.expense;
                  return (
                    <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: color + '22',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name={(cat?.icon as never) ?? 'pricetag'} size={14} color={color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppText size={13} weight="medium">
                          {t.merchant || cat?.name}
                        </AppText>
                        <AppText size={11} color={Colors.textMuted}>
                          {new Date(t.date).toLocaleDateString()}
                        </AppText>
                      </View>
                      <AppText size={13} weight="semiBold" color={t.type === 'income' ? Colors.income : Colors.text}>
                        {t.type === 'income' ? '+' : '-'}
                        {formatCurrency(t.amount, t.currency)}
                      </AppText>
                    </View>
                  );
                })}
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </View>
  );
}

function SummaryBox({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: color + '15',
        borderRadius: Radius.lg,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: color + '44',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name={icon} size={14} color={color} />
        <AppText size={10} color={color} weight="semiBold" style={{ letterSpacing: 1 }}>
          {label}
        </AppText>
      </View>
      <AppText weight="bold" size={20} color={color} style={{ marginTop: 6 }}>
        {formatCurrency(value)}
      </AppText>
    </View>
  );
}

// Keep Pressable referenced for future extension
void Pressable;
