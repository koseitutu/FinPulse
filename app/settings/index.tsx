import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, Switch, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { AppText, Card, IconButton, SectionHeader } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { buildCSV, downloadWeb, shareFileNative } from '@/utils/export';

const CURRENCIES = ['GHS', 'USD', 'EUR', 'GBP', 'NGN'];
const RETENTIONS: (6 | 12 | 24)[] = [6, 12, 24];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const preferences = useAppStore((s) => s.preferences);
  const setPreferences = useAppStore((s) => s.setPreferences);
  const setAlerts = useAppStore((s) => s.setAlerts);
  const archiveConfig = useAppStore((s) => s.archiveConfig);
  const setAutoArchive = useAppStore((s) => s.setAutoArchive);
  const transactions = useAppStore((s) => s.transactions);
  const categories = useAppStore((s) => s.categories);
  const archiveOld = useAppStore((s) => s.archiveOld);

  const [name, setName] = useState(preferences.name);
  const [archiveMsg, setArchiveMsg] = useState<string | null>(null);
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  const handleExportAllCSV = async () => {
    try {
      const csv = buildCSV(transactions, categories);
      const filename = `finpulse-all-transactions-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      if (Platform.OS === 'web') {
        downloadWeb(filename, csv, 'text/csv');
      } else {
        await shareFileNative(csv, filename, 'text/csv');
      }
      setExportMsg(`Exported ${transactions.length} transactions.`);
      setTimeout(() => setExportMsg(null), 3000);
    } catch {
      setExportMsg('Export failed.');
      setTimeout(() => setExportMsg(null), 3000);
    }
  };

  const storageSize = useStorageSize();

  const handleArchive = () => {
    const n = archiveOld(archiveConfig.autoArchiveMonths);
    setArchiveMsg(`Archived ${n} transactions.`);
    setTimeout(() => setArchiveMsg(null), 3000);
  };

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
          Settings
        </AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120, gap: Spacing.lg }}>
        <Card>
          <SectionHeader title="Profile" />
          <AppText size={11} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1 }}>
            NAME
          </AppText>
          <TextInput
            value={name}
            onChangeText={(v) => {
              setName(v);
              setPreferences({ name: v });
            }}
            style={{
              color: Colors.text,
              fontFamily: 'Inter_600SemiBold',
              fontSize: 16,
              paddingVertical: 6,
            }}
          />
        </Card>

        <Card>
          <SectionHeader title="Currency" subtitle="Display totals in your preferred currency" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CURRENCIES.map((c) => (
              <Pressable
                key={c}
                onPress={() => setPreferences({ currency: c })}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: Radius.md,
                  backgroundColor: preferences.currency === c ? Colors.gold + '22' : Colors.surface,
                  borderWidth: 1,
                  borderColor: preferences.currency === c ? Colors.gold : Colors.border,
                }}
              >
                <AppText size={13} weight="semiBold" color={preferences.currency === c ? Colors.gold : Colors.text}>
                  {c}
                </AppText>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card>
          <SectionHeader title="Smart Budget Alerts" subtitle="Push notifications about spending" />
          <AlertRow
            label="At 50% of budget"
            value={preferences.alerts.budget50}
            onChange={(v) => setAlerts({ budget50: v })}
          />
          <AlertRow
            label="At 80% of budget"
            value={preferences.alerts.budget80}
            onChange={(v) => setAlerts({ budget80: v })}
          />
          <AlertRow
            label="At 100% of budget"
            value={preferences.alerts.budget100}
            onChange={(v) => setAlerts({ budget100: v })}
          />
          <AlertRow
            label="Daily digest"
            value={preferences.alerts.dailyDigest}
            onChange={(v) => setAlerts({ dailyDigest: v })}
          />
          <AlertRow
            label="Weekly digest"
            value={preferences.alerts.weeklyDigest}
            onChange={(v) => setAlerts({ weeklyDigest: v })}
          />
          <AlertRow
            label="Debt due reminders"
            value={preferences.alerts.debtReminders}
            onChange={(v) => setAlerts({ debtReminders: v })}
            last
          />
        </Card>

        <Card>
          <SectionHeader title="Data retention" subtitle="Auto-archive older transactions" />
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: Spacing.md }}>
            {RETENTIONS.map((m) => (
              <Pressable
                key={m}
                onPress={() => setAutoArchive(m)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: Radius.md,
                  backgroundColor: archiveConfig.autoArchiveMonths === m ? Colors.gold + '22' : Colors.surface,
                  borderWidth: 1,
                  borderColor: archiveConfig.autoArchiveMonths === m ? Colors.gold : Colors.border,
                  alignItems: 'center',
                }}
              >
                <AppText weight="semiBold" size={14}>
                  {m === 6 ? '6 months' : m === 12 ? '1 year' : '2 years'}
                </AppText>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <Pressable
              onPress={handleArchive}
              style={{
                flex: 1,
                backgroundColor: Colors.gold,
                paddingVertical: 12,
                borderRadius: Radius.md,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="archive" size={16} color={Colors.bg} />
              <AppText weight="semiBold" color={Colors.bg}>
                Archive now
              </AppText>
            </Pressable>
            <Link href="/archive" asChild>
              <Pressable
                style={{
                  flex: 1,
                  backgroundColor: Colors.surface,
                  paddingVertical: 12,
                  borderRadius: Radius.md,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: Colors.border,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Ionicons name="folder-open" size={16} color={Colors.text} />
                <AppText weight="semiBold">Open archive</AppText>
              </Pressable>
            </Link>
          </View>
          {archiveMsg ? (
            <View
              style={{
                backgroundColor: Colors.income + '22',
                padding: 10,
                borderRadius: 8,
                marginTop: 10,
                flexDirection: 'row',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <Ionicons name="checkmark-circle" size={14} color={Colors.income} />
              <AppText size={12} color={Colors.income}>
                {archiveMsg}
              </AppText>
            </View>
          ) : null}
        </Card>

        <Card>
          <SectionHeader title="Storage" subtitle="Local-first · AsyncStorage" />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 6,
            }}
          >
            <AppText size={13} color={Colors.textSecondary}>
              Transactions
            </AppText>
            <AppText size={13} weight="semiBold">
              {transactions.length}
            </AppText>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 6,
            }}
          >
            <AppText size={13} color={Colors.textSecondary}>
              Data size
            </AppText>
            <AppText size={13} weight="semiBold">
              {storageSize}
            </AppText>
          </View>
          <View style={{ height: 8, backgroundColor: Colors.surfaceHigh, borderRadius: 4, marginTop: 8, overflow: 'hidden' }}>
            <View style={{ width: `${Math.min(100, transactions.length / 5)}%`, height: '100%', backgroundColor: Colors.gold }} />
          </View>
        </Card>

        <Card>
          <SectionHeader
            title="Export data"
            subtitle="Download all your transactions as CSV"
          />
          <Pressable
            onPress={handleExportAllCSV}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: Spacing.md,
              borderRadius: Radius.md,
              backgroundColor: Colors.gold + '15',
              borderWidth: 1,
              borderColor: Colors.gold + '55',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: Colors.gold + '33',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="download" size={18} color={Colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText weight="semiBold" size={14}>
                Export all transactions
              </AppText>
              <AppText size={11} color={Colors.textMuted}>
                {transactions.length} entries · CSV format
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.gold} />
          </Pressable>
          {exportMsg ? (
            <View
              style={{
                backgroundColor: Colors.income + '22',
                padding: 10,
                borderRadius: 8,
                marginTop: 10,
                flexDirection: 'row',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <Ionicons name="checkmark-circle" size={14} color={Colors.income} />
              <AppText size={12} color={Colors.income}>
                {exportMsg}
              </AppText>
            </View>
          ) : null}
        </Card>

        <Card>
          <SectionHeader title="Dashboard widgets" subtitle="Customize what you see first" />
          <Link href="/dashboard/settings" asChild>
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 12,
              }}
            >
              <Ionicons name="grid" size={18} color={Colors.gold} />
              <AppText size={14} weight="medium" style={{ flex: 1 }}>
                Manage dashboard widgets
              </AppText>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </Pressable>
          </Link>
        </Card>

        <AppText size={11} color={Colors.textDim} style={{ textAlign: 'center' }}>
          FinPulse · {Platform.OS} · v1.0
        </AppText>
      </ScrollView>
    </View>
  );
}

function AlertRow({
  label,
  value,
  onChange,
  last,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: Colors.borderSubtle,
      }}
    >
      <AppText size={14} color={Colors.text}>
        {label}
      </AppText>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: Colors.gold, false: Colors.surfaceHigh }} thumbColor={Colors.bgElevated} />
    </View>
  );
}

function useStorageSize() {
  const snap = useAppStore();
  const json = JSON.stringify({
    transactions: snap.transactions,
    goals: snap.savingsGoals,
    recurring: snap.recurring,
    debts: snap.debts,
  });
  const bytes = new TextEncoder().encode(json).length;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
