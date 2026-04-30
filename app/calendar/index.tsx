import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, formatCompact, formatCurrency } from '@/constants/theme';
import { AppText, Card, IconButton } from '@/components/ui';
import { useActiveTransactions, useAppStore } from '@/store/useAppStore';
import { daysInMonth, filterMonth, monthName } from '@/utils/finance';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const txs = useActiveTransactions();
  const categories = useAppStore((s) => s.categories);
  const accounts = useAppStore((s) => s.accounts);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const monthTx = useMemo(() => filterMonth(txs, year, month), [txs, year, month]);
  const days = daysInMonth(year, month);
  const firstDay = new Date(year, month, 1).getDay();

  const dailyTotals = useMemo(() => {
    const arr = new Array(days).fill(0);
    monthTx
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const d = new Date(t.date).getDate() - 1;
        if (d >= 0) arr[d] += t.amount;
      });
    return arr;
  }, [monthTx, days]);

  const max = Math.max(...dailyTotals, 1);
  const monthSpent = dailyTotals.reduce((a, b) => a + b, 0);

  const changeMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const dayColor = (amount: number) => {
    if (amount === 0) return Colors.surface;
    const ratio = amount / max;
    if (ratio < 0.33) return Colors.income + '55';
    if (ratio < 0.66) return Colors.gold + '55';
    return Colors.expense + '55';
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  const selectedTx = selectedDay
    ? monthTx.filter((t) => new Date(t.date).getDate() === selectedDay)
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, paddingTop: insets.top }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: Spacing.lg,
        }}
      >
        <IconButton icon="chevron-back" onPress={() => router.back()} />
        <AppText weight="semiBold" size={16}>
          Calendar
        </AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120, gap: Spacing.lg }}>
        {/* Month selector */}
        <Card>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: Spacing.md,
            }}
          >
            <IconButton icon="chevron-back" size={32} onPress={() => changeMonth(-1)} />
            <View style={{ alignItems: 'center' }}>
              <AppText weight="bold" size={18}>
                {monthName(month)} {year}
              </AppText>
              <AppText size={11} color={Colors.textMuted}>
                {formatCurrency(monthSpent)} total spent
              </AppText>
            </View>
            <IconButton icon="chevron-forward" size={32} onPress={() => changeMonth(1)} />
          </View>

          {/* Weekday row */}
          <View style={{ flexDirection: 'row' }}>
            {WEEKDAYS.map((w, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                <AppText size={10} color={Colors.textMuted} weight="semiBold">
                  {w}
                </AppText>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
            {cells.map((d, i) => {
              if (d === null) {
                return <View key={i} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
              }
              const amount = dailyTotals[d - 1];
              const isToday =
                d === now.getDate() && month === now.getMonth() && year === now.getFullYear();
              return (
                <Pressable
                  key={i}
                  onPress={() => setSelectedDay(d)}
                  style={{
                    width: `${100 / 7}%`,
                    aspectRatio: 1,
                    padding: 2,
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: dayColor(amount),
                      borderRadius: 8,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: isToday ? 1.5 : 0,
                      borderColor: Colors.gold,
                    }}
                  >
                    <AppText size={13} weight={isToday ? 'bold' : 'medium'}>
                      {d}
                    </AppText>
                    {amount > 0 ? (
                      <AppText size={9} color={Colors.textSecondary} style={{ marginTop: 2 }}>
                        {formatCompact(amount).split(' ')[1]}
                      </AppText>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Legend */}
        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
          {[
            { c: Colors.income + '55', l: 'Low spending' },
            { c: Colors.gold + '55', l: 'Moderate' },
            { c: Colors.expense + '55', l: 'High' },
            { c: Colors.surface, l: 'No activity' },
          ].map((x) => (
            <View key={x.l} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: x.c, borderWidth: 1, borderColor: Colors.border }} />
              <AppText size={11} color={Colors.textSecondary}>
                {x.l}
              </AppText>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Day sheet */}
      <Modal visible={selectedDay !== null} transparent animationType="slide" onRequestClose={() => setSelectedDay(null)}>
        <Pressable
          onPress={() => setSelectedDay(null)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: Colors.bgElevated,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: Spacing.xl,
              paddingBottom: insets.bottom + Spacing.xl,
              maxHeight: '70%',
            }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: Colors.textDim,
                alignSelf: 'center',
                marginBottom: Spacing.md,
              }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <AppText weight="bold" size={20}>
                  {monthName(month)} {selectedDay}
                </AppText>
                <AppText size={12} color={Colors.textMuted}>
                  {selectedTx.length} transactions
                </AppText>
              </View>
              <AppText weight="bold" size={18} color={Colors.expense}>
                {formatCurrency(selectedTx.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0))}
              </AppText>
            </View>
            <ScrollView style={{ marginTop: Spacing.md }}>
              {selectedTx.length === 0 ? (
                <AppText size={13} color={Colors.textMuted} style={{ textAlign: 'center', paddingVertical: Spacing.xl }}>
                  No activity on this day.
                </AppText>
              ) : (
                selectedTx.map((t) => {
                  const cat = categories.find((c) => c.id === t.categoryId);
                  const acc = accounts.find((a) => a.id === t.accountId);
                  const color = t.type === 'income' ? Colors.income : cat?.color ?? Colors.expense;
                  return (
                    <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }}>
                      <View
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 17,
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
                          {acc?.name}
                        </AppText>
                      </View>
                      <AppText size={13} weight="semiBold" color={t.type === 'income' ? Colors.income : Colors.text}>
                        {t.type === 'income' ? '+' : '-'}
                        {formatCurrency(t.amount, t.currency)}
                      </AppText>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
