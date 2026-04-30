import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, formatCompact, formatCurrency, useTheme } from '@/constants/theme';
import { AppText, Button, Card, Empty, IconButton } from '@/components/ui';
import { useArchivedTransactions, useAppStore } from '@/store/useAppStore';
import { formatDate } from '@/utils/finance';

export default function ArchiveScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  useTheme();
  const archived = useArchivedTransactions();
  const categories = useAppStore((s) => s.categories);
  const restoreTransaction = useAppStore((s) => s.restoreTransaction);
  const archiveConfig = useAppStore((s) => s.archiveConfig);
  const archiveOld = useAppStore((s) => s.archiveOld);

  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return archived;
    return archived.filter((t) => {
      const cat = categories.find((c) => c.id === t.categoryId);
      return (
        t.notes?.toLowerCase().includes(q) ||
        t.merchant?.toLowerCase().includes(q) ||
        cat?.name.toLowerCase().includes(q)
      );
    });
  }, [archived, query, categories]);

  const total = archived.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);

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
          Archive
        </AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120, gap: Spacing.lg }}>
        <Card tone="blue">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: Colors.info + '22',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="archive" size={20} color={Colors.info} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText size={11} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1 }}>
                ARCHIVED TRANSACTIONS
              </AppText>
              <AppText weight="bold" size={20}>
                {archived.length}
              </AppText>
              <AppText size={12} color={Colors.textMuted}>
                Net {formatCompact(total)} total
              </AppText>
            </View>
            <Button
              label="Archive now"
              icon="archive"
              small
              variant="secondary"
              onPress={() => archiveOld(archiveConfig.autoArchiveMonths)}
            />
          </View>
        </Card>

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
            placeholder="Search archived…"
            placeholderTextColor={Colors.textDim}
            style={{ flex: 1, color: Colors.text, paddingVertical: 12, fontFamily: 'Inter_400Regular', fontSize: 14 }}
          />
        </View>

        {filtered.length === 0 ? (
          <Empty
            icon="archive"
            title="No archived data"
            subtitle={`Set retention threshold in Settings to archive transactions older than ${archiveConfig.autoArchiveMonths} months.`}
          />
        ) : (
          <View style={{ gap: 8 }}>
            {filtered.map((t) => {
              const cat = categories.find((c) => c.id === t.categoryId);
              const color = t.type === 'income' ? Colors.income : cat?.color ?? Colors.expense;
              return (
                <View
                  key={t.id}
                  style={{
                    backgroundColor: Colors.surface,
                    borderRadius: Radius.md,
                    padding: Spacing.md,
                    borderWidth: 1,
                    borderColor: Colors.borderSubtle,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: color + '22',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name={(cat?.icon as never) ?? 'pricetag'} size={16} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText size={13} weight="semiBold">
                      {t.merchant || cat?.name}
                    </AppText>
                    <AppText size={11} color={Colors.textMuted}>
                      {formatDate(t.date)}
                    </AppText>
                  </View>
                  <AppText size={13} weight="semiBold" color={t.type === 'income' ? Colors.income : Colors.text}>
                    {t.type === 'income' ? '+' : '-'}
                    {formatCurrency(t.amount, t.currency)}
                  </AppText>
                  <Pressable onPress={() => restoreTransaction(t.id)} hitSlop={8} style={{ padding: 4 }}>
                    <Ionicons name="arrow-undo" size={16} color={Colors.gold} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
