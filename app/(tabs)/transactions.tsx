import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, formatCompact, formatCurrency, useScaledFont, useTheme } from '@/constants/theme';
import { AppText, Chip, Empty, IconButton } from '@/components/ui';
import { useActiveTransactions, useAppStore } from '@/store/useAppStore';
import { formatRelative } from '@/utils/finance';

type FilterType = 'all' | 'income' | 'expense';

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  useTheme();
  const scaled = useScaledFont();
  const txs = useActiveTransactions();
  const categories = useAppStore((s) => s.categories);
  const accounts = useAppStore((s) => s.accounts);
  const tags = useAppStore((s) => s.tags);

  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return txs
      .filter((t) => (filterType === 'all' ? true : t.type === filterType))
      .filter((t) => (activeTag ? t.tagIds.includes(activeTag) : true))
      .filter((t) => {
        if (!q) return true;
        const cat = categories.find((c) => c.id === t.categoryId);
        return (
          t.notes?.toLowerCase().includes(q) ||
          t.merchant?.toLowerCase().includes(q) ||
          cat?.name.toLowerCase().includes(q)
        );
      });
  }, [txs, filterType, activeTag, query, categories]);

  // group by date
  const sections = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    filtered.forEach((t) => {
      const key = new Date(t.date).toDateString();
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    });
    return Array.from(map.entries()).map(([date, items]) => ({
      date,
      items,
      total: items.reduce((a, t) => a + (t.type === 'income' ? t.amount : -t.amount), 0),
    }));
  }, [filtered]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, paddingTop: insets.top }}>
      <View style={{ padding: Spacing.lg, gap: Spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <AppText weight="bold" size={24}>
              Activity
            </AppText>
            <AppText size={12} color={Colors.textMuted}>
              {filtered.length} transactions
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <IconButton icon="search" onPress={() => router.push('/search')} />
            <IconButton
              icon="add"
              background={Colors.gold}
              color={Colors.bg}
              onPress={() => router.push('/transactions/new')}
            />
          </View>
        </View>

        {/* Search */}
        <View
          style={{
            backgroundColor: Colors.surface,
            borderRadius: Radius.md,
            borderWidth: 1,
            borderColor: Colors.border,
            paddingHorizontal: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Ionicons name="search" size={16} color={Colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search notes, merchants, categories…"
            placeholderTextColor={Colors.textDim}
            style={{
              flex: 1,
              color: Colors.text,
              paddingVertical: 12,
              fontFamily: 'Inter_400Regular',
              fontSize: scaled(14),
            }}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {/* Type filter */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip label="All" active={filterType === 'all'} onPress={() => setFilterType('all')} />
          <Chip
            label="Income"
            icon="arrow-down"
            color={Colors.income}
            active={filterType === 'income'}
            onPress={() => setFilterType('income')}
          />
          <Chip
            label="Expense"
            icon="arrow-up"
            color={Colors.expense}
            active={filterType === 'expense'}
            onPress={() => setFilterType('expense')}
          />
        </View>

        {/* Tags */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={tags}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <Chip
              label={`#${item.name}`}
              color={item.color}
              active={activeTag === item.id}
              onPress={() => setActiveTag(activeTag === item.id ? null : item.id)}
            />
          )}
        />
      </View>

      {sections.length === 0 ? (
        <Empty icon="receipt" title="No transactions" subtitle="Try adjusting your filters or add a new transaction." />
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(s) => s.date}
          contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: Spacing.lg }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={{ marginBottom: Spacing.lg }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <AppText size={11} weight="semiBold" color={Colors.textMuted} style={{ letterSpacing: 1 }}>
                  {formatRelative(item.items[0].date).toUpperCase()} · {new Date(item.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                </AppText>
                <AppText
                  size={11}
                  weight="semiBold"
                  color={item.total >= 0 ? Colors.income : Colors.expense}
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {item.total >= 0 ? '+' : ''}
                  {formatCompact(item.total)}
                </AppText>
              </View>
              <View
                style={{
                  backgroundColor: Colors.surface,
                  borderRadius: Radius.lg,
                  borderWidth: 1,
                  borderColor: Colors.borderSubtle,
                  overflow: 'hidden',
                }}
              >
                {item.items.map((t, idx) => {
                  const cat = categories.find((c) => c.id === t.categoryId);
                  const sub = t.subcategoryId ? categories.find((c) => c.id === t.subcategoryId) : null;
                  const acc = accounts.find((a) => a.id === t.accountId);
                  const color = t.type === 'income' ? Colors.income : cat?.color ?? Colors.expense;
                  return (
                    <Link
                      key={t.id}
                      href={{ pathname: '/transactions/[id]', params: { id: t.id } }}
                      asChild
                    >
                      <Pressable
                        style={({ pressed }) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                          padding: Spacing.md,
                          borderTopWidth: idx === 0 ? 0 : 1,
                          borderTopColor: Colors.borderSubtle,
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: color + '22',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Ionicons name={(cat?.icon as never) ?? 'pricetag'} size={18} color={color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <AppText weight="semiBold" size={14}>
                              {t.merchant || cat?.name || 'Transaction'}
                            </AppText>
                            {t.isRecurring ? (
                              <Ionicons name="repeat" size={11} color={Colors.gold} />
                            ) : null}
                          </View>
                          <AppText size={11} color={Colors.textMuted}>
                            {cat?.name}
                            {sub ? ` · ${sub.name}` : ''}
                            {acc ? ` · ${acc.name}` : ''}
                          </AppText>
                          {t.tagIds.length > 0 ? (
                            <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
                              {t.tagIds.slice(0, 3).map((tid) => {
                                const tag = tags.find((x) => x.id === tid);
                                if (!tag) return null;
                                return (
                                  <View
                                    key={tid}
                                    style={{
                                      paddingHorizontal: 6,
                                      paddingVertical: 1,
                                      borderRadius: 4,
                                      backgroundColor: tag.color + '22',
                                    }}
                                  >
                                    <AppText size={9} weight="medium" color={tag.color}>
                                      #{tag.name}
                                    </AppText>
                                  </View>
                                );
                              })}
                            </View>
                          ) : null}
                        </View>
                        <AppText
                          weight="semiBold"
                          size={14}
                          color={t.type === 'income' ? Colors.income : Colors.text}
                          style={{ fontVariant: ['tabular-nums'] }}
                        >
                          {t.type === 'income' ? '+' : '-'}
                          {formatCurrency(t.amount, t.currency)}
                        </AppText>
                      </Pressable>
                    </Link>
                  );
                })}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
