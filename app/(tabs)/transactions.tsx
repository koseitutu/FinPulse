import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { Colors, Radius, Spacing, formatCompact, useScaledFont, useTheme } from '@/constants/theme';
import { AppText, Chip, Empty, IconButton } from '@/components/ui';
import { TransactionDivider, TransactionItem } from '@/components/transaction-item';
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
  const deleteTransactions = useAppStore((s) => s.deleteTransactions);

  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Multi-select state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const enterSelectMode = useCallback(() => {
    setSelectMode(true);
    setSelectedIds(new Set());
  }, []);

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

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

  const allFilteredIds = useMemo(() => filtered.map((t) => t.id), [filtered]);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedIds.has(id));

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allFilteredIds));
    }
  }, [allSelected, allFilteredIds]);

  const handleBulkDelete = useCallback(() => {
    const count = selectedIds.size;
    if (count === 0) return;

    const doDelete = () => {
      deleteTransactions(Array.from(selectedIds));
      exitSelectMode();
    };

    if (typeof window !== 'undefined' && typeof (window as Window & { confirm?: (msg: string) => boolean }).confirm === 'function') {
      // Web
      const ok = (window as Window & { confirm?: (msg: string) => boolean }).confirm?.(
        `Delete ${count} transaction${count === 1 ? '' : 's'}? This cannot be undone.`
      );
      if (ok) doDelete();
    } else {
      Alert.alert(
        `Delete ${count} Transaction${count === 1 ? '' : 's'}`,
        `Are you sure you want to permanently delete ${count} transaction${count === 1 ? '' : 's'}? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: `Delete (${count})`, style: 'destructive', onPress: doDelete },
        ]
      );
    }
  }, [selectedIds, deleteTransactions, exitSelectMode]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, paddingTop: insets.top }}>
      {/* Header */}
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
            {!selectMode ? (
              <>
                <Pressable
                  onPress={enterSelectMode}
                  style={({ pressed }) => ({
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: Radius.md,
                    backgroundColor: Colors.surface,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <AppText size={13} weight="semiBold" color={Colors.textSecondary}>
                    Select
                  </AppText>
                </Pressable>
                <IconButton icon="search" onPress={() => router.push('/search')} />
                <IconButton
                  icon="add"
                  background={Colors.gold}
                  color={Colors.bg}
                  onPress={() => router.push('/transactions/new')}
                />
              </>
            ) : (
              <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}
                style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}
              >
                <Pressable
                  onPress={toggleSelectAll}
                  style={({ pressed }) => ({
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: Radius.md,
                    backgroundColor: allSelected ? Colors.gold + '22' : Colors.surface,
                    borderWidth: 1,
                    borderColor: allSelected ? Colors.gold : Colors.border,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <AppText size={13} weight="semiBold" color={allSelected ? Colors.gold : Colors.textSecondary}>
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </AppText>
                </Pressable>
                <Pressable
                  onPress={exitSelectMode}
                  style={({ pressed }) => ({
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: Radius.md,
                    backgroundColor: Colors.surface,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <AppText size={13} weight="semiBold" color={Colors.textSecondary}>
                    Cancel
                  </AppText>
                </Pressable>
              </Animated.View>
            )}
          </View>
        </View>

        {/* Search — hidden in select mode */}
        {!selectMode && (
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
        )}

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
          contentContainerStyle={{ paddingBottom: selectMode ? 140 : 120, paddingHorizontal: Spacing.lg }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Animated.View layout={LinearTransition} style={{ marginBottom: Spacing.lg }}>
              {/* Date header */}
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

              {/* Transaction cards with dividers */}
              <View
                style={{
                  backgroundColor: Colors.surface,
                  borderRadius: Radius.lg,
                  borderCurve: 'continuous',
                  borderWidth: 1,
                  borderColor: Colors.border,
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}
              >
                {item.items.map((t, idx) => {
                  const cat = categories.find((c) => c.id === t.categoryId);
                  const sub = t.subcategoryId ? categories.find((c) => c.id === t.subcategoryId) : null;
                  const acc = accounts.find((a) => a.id === t.accountId);
                  const tagItems = t.tagIds.map((tid) => tags.find((x) => x.id === tid)).filter(Boolean) as typeof tags;

                  return (
                    <React.Fragment key={t.id}>
                      {idx > 0 && <TransactionDivider />}
                      <TransactionItem
                        transaction={t}
                        category={cat}
                        subcategory={sub ?? undefined}
                        account={acc}
                        tags={tagItems}
                        selectMode={selectMode}
                        isSelected={selectedIds.has(t.id)}
                        onLongPress={enterSelectMode}
                        onPress={selectMode ? () => toggleSelect(t.id) : undefined}
                        noLink={selectMode}
                        grouped
                        renderBelow={
                          tagItems.length > 0 ? (
                            <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
                              {tagItems.slice(0, 3).map((tag) => (
                                <View
                                  key={tag.id}
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
                              ))}
                            </View>
                          ) : undefined
                        }
                      />
                    </React.Fragment>
                  );
                })}
              </View>
            </Animated.View>
          )}
        />
      )}

      {/* Bulk delete bottom bar */}
      {selectMode && (
        <Animated.View
          entering={SlideInDown.springify().damping(20).stiffness(200)}
          exiting={SlideOutDown.duration(200)}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingBottom: insets.bottom + Spacing.md,
            paddingHorizontal: Spacing.lg,
            paddingTop: Spacing.md,
            backgroundColor: Colors.surface,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
            gap: Spacing.sm,
            boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
          }}
        >
          {/* Selection count label */}
          <AppText size={12} color={Colors.textMuted} style={{ textAlign: 'center' }}>
            {selectedIds.size === 0
              ? 'Tap transactions to select'
              : `${selectedIds.size} transaction${selectedIds.size === 1 ? '' : 's'} selected`}
          </AppText>

          {/* Delete button */}
          <Pressable
            onPress={handleBulkDelete}
            disabled={selectedIds.size === 0}
            style={({ pressed }) => ({
              backgroundColor: selectedIds.size === 0 ? Colors.border : '#FF3B30',
              borderRadius: Radius.md,
              paddingVertical: 14,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Ionicons name="trash" size={16} color={selectedIds.size === 0 ? Colors.textMuted : '#fff'} />
            <AppText
              weight="semiBold"
              size={15}
              color={selectedIds.size === 0 ? Colors.textMuted : '#fff'}
            >
              {selectedIds.size === 0 ? 'Delete' : `Delete (${selectedIds.size})`}
            </AppText>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}
