import React, { useMemo } from 'react';
import { Alert, Platform, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, formatCompact, useTheme } from '@/constants/theme';
import { AppText, Button, Empty, IconButton } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { formatRelative } from '@/utils/finance';
import type { Transfer } from '@/store/types';

export default function TransfersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  useTheme();
  const transfers = useAppStore((s) => s.transfers);
  const accounts = useAppStore((s) => s.accounts);
  const deleteTransfer = useAppStore((s) => s.deleteTransfer);

  const accountMap = useMemo(() => {
    const m = new Map(accounts.map((a) => [a.id, a]));
    return m;
  }, [accounts]);

  // Grouped by month label
  const groups = useMemo(() => {
    const map = new Map<string, Transfer[]>();
    transfers.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, items]) => {
        const [year, month] = key.split('-').map(Number);
        const label = new Date(year, month - 1, 1).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        });
        return { key, label, items };
      });
  }, [transfers]);

  // Quick stats: this month
  const thisMonthTotal = useMemo(() => {
    const now = new Date();
    return transfers
      .filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      })
      .reduce((acc, t) => acc + t.fromAmount, 0);
  }, [transfers]);

  const handleUndo = (t: Transfer) => {
    const from = accountMap.get(t.fromAccountId);
    const to = accountMap.get(t.toAccountId);
    const label = `${from?.name ?? 'Account'} → ${to?.name ?? 'Account'}`;
    const run = () => deleteTransfer(t.id);
    if (Platform.OS === 'web') {
      run();
      return;
    }
    Alert.alert(
      'Undo transfer?',
      `Reverse "${label}" for ${formatCompact(t.fromAmount, t.fromCurrency)}? Balances will be restored.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Undo', style: 'destructive', onPress: run },
      ]
    );
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
          Transfers
        </AppText>
        <IconButton
          icon="add"
          background={Colors.gold}
          color={Colors.bg}
          onPress={() => router.push('/transfers/new')}
        />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingTop: 0,
          paddingBottom: insets.bottom + 120,
          gap: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
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
              right: -40,
              top: -40,
              width: 180,
              height: 180,
              borderRadius: 90,
              backgroundColor: Colors.info + '15',
            }}
          />
          <AppText
            size={11}
            weight="semiBold"
            color={Colors.textMuted}
            style={{ letterSpacing: 1.2 }}
          >
            MOVED THIS MONTH
          </AppText>
          <AppText
            weight="bold"
            size={32}
            style={{ marginTop: 6, fontVariant: ['tabular-nums'] }}
          >
            {formatCompact(thisMonthTotal)}
          </AppText>
          <AppText size={12} color={Colors.textMuted} style={{ marginTop: 4 }}>
            Across {transfers.filter((t) => {
              const d = new Date(t.date);
              const now = new Date();
              return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
            }).length} transfers
          </AppText>

          <Pressable
            onPress={() => router.push('/transfers/new')}
            style={({ pressed }) => ({
              marginTop: Spacing.lg,
              backgroundColor: Colors.gold,
              paddingVertical: 12,
              borderRadius: Radius.md,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons name="swap-horizontal" size={16} color={Colors.bg} />
            <AppText weight="semiBold" size={14} color={Colors.bg}>
              New transfer
            </AppText>
          </Pressable>
        </View>

        {transfers.length === 0 ? (
          <Empty
            icon="swap-horizontal"
            title="No transfers yet"
            subtitle="Move money between your accounts. Transfers adjust both balances automatically."
            action={
              <Button
                label="Make first transfer"
                icon="add"
                onPress={() => router.push('/transfers/new')}
              />
            }
          />
        ) : null}

        {groups.map((group) => (
          <View key={group.key} style={{ gap: 10 }}>
            <AppText
              size={11}
              color={Colors.textMuted}
              weight="semiBold"
              style={{ letterSpacing: 1 }}
            >
              {group.label.toUpperCase()} · {group.items.length}
            </AppText>
            {group.items.map((t) => (
              <TransferRow
                key={t.id}
                transfer={t}
                fromName={accountMap.get(t.fromAccountId)?.name ?? 'Unknown'}
                fromIcon={accountMap.get(t.fromAccountId)?.icon ?? 'wallet'}
                fromColor={accountMap.get(t.fromAccountId)?.color ?? Colors.textMuted}
                toName={accountMap.get(t.toAccountId)?.name ?? 'Unknown'}
                toIcon={accountMap.get(t.toAccountId)?.icon ?? 'wallet'}
                toColor={accountMap.get(t.toAccountId)?.color ?? Colors.textMuted}
                onUndo={() => handleUndo(t)}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function TransferRow({
  transfer,
  fromName,
  fromIcon,
  fromColor,
  toName,
  toIcon,
  toColor,
  onUndo,
}: {
  transfer: Transfer;
  fromName: string;
  fromIcon: string;
  fromColor: string;
  toName: string;
  toIcon: string;
  toColor: string;
  onUndo: () => void;
}) {
  const crossCurrency = transfer.fromCurrency !== transfer.toCurrency;

  return (
    <View
      style={{
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.borderSubtle,
        gap: 12,
        borderCurve: 'continuous',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {/* From chip */}
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: Colors.bgElevated,
            paddingHorizontal: 10,
            paddingVertical: 8,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: Colors.borderSubtle,
          }}
        >
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              backgroundColor: fromColor + '22',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={fromIcon as never} size={13} color={fromColor} />
          </View>
          <AppText size={12} weight="semiBold" numberOfLines={1} style={{ flex: 1 }}>
            {fromName}
          </AppText>
        </View>

        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: Colors.gold + '22',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="arrow-forward" size={14} color={Colors.gold} />
        </View>

        {/* To chip */}
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: Colors.bgElevated,
            paddingHorizontal: 10,
            paddingVertical: 8,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: Colors.borderSubtle,
          }}
        >
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              backgroundColor: toColor + '22',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={toIcon as never} size={13} color={toColor} />
          </View>
          <AppText size={12} weight="semiBold" numberOfLines={1} style={{ flex: 1 }}>
            {toName}
          </AppText>
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View>
          <AppText
            weight="bold"
            size={18}
            style={{ fontVariant: ['tabular-nums'] }}
            selectable
          >
            {formatCompact(transfer.fromAmount, transfer.fromCurrency)}
          </AppText>
          {crossCurrency ? (
            <AppText size={11} color={Colors.info} weight="medium">
              → {formatCompact(transfer.toAmount, transfer.toCurrency)}
            </AppText>
          ) : null}
          <AppText size={11} color={Colors.textMuted} style={{ marginTop: 2 }}>
            {formatRelative(transfer.date)}
            {transfer.notes ? ` · ${transfer.notes}` : ''}
          </AppText>
        </View>
        <Pressable
          onPress={onUndo}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: Radius.pill,
            backgroundColor: Colors.bgElevated,
            borderWidth: 1,
            borderColor: Colors.border,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Ionicons name="arrow-undo" size={12} color={Colors.textSecondary} />
          <AppText size={11} weight="semiBold" color={Colors.textSecondary}>
            Undo
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}
