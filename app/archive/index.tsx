import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, formatCompact, useScaledFont, useTheme } from '@/constants/theme';
import { AppText, Button, Card, Empty, IconButton } from '@/components/ui';
import { useArchivedTransactions, useAppStore } from '@/store/useAppStore';
import { formatDate } from '@/utils/finance';
import { TransactionItem } from '@/components/transaction-item';

export default function ArchiveScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  useTheme();
  const scaled = useScaledFont();
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
            style={{ flex: 1, color: Colors.text, paddingVertical: 12, fontFamily: 'Inter_400Regular', fontSize: scaled(14) }}
          />
        </View>

        {filtered.length === 0 ? (
          <Empty
            icon="archive"
            title="No archived data"
            subtitle={`Set retention threshold in Settings to archive transactions older than ${archiveConfig.autoArchiveMonths} months.`}
          />
        ) : (
          <View
            style={{
              backgroundColor: Colors.surface,
              borderRadius: Radius.lg,
              borderWidth: 1,
              borderColor: Colors.borderSubtle,
              overflow: 'hidden',
            }}
          >
            {filtered.map((t, idx) => {
              const cat = categories.find((c) => c.id === t.categoryId);
              return (
                <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <TransactionItem
                      transaction={t}
                      category={cat}
                      showSeparator={idx > 0}
                      noLink
                      dateLabel={formatDate(t.date)}
                    />
                  </View>
                  <Pressable
                    onPress={() => restoreTransaction(t.id)}
                    hitSlop={8}
                    style={{ paddingRight: Spacing.md, paddingLeft: 4 }}
                  >
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
