import React, { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, formatCompact, formatCurrency } from '@/constants/theme';
import {
  AppText,
  Badge,
  Button,
  Card,
  Chip,
  Empty,
  IconButton,
  ProgressBar,
  SectionHeader,
} from '@/components/ui';
import { useActiveTransactions, useAppStore } from '@/store/useAppStore';
import { daysInMonth, filterMonth, forecast, monthName } from '@/utils/finance';
import type { Category } from '@/store/types';

type Filter = 'all' | 'on-track' | 'warning' | 'over' | 'unbudgeted';

interface BudgetRow {
  category: Category;
  spent: number;
  budget: number;
  pct: number;
  status: 'on-track' | 'warning' | 'over';
}

export default function BudgetsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const categories = useAppStore((s) => s.categories);
  const txs = useActiveTransactions();
  const currency = useAppStore((s) => s.preferences.currency);
  const updateCategory = useAppStore((s) => s.updateCategory);

  const [filter, setFilter] = useState<Filter>('all');
  const [monthOffset, setMonthOffset] = useState(0);

  const now = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const monthTx = useMemo(
    () => filterMonth(txs, now.getFullYear(), now.getMonth()),
    [txs, now]
  );

  const expenseTx = useMemo(() => monthTx.filter((t) => t.type === 'expense'), [monthTx]);

  const spendByParent = useMemo(() => {
    const map = new Map<string, number>();
    expenseTx.forEach((t) => {
      const cat = categories.find((c) => c.id === t.categoryId);
      const parentId = cat?.parentId ?? t.categoryId;
      map.set(parentId, (map.get(parentId) ?? 0) + t.amount);
    });
    return map;
  }, [expenseTx, categories]);

  const parents = useMemo(
    () => categories.filter((c) => !c.parentId && c.type === 'expense'),
    [categories]
  );

  const budgeted: BudgetRow[] = useMemo(() => {
    return parents
      .filter((c) => c.budget && c.budget > 0)
      .map((c) => {
        const spent = spendByParent.get(c.id) ?? 0;
        const budget = c.budget ?? 0;
        const pct = budget > 0 ? (spent / budget) * 100 : 0;
        const status: BudgetRow['status'] = pct > 100 ? 'over' : pct >= 80 ? 'warning' : 'on-track';
        return { category: c, spent, budget, pct, status };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [parents, spendByParent]);

  const unbudgeted = useMemo(
    () =>
      parents
        .filter((c) => !c.budget || c.budget <= 0)
        .map((c) => ({
          category: c,
          spent: spendByParent.get(c.id) ?? 0,
        }))
        .sort((a, b) => b.spent - a.spent),
    [parents, spendByParent]
  );

  const filtered = useMemo(() => {
    if (filter === 'unbudgeted') return [];
    if (filter === 'all') return budgeted;
    return budgeted.filter((r) => r.status === filter);
  }, [budgeted, filter]);

  // Totals
  const totalBudget = budgeted.reduce((a, b) => a + b.budget, 0);
  const totalSpent = budgeted.reduce((a, b) => a + b.spent, 0);
  const totalPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const remaining = totalBudget - totalSpent;

  const isCurrentMonth = monthOffset === 0;
  const dayCount = daysInMonth(now.getFullYear(), now.getMonth());
  const today = new Date();
  const dayOfMonth = isCurrentMonth ? today.getDate() : dayCount;
  const projected = isCurrentMonth ? forecast(totalSpent, dayOfMonth, dayCount) : totalSpent;

  const counts = useMemo(
    () => ({
      all: budgeted.length,
      'on-track': budgeted.filter((b) => b.status === 'on-track').length,
      warning: budgeted.filter((b) => b.status === 'warning').length,
      over: budgeted.filter((b) => b.status === 'over').length,
      unbudgeted: unbudgeted.length,
    }),
    [budgeted, unbudgeted]
  );

  const handleClearBudget = (id: string, name: string) => {
    const clear = () => updateCategory(id, { budget: undefined });
    if (Platform.OS === 'web') {
      clear();
      return;
    }
    Alert.alert('Remove budget?', `"${name}" will no longer have a monthly limit.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: clear },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, paddingTop: insets.top }}>
      {/* Header */}
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
          Budgets
        </AppText>
        <IconButton
          icon="add"
          background={Colors.gold}
          color={Colors.bg}
          onPress={() => router.push('/budgets/new')}
        />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.lg,
          paddingBottom: insets.bottom + 120,
          gap: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Month switcher + hero */}
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
              right: -50,
              top: -50,
              width: 200,
              height: 200,
              borderRadius: 100,
              backgroundColor:
                totalPct > 100
                  ? Colors.expense + '18'
                  : totalPct >= 80
                  ? Colors.warn + '18'
                  : Colors.income + '18',
            }}
          />

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Pressable
              onPress={() => setMonthOffset((o) => o - 1)}
              hitSlop={10}
              style={({ pressed }) => ({
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: Colors.surface,
                borderWidth: 1,
                borderColor: Colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Ionicons name="chevron-back" size={16} color={Colors.textSecondary} />
            </Pressable>
            <View style={{ alignItems: 'center' }}>
              <AppText
                size={11}
                weight="semiBold"
                color={Colors.textMuted}
                style={{ letterSpacing: 1.5 }}
              >
                {isCurrentMonth ? 'THIS MONTH' : 'MONTH'}
              </AppText>
              <AppText weight="bold" size={16} style={{ marginTop: 2 }}>
                {monthName(now.getMonth())} {now.getFullYear()}
              </AppText>
            </View>
            <Pressable
              onPress={() => setMonthOffset((o) => Math.min(0, o + 1))}
              disabled={monthOffset >= 0}
              hitSlop={10}
              style={({ pressed }) => ({
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: Colors.surface,
                borderWidth: 1,
                borderColor: Colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: monthOffset >= 0 ? 0.3 : pressed ? 0.6 : 1,
              })}
            >
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <View style={{ marginTop: Spacing.xl, alignItems: 'center' }}>
            <AppText size={11} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1 }}>
              {remaining >= 0 ? 'REMAINING' : 'OVER BUDGET'}
            </AppText>
            <AppText
              weight="bold"
              size={40}
              color={remaining >= 0 ? Colors.text : Colors.expense}
              style={{ fontVariant: ['tabular-nums'], marginTop: 4 }}
              selectable
            >
              {formatCurrency(Math.abs(remaining), currency)}
            </AppText>
            <AppText size={12} color={Colors.textMuted} style={{ marginTop: 4 }}>
              of {formatCompact(totalBudget, currency)} budgeted · {formatCompact(totalSpent, currency)} spent
            </AppText>
          </View>

          {totalBudget > 0 ? (
            <View style={{ marginTop: Spacing.lg }}>
              <ProgressBar
                value={totalSpent}
                max={totalBudget}
                color={totalPct > 100 ? Colors.expense : totalPct >= 80 ? Colors.warn : Colors.income}
                height={10}
                showOverflow
              />
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 8,
                }}
              >
                <AppText size={11} color={Colors.textMuted}>
                  {totalPct.toFixed(0)}% used
                </AppText>
                {isCurrentMonth ? (
                  <AppText size={11} color={Colors.textMuted}>
                    Projected: {formatCompact(projected, currency)}
                  </AppText>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>

        {/* Summary chips */}
        {budgeted.length > 0 ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <SummaryPill
              label="On track"
              count={counts['on-track']}
              color={Colors.income}
              icon="checkmark-circle"
            />
            <SummaryPill
              label="Warning"
              count={counts.warning}
              color={Colors.warn}
              icon="alert-circle"
            />
            <SummaryPill
              label="Over"
              count={counts.over}
              color={Colors.expense}
              icon="flame"
            />
          </View>
        ) : null}

        {/* Filter tabs */}
        {budgeted.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingRight: Spacing.lg }}
          >
            <Chip
              label={`All · ${counts.all}`}
              active={filter === 'all'}
              onPress={() => setFilter('all')}
            />
            <Chip
              label={`On track · ${counts['on-track']}`}
              color={Colors.income}
              active={filter === 'on-track'}
              onPress={() => setFilter('on-track')}
            />
            <Chip
              label={`Warning · ${counts.warning}`}
              color={Colors.warn}
              active={filter === 'warning'}
              onPress={() => setFilter('warning')}
            />
            <Chip
              label={`Over · ${counts.over}`}
              color={Colors.expense}
              active={filter === 'over'}
              onPress={() => setFilter('over')}
            />
            {counts.unbudgeted > 0 ? (
              <Chip
                label={`Unbudgeted · ${counts.unbudgeted}`}
                color={Colors.info}
                active={filter === 'unbudgeted'}
                onPress={() => setFilter('unbudgeted')}
              />
            ) : null}
          </ScrollView>
        ) : null}

        {/* Empty state */}
        {budgeted.length === 0 && unbudgeted.length === 0 ? (
          <Empty
            icon="speedometer"
            title="No categories yet"
            subtitle="Create expense categories first, then set a monthly budget for each."
            action={
              <Button
                label="Manage categories"
                icon="pricetags"
                onPress={() => router.push('/categories')}
              />
            }
          />
        ) : null}

        {budgeted.length === 0 && unbudgeted.length > 0 ? (
          <Empty
            icon="speedometer"
            title="No budgets set"
            subtitle="Set monthly spending limits on your categories to stay on track."
            action={
              <Button
                label="Create a budget"
                icon="add"
                onPress={() => router.push('/budgets/new')}
              />
            }
          />
        ) : null}

        {/* Budget list */}
        {filter !== 'unbudgeted' && filtered.length > 0 ? (
          <View style={{ gap: 12 }}>
            <SectionHeader
              title="Category budgets"
              subtitle={
                isCurrentMonth
                  ? `Day ${dayOfMonth} of ${dayCount}`
                  : `Final for ${monthName(now.getMonth())}`
              }
            />
            {filtered.map((row) => (
              <BudgetCard
                key={row.category.id}
                row={row}
                currency={currency}
                onPress={() => router.push({ pathname: '/budgets/[id]', params: { id: row.category.id } })}
                onClear={() => handleClearBudget(row.category.id, row.category.name)}
              />
            ))}
          </View>
        ) : null}

        {/* Empty filter */}
        {filter !== 'unbudgeted' &&
        filter !== 'all' &&
        filtered.length === 0 &&
        budgeted.length > 0 ? (
          <View
            style={{
              padding: Spacing.xl,
              backgroundColor: Colors.surface,
              borderRadius: Radius.lg,
              borderWidth: 1,
              borderColor: Colors.borderSubtle,
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Ionicons
              name={
                filter === 'on-track'
                  ? 'checkmark-circle-outline'
                  : filter === 'warning'
                  ? 'alert-circle-outline'
                  : 'flame-outline'
              }
              size={28}
              color={Colors.textMuted}
            />
            <AppText weight="semiBold" size={14}>
              Nothing here
            </AppText>
            <AppText size={12} color={Colors.textMuted} style={{ textAlign: 'center' }}>
              No budgets match this filter for {monthName(now.getMonth())}.
            </AppText>
          </View>
        ) : null}

        {/* Unbudgeted list */}
        {(filter === 'unbudgeted' || (filter === 'all' && unbudgeted.length > 0)) ? (
          <View style={{ gap: 12, marginTop: filter === 'all' ? Spacing.md : 0 }}>
            <SectionHeader
              title="Without a budget"
              subtitle="Set a monthly limit to track these"
            />
            {unbudgeted.map(({ category, spent }) => (
              <Pressable
                key={category.id}
                onPress={() =>
                  router.push({ pathname: '/budgets/[id]', params: { id: category.id } })
                }
                style={({ pressed }) => ({
                  backgroundColor: Colors.surface,
                  borderRadius: Radius.lg,
                  padding: Spacing.md,
                  borderWidth: 1,
                  borderColor: Colors.borderSubtle,
                  borderStyle: 'dashed',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: category.color + '22',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={category.icon as never} size={18} color={category.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText weight="semiBold" size={14}>
                    {category.name}
                  </AppText>
                  <AppText size={11} color={Colors.textMuted}>
                    {spent > 0
                      ? `${formatCompact(spent, currency)} spent · no limit`
                      : 'No spending yet'}
                  </AppText>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    backgroundColor: Colors.gold + '22',
                    borderRadius: Radius.pill,
                  }}
                >
                  <Ionicons name="add" size={12} color={Colors.gold} />
                  <AppText size={11} weight="semiBold" color={Colors.gold}>
                    Set budget
                  </AppText>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* Tips card */}
        {budgeted.length > 0 && isCurrentMonth ? (
          <Card
            style={{
              backgroundColor: Colors.surfaceAlt,
              flexDirection: 'row',
              gap: 12,
              alignItems: 'flex-start',
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: Colors.info + '22',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="bulb" size={18} color={Colors.info} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText weight="semiBold" size={13}>
                Daily allowance
              </AppText>
              <AppText size={12} color={Colors.textSecondary}>
                You can spend up to{' '}
                <AppText size={12} weight="bold" color={Colors.gold}>
                  {formatCompact(
                    Math.max(0, remaining) / Math.max(1, dayCount - dayOfMonth + 1),
                    currency
                  )}
                </AppText>{' '}
                per day for the rest of {monthName(now.getMonth())} to stay on track.
              </AppText>
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </View>
  );
}

function SummaryPill({
  label,
  count,
  color,
  icon,
}: {
  label: string;
  count: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.borderSubtle,
        gap: 6,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name={icon} size={14} color={color} />
        <AppText size={11} color={Colors.textMuted} weight="medium">
          {label}
        </AppText>
      </View>
      <AppText
        weight="bold"
        size={22}
        color={count > 0 ? color : Colors.textDim}
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {count}
      </AppText>
    </View>
  );
}

function BudgetCard({
  row,
  currency,
  onPress,
  onClear,
}: {
  row: BudgetRow;
  currency: string;
  onPress: () => void;
  onClear: () => void;
}) {
  const { category, spent, budget, pct, status } = row;
  const color =
    status === 'over' ? Colors.expense : status === 'warning' ? Colors.warn : category.color;
  const remaining = budget - spent;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: status === 'over' ? Colors.expense + '55' : Colors.borderSubtle,
        opacity: pressed ? 0.85 : 1,
        gap: 12,
        borderCurve: 'continuous',
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: category.color + '22',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={category.icon as never} size={20} color={category.color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <AppText weight="bold" size={15}>
              {category.name}
            </AppText>
            {status === 'over' ? (
              <Badge text="Over" color={Colors.expense} />
            ) : status === 'warning' ? (
              <Badge text="80%+" color={Colors.warn} />
            ) : null}
          </View>
          <AppText
            size={12}
            color={Colors.textMuted}
            style={{ fontVariant: ['tabular-nums'], marginTop: 2 }}
          >
            {formatCompact(spent, currency)} of {formatCompact(budget, currency)}
          </AppText>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <AppText
            weight="bold"
            size={18}
            color={color}
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {pct.toFixed(0)}%
          </AppText>
          <AppText
            size={11}
            color={remaining < 0 ? Colors.expense : Colors.textMuted}
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {remaining < 0 ? '−' : ''}
            {formatCompact(Math.abs(remaining), currency)} {remaining < 0 ? 'over' : 'left'}
          </AppText>
        </View>
      </View>

      <ProgressBar value={spent} max={budget} color={color} height={8} showOverflow />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => ({
            flex: 1,
            paddingVertical: 8,
            borderRadius: Radius.md,
            backgroundColor: Colors.bgElevated,
            borderWidth: 1,
            borderColor: Colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="create-outline" size={13} color={Colors.textSecondary} />
          <AppText size={12} weight="semiBold" color={Colors.textSecondary}>
            Edit
          </AppText>
        </Pressable>
        <Pressable
          onPress={onClear}
          style={({ pressed }) => ({
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: Radius.md,
            backgroundColor: Colors.bgElevated,
            borderWidth: 1,
            borderColor: Colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="close-circle-outline" size={13} color={Colors.textMuted} />
          <AppText size={12} weight="semiBold" color={Colors.textMuted}>
            Remove
          </AppText>
        </Pressable>
      </View>
    </Pressable>
  );
}
