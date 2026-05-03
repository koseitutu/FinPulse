import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, Switch, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, useScaledFont, useTheme } from '@/constants/theme';
import { AppText, Card, IconButton, SectionHeader } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import type { FontScale } from '@/store/types';

const CURRENCIES = ['GHS', 'USD', 'EUR', 'GBP', 'NGN'];
const RETENTIONS: (3 | 6 | 12 | 24)[] = [3, 6, 12, 24];

const FONT_SIZES: { key: FontScale; label: string; preview: number }[] = [
  { key: 'small', label: 'Small', preview: 12 },
  { key: 'medium', label: 'Medium', preview: 14 },
  { key: 'large', label: 'Large', preview: 17 },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const themeMode = useTheme();
  const preferences = useAppStore((s) => s.preferences);
  const setPreferences = useAppStore((s) => s.setPreferences);
  const setAlerts = useAppStore((s) => s.setAlerts);
  const archiveConfig = useAppStore((s) => s.archiveConfig);
  const setAutoArchive = useAppStore((s) => s.setAutoArchive);
  const transactions = useAppStore((s) => s.transactions);
  const categories = useAppStore((s) => s.categories);
  const accounts = useAppStore((s) => s.accounts);
  const archiveOld = useAppStore((s) => s.archiveOld);

  const [name, setName] = useState(preferences.name);
  const [pin, setPin] = useState(preferences.pin ?? '');
  const [archiveMsg, setArchiveMsg] = useState<string | null>(null);
  const scaled = useScaledFont();
  const fontScale: FontScale = preferences.fontScale ?? 'medium';

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
        <Card tone="purple">
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
              fontSize: scaled(16),
              paddingVertical: 6,
            }}
          />
        </Card>

        <Card tone="amber">
          <SectionHeader title="Appearance" subtitle="Light or dark, your call" />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 6,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: Colors.goldSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name={themeMode === 'dark' ? 'moon' : 'sunny'}
                  size={18}
                  color={Colors.gold}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppText size={14} weight="semiBold" color={Colors.text}>
                  Dark mode
                </AppText>
                <AppText size={11} color={Colors.textMuted}>
                  {themeMode === 'dark'
                    ? 'Easy on the eyes at night'
                    : 'Crisp and bright by day'}
                </AppText>
              </View>
            </View>
            <Switch
              value={themeMode === 'dark'}
              onValueChange={(v) => setPreferences({ theme: v ? 'dark' : 'light' })}
              trackColor={{ true: Colors.gold, false: Colors.surfaceHigh }}
              thumbColor={Colors.bgElevated}
            />
          </View>
        </Card>

        <Card tone="teal">
          <SectionHeader
            title="Font size"
            subtitle="Scales every text in the app. Changes apply instantly."
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {FONT_SIZES.map((opt) => {
              const active = fontScale === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setPreferences({ fontScale: opt.key })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${opt.label} font size`}
                  style={{
                    flex: 1,
                    minHeight: 64,
                    paddingVertical: Spacing.md,
                    paddingHorizontal: Spacing.sm,
                    borderRadius: Radius.md,
                    backgroundColor: active ? Colors.gold + '22' : Colors.surface,
                    borderWidth: 1,
                    borderColor: active ? Colors.gold : Colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  <AppText
                    weight="bold"
                    size={opt.preview}
                    color={active ? Colors.gold : Colors.text}
                  >
                    Aa
                  </AppText>
                  <AppText
                    size={11}
                    weight="semiBold"
                    color={active ? Colors.gold : Colors.textSecondary}
                  >
                    {opt.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          <View
            style={{
              marginTop: Spacing.md,
              padding: Spacing.md,
              borderRadius: Radius.md,
              backgroundColor: Colors.surface,
              borderWidth: 1,
              borderColor: Colors.borderSubtle,
              gap: 4,
            }}
          >
            <AppText
              size={10}
              weight="semiBold"
              color={Colors.textMuted}
              style={{ letterSpacing: 1 }}
            >
              PREVIEW
            </AppText>
            <AppText weight="bold" size={18}>
              The quick brown fox jumps
            </AppText>
            <AppText size={13} color={Colors.textSecondary}>
              Over the lazy dog. This preview updates live to show how the selected size looks in
              everyday copy.
            </AppText>
          </View>
        </Card>

        <Card tone="blue">
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
          <AppText size={11} color={Colors.textMuted} style={{ marginTop: 10, lineHeight: 16 }}>
            Each account keeps its own currency · the dashboard total sums only accounts in your
            preferred currency.
          </AppText>
        </Card>

        <Card tone="coral">
          <SectionHeader title="Security" subtitle="Protect your data" />
          <AppText size={11} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1, marginBottom: 6 }}>
            PIN CODE (4–6 DIGITS)
          </AppText>
          <TextInput
            value={pin}
            onChangeText={(v) => {
              const digits = v.replace(/[^0-9]/g, '').slice(0, 6);
              setPin(digits);
              setPreferences({ pin: digits || undefined });
            }}
            placeholder="Not set"
            placeholderTextColor={Colors.textDim}
            keyboardType="number-pad"
            secureTextEntry
            style={{
              color: Colors.text,
              fontFamily: 'Inter_600SemiBold',
              fontSize: scaled(16),
              paddingVertical: 8,
              letterSpacing: 4,
            }}
          />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 10,
              borderTopWidth: 1,
              borderTopColor: Colors.borderSubtle,
              marginTop: 8,
            }}
          >
            <View style={{ flex: 1 }}>
              <AppText size={14} color={Colors.text}>
                Biometric unlock
              </AppText>
              <AppText size={11} color={Colors.textMuted}>
                Use Face ID / Touch ID when available
              </AppText>
            </View>
            <Switch
              value={preferences.biometric ?? false}
              onValueChange={(v) => setPreferences({ biometric: v })}
              trackColor={{ true: Colors.gold, false: Colors.surfaceHigh }}
              thumbColor={Colors.bgElevated}
            />
          </View>
        </Card>

        <Card tone="teal">
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
            last
          />
        </Card>

        <Card tone="purple">
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
                  {m === 3 ? '3 months' : m === 6 ? '6 months' : m === 12 ? '1 year' : '2 years'}
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

        <Card tone="blue">
          <SectionHeader title="Manage data" subtitle="Backup, restore, CSV and records" />
          <View style={{ gap: 2 }}>
            <Link href="/data" asChild>
              <Pressable
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 12,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    backgroundColor: Colors.info + '22',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="cloud-upload" size={16} color={Colors.info} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText size={14} weight="semiBold">
                    Backup & Restore
                  </AppText>
                  <AppText size={11} color={Colors.textMuted}>
                    Full JSON backup · CSV import/export · {transactions.length} transactions
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </Pressable>
            </Link>
            <View style={{ height: 1, backgroundColor: Colors.borderSubtle }} />
            <Link href="/accounts" asChild>
              <Pressable
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 12,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    backgroundColor: Colors.gold + '22',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="wallet" size={16} color={Colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText size={14} weight="semiBold">
                    Accounts
                  </AppText>
                  <AppText size={11} color={Colors.textMuted}>
                    {accounts.length} accounts · Add, edit, delete
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </Pressable>
            </Link>
            <View style={{ height: 1, backgroundColor: Colors.borderSubtle }} />
            <Link href="/categories" asChild>
              <Pressable
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 12,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    backgroundColor: '#2EC4B622',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="pricetags" size={16} color="#2EC4B6" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText size={14} weight="semiBold">
                    Categories
                  </AppText>
                  <AppText size={11} color={Colors.textMuted}>
                    {categories.filter((c) => !c.parentId).length} top-level categories
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </Pressable>
            </Link>
          </View>
        </Card>

        <Card tone="amber">
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
