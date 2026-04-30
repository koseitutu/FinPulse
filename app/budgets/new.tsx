import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, formatCompact, useScaledFont, useTheme } from '@/constants/theme';
import { AppText, Button, Empty, IconButton } from '@/components/ui';
import { useActiveTransactions, useAppStore } from '@/store/useAppStore';
import { filterMonth } from '@/utils/finance';

export default function NewBudgetScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  useTheme();
  const scaled = useScaledFont();
  const categories = useAppStore((s) => s.categories);
  const txs = useActiveTransactions();
  const currency = useAppStore((s) => s.preferences.currency);

  const [query, setQuery] = useState('');

  const spendByParent = useMemo(() => {
    const now = new Date();
    const monthTx = filterMonth(txs, now.getFullYear(), now.getMonth());
    const map = new Map<string, number>();
    monthTx
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const cat = categories.find((c) => c.id === t.categoryId);
        const parentId = cat?.parentId ?? t.categoryId;
        map.set(parentId, (map.get(parentId) ?? 0) + t.amount);
      });
    return map;
  }, [txs, categories]);

  const { withoutBudget, withBudget } = useMemo(() => {
    const parents = categories.filter((c) => !c.parentId && c.type === 'expense');
    const q = query.trim().toLowerCase();
    const filtered = q
      ? parents.filter((c) => c.name.toLowerCase().includes(q))
      : parents;
    return {
      withoutBudget: filtered.filter((c) => !c.budget || c.budget <= 0),
      withBudget: filtered.filter((c) => c.budget && c.budget > 0),
    };
  }, [categories, query]);

  const noCategories = categories.filter((c) => !c.parentId && c.type === 'expense').length === 0;

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
        <IconButton icon="close" onPress={() => router.back()} />
        <AppText weight="semiBold" size={16}>
          New budget
        </AppText>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md }}>
        <AppText size={13} color={Colors.textMuted} style={{ marginBottom: 14 }}>
          Choose a category to set a monthly spending limit.
        </AppText>

        {/* Search */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: Colors.surface,
            borderWidth: 1,
            borderColor: Colors.border,
            borderRadius: Radius.md,
            paddingHorizontal: 14,
          }}
        >
          <Ionicons name="search" size={16} color={Colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search categories"
            placeholderTextColor={Colors.textDim}
            style={{
              flex: 1,
              color: Colors.text,
              fontFamily: 'Inter_500Medium',
              fontSize: scaled(14),
              paddingVertical: 12,
            }}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={10}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingTop: 0,
          paddingBottom: insets.bottom + 40,
          gap: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        {noCategories ? (
          <Empty
            icon="pricetags"
            title="No expense categories"
            subtitle="Create one first to assign a budget."
            action={
              <Button
                label="Manage categories"
                icon="pricetags"
                onPress={() => {
                  router.back();
                  router.push('/categories');
                }}
              />
            }
          />
        ) : null}

        {withoutBudget.length > 0 ? (
          <View style={{ gap: 8 }}>
            <AppText
              size={11}
              color={Colors.textMuted}
              weight="semiBold"
              style={{ letterSpacing: 1 }}
            >
              WITHOUT A BUDGET
            </AppText>
            {withoutBudget.map((c) => (
              <CategoryPickerRow
                key={c.id}
                name={c.name}
                icon={c.icon}
                color={c.color}
                subtitle={
                  (spendByParent.get(c.id) ?? 0) > 0
                    ? `${formatCompact(spendByParent.get(c.id) ?? 0, currency)} spent this month`
                    : 'No spending yet'
                }
                onPress={() =>
                  router.replace({ pathname: '/budgets/[id]', params: { id: c.id } })
                }
              />
            ))}
          </View>
        ) : null}

        {withBudget.length > 0 ? (
          <View style={{ gap: 8 }}>
            <AppText
              size={11}
              color={Colors.textMuted}
              weight="semiBold"
              style={{ letterSpacing: 1 }}
            >
              ALREADY BUDGETED
            </AppText>
            {withBudget.map((c) => (
              <CategoryPickerRow
                key={c.id}
                name={c.name}
                icon={c.icon}
                color={c.color}
                subtitle={`Current: ${formatCompact(c.budget ?? 0, currency)}/mo`}
                tag="Edit"
                onPress={() =>
                  router.replace({ pathname: '/budgets/[id]', params: { id: c.id } })
                }
              />
            ))}
          </View>
        ) : null}

        {!noCategories && withoutBudget.length === 0 && withBudget.length === 0 ? (
          <View
            style={{
              padding: Spacing.xl,
              backgroundColor: Colors.surface,
              borderRadius: Radius.lg,
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Ionicons name="search" size={24} color={Colors.textMuted} />
            <AppText weight="semiBold" size={14}>
              No matches
            </AppText>
            <AppText size={12} color={Colors.textMuted}>
              Try a different search term.
            </AppText>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function CategoryPickerRow({
  name,
  icon,
  color,
  subtitle,
  tag,
  onPress,
}: {
  name: string;
  icon: string;
  color: string;
  subtitle: string;
  tag?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.borderSubtle,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 14,
          backgroundColor: color + '22',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon as never} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText weight="semiBold" size={14}>
          {name}
        </AppText>
        <AppText size={12} color={Colors.textMuted} style={{ marginTop: 2 }}>
          {subtitle}
        </AppText>
      </View>
      {tag ? (
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: Radius.pill,
            backgroundColor: Colors.surfaceAlt,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <AppText size={10} weight="semiBold" color={Colors.textSecondary}>
            {tag.toUpperCase()}
          </AppText>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </Pressable>
  );
}
