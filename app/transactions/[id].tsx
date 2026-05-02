import React from 'react';
import { Alert, Platform, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, formatCurrency, useTheme } from '@/constants/theme';
import { AppText, Card, IconButton, IconCircle } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { formatDate } from '@/utils/finance';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  useTheme();

  const tx = useAppStore((s) => s.transactions.find((t) => t.id === id));
  const categories = useAppStore((s) => s.categories);
  const accounts = useAppStore((s) => s.accounts);
  const tags = useAppStore((s) => s.tags);
  const deleteTransaction = useAppStore((s) => s.deleteTransaction);

  if (!tx) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <AppText color={Colors.textMuted}>Transaction not found.</AppText>
      </View>
    );
  }

  const cat = categories.find((c) => c.id === tx.categoryId);
  const sub = tx.subcategoryId ? categories.find((c) => c.id === tx.subcategoryId) : null;
  const acc = accounts.find((a) => a.id === tx.accountId);
  const color = tx.type === 'income' ? Colors.income : cat?.color ?? Colors.expense;

  const handleEdit = () => {
    router.push({ pathname: '/transactions/edit', params: { editId: tx.id } });
  };

  const handleDelete = () => {
    const doDelete = () => {
      deleteTransaction(tx.id);
      router.back();
    };
    if (Platform.OS === 'web') {
      doDelete();
      return;
    }
    Alert.alert('Delete transaction?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, paddingTop: insets.top }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: Spacing.lg,
        }}
      >
        <IconButton icon="close" onPress={() => router.back()} />
        <AppText weight="semiBold" size={16}>
          Transaction
        </AppText>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <IconButton icon="pencil" color={Colors.gold} onPress={handleEdit} />
          <IconButton icon="trash" color={Colors.expense} onPress={handleDelete} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 120 }}>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: color + '22',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={(cat?.icon as never) ?? 'pricetag'} size={36} color={color} />
          </View>
          <AppText weight="bold" size={16} color={Colors.textSecondary}>
            {tx.merchant || cat?.name}
          </AppText>
          <AppText
            weight="bold"
            size={36}
            color={tx.type === 'income' ? Colors.income : Colors.text}
            style={{ fontVariant: ['tabular-nums'] }}
            selectable
          >
            {tx.type === 'income' ? '+' : '-'}
            {formatCurrency(tx.amount, tx.currency)}
          </AppText>
          <AppText size={12} color={Colors.textMuted}>
            {formatDate(tx.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </AppText>
        </View>

        <Card tone="purple">
          <Row label="Type" value={tx.type === 'income' ? 'Income' : 'Expense'} />
          <Row label="Category" value={cat?.name ?? '-'} icon={cat?.icon as never} iconColor={cat?.color} />
          {sub ? <Row label="Subcategory" value={sub.name} icon={sub.icon as never} iconColor={sub.color} /> : null}
          <Row label="Account" value={acc?.name ?? '-'} icon={acc?.icon as never} iconColor={acc?.color} />
          {tx.isRecurring ? <Row label="Recurring" value="Yes" /> : null}
        </Card>

        {tx.tagIds.length > 0 ? (
          <Card tone="teal">
            <AppText size={11} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1, marginBottom: 8 }}>
              TAGS
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {tx.tagIds.map((tid) => {
                const tag = tags.find((t) => t.id === tid);
                if (!tag) return null;
                return (
                  <View
                    key={tid}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: Radius.pill,
                      backgroundColor: tag.color + '22',
                    }}
                  >
                    <AppText size={11} weight="medium" color={tag.color}>
                      #{tag.name}
                    </AppText>
                  </View>
                );
              })}
            </View>
          </Card>
        ) : null}

        {tx.notes ? (
          <Card tone="amber">
            <AppText size={11} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1, marginBottom: 8 }}>
              NOTES
            </AppText>
            <AppText size={14} color={Colors.textSecondary} selectable>
              {tx.notes}
            </AppText>
          </Card>
        ) : null}

      </ScrollView>
    </View>
  );
}

function Row({
  label,
  value,
  icon,
  iconColor,
}: {
  label: string;
  value: string;
  icon?: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  iconColor?: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomColor: Colors.borderSubtle,
        borderBottomWidth: 1,
      }}
    >
      <AppText size={13} color={Colors.textMuted}>
        {label}
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {icon ? <IconCircle icon={icon} color={iconColor ?? Colors.gold} size={24} /> : null}
        <AppText size={14} weight="semiBold">
          {value}
        </AppText>
      </View>
    </View>
  );
}

// Using Pressable from react-native for basic usage (no-op marker for tree-shake)
void Pressable;
