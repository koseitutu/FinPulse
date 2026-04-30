import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, Switch, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { AppText, Card, IconButton, SectionHeader } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { buildCSV, downloadWeb, parseCSV, shareText } from '@/utils/export';
import type { Transaction, TxType } from '@/store/types';

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
  const accounts = useAppStore((s) => s.accounts);
  const archiveOld = useAppStore((s) => s.archiveOld);
  const addTransactions = useAppStore((s) => s.addTransactions);
  const setExchangeRates = useAppStore((s) => s.setExchangeRates);
  const exchangeRates = useAppStore((s) => s.exchangeRates);
  const lastRatesFetch = useAppStore((s) => s.lastRatesFetch);

  const [name, setName] = useState(preferences.name);
  const [pin, setPin] = useState(preferences.pin ?? '');
  const [archiveMsg, setArchiveMsg] = useState<string | null>(null);
  const [exportMsg, setExportMsg] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [ratesMsg, setRatesMsg] = useState<string | null>(null);

  const storageSize = useStorageSize();

  const handleArchive = () => {
    const n = archiveOld(archiveConfig.autoArchiveMonths);
    setArchiveMsg(`Archived ${n} transactions.`);
    setTimeout(() => setArchiveMsg(null), 3000);
  };

  const handleExportCSV = async () => {
    try {
      const csv = buildCSV(transactions, categories);
      const filename = `finpulse-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
      if (Platform.OS === 'web') {
        downloadWeb(filename, csv, 'text/csv');
      } else {
        await shareText(filename, csv.slice(0, 3000));
      }
      setExportMsg(`Exported ${transactions.length} transactions.`);
      setTimeout(() => setExportMsg(null), 3000);
    } catch {
      setExportMsg('Export failed.');
      setTimeout(() => setExportMsg(null), 3000);
    }
  };

  const handleImportCSV = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', '.csv', '*/*'],
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.[0]) return;
      const asset = res.assets[0];
      let text = '';
      if (Platform.OS === 'web' && asset.file) {
        text = await asset.file.text();
      } else if (asset.uri) {
        const r = await fetch(asset.uri);
        text = await r.text();
      }
      if (!text) {
        setImportMsg('Could not read file.');
        setTimeout(() => setImportMsg(null), 3000);
        return;
      }
      const rows = parseCSV(text);
      if (rows.length < 2) {
        setImportMsg('CSV is empty.');
        setTimeout(() => setImportMsg(null), 3000);
        return;
      }
      const header = rows[0].map((h) => h.trim().toLowerCase());
      const col = (name: string) => header.indexOf(name);
      const iDate = col('date');
      const iType = col('type');
      const iAmount = col('amount');
      const iCurrency = col('currency');
      const iCategory = col('category');
      const iMerchant = col('merchant');
      const iNotes = col('notes');

      const defaultAccount = accounts[0]?.id;
      if (!defaultAccount) {
        setImportMsg('Create an account first.');
        setTimeout(() => setImportMsg(null), 3000);
        return;
      }

      const imported: Omit<Transaction, 'id'>[] = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r.length || !r[iAmount]) continue;
        const amt = parseFloat(r[iAmount] ?? '0');
        if (isNaN(amt) || amt <= 0) continue;
        const typeRaw = (r[iType] ?? 'expense').toLowerCase();
        const type: TxType = typeRaw === 'income' ? 'income' : 'expense';
        const catName = (r[iCategory] ?? '').trim().toLowerCase();
        const cat = categories.find(
          (c) => !c.parentId && c.type === type && c.name.toLowerCase() === catName
        ) ?? categories.find((c) => !c.parentId && c.type === type);
        if (!cat) continue;
        const dateStr = r[iDate] ?? '';
        const parsed = dateStr ? new Date(dateStr) : new Date();
        const date = isNaN(parsed.getTime()) ? new Date() : parsed;
        imported.push({
          amount: amt,
          currency: (r[iCurrency] ?? preferences.currency).toUpperCase(),
          type,
          categoryId: cat.id,
          tagIds: [],
          date: date.toISOString(),
          notes: r[iNotes] || undefined,
          accountId: defaultAccount,
          merchant: r[iMerchant] || undefined,
        });
      }
      if (imported.length === 0) {
        setImportMsg('No valid rows found.');
        setTimeout(() => setImportMsg(null), 3000);
        return;
      }
      addTransactions(imported);
      setImportMsg(`Imported ${imported.length} transactions.`);
      setTimeout(() => setImportMsg(null), 4000);
    } catch (e) {
      console.warn('Import failed', e);
      setImportMsg('Import failed.');
      setTimeout(() => setImportMsg(null), 3000);
    }
  };

  const handleRefreshRates = async () => {
    try {
      setRatesMsg('Fetching…');
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      if (data?.rates) {
        const keep: Record<string, number> = {};
        CURRENCIES.forEach((c) => {
          if (typeof data.rates[c] === 'number') keep[c] = data.rates[c];
        });
        if (data.rates.USD) keep.USD = 1;
        if (Object.keys(keep).length > 0) {
          setExchangeRates({ ...exchangeRates, ...keep });
          setRatesMsg('Rates updated.');
        } else {
          setRatesMsg('No rates received.');
        }
      } else {
        setRatesMsg('Failed to fetch rates.');
      }
    } catch {
      setRatesMsg('Failed to fetch rates.');
    }
    setTimeout(() => setRatesMsg(null), 3500);
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
          <SectionHeader
            title="Exchange rates"
            subtitle={
              lastRatesFetch
                ? `Last fetched ${new Date(lastRatesFetch).toLocaleDateString()}`
                : 'Fetch latest rates'
            }
          />
          <View style={{ gap: 8 }}>
            {CURRENCIES.map((c) => (
              <View
                key={c}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 6,
                }}
              >
                <AppText size={13} color={Colors.textSecondary}>
                  1 USD = {c}
                </AppText>
                <TextInput
                  value={String(exchangeRates[c] ?? '')}
                  onChangeText={(v) => {
                    const n = parseFloat(v);
                    if (!isNaN(n)) setExchangeRates({ ...exchangeRates, [c]: n });
                  }}
                  keyboardType="decimal-pad"
                  style={{
                    color: Colors.text,
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 13,
                    backgroundColor: Colors.surface,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    minWidth: 110,
                    textAlign: 'right',
                  }}
                />
              </View>
            ))}
          </View>
          <Pressable
            onPress={handleRefreshRates}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              justifyContent: 'center',
              backgroundColor: Colors.gold,
              paddingVertical: 12,
              borderRadius: Radius.md,
              marginTop: Spacing.md,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons name="refresh" size={16} color={Colors.bg} />
            <AppText weight="semiBold" color={Colors.bg}>
              Refresh from API
            </AppText>
          </Pressable>
          {ratesMsg ? (
            <AppText size={11} color={Colors.textSecondary} style={{ textAlign: 'center', marginTop: 8 }}>
              {ratesMsg}
            </AppText>
          ) : null}
        </Card>

        <Card>
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
              fontSize: 16,
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
            last
          />
        </Card>

        <Card>
          <SectionHeader
            title="Import & Export"
            subtitle="CSV format · Date, Type, Amount, Currency, Category, Subcategory, Merchant, Notes"
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={handleImportCSV}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: Colors.surface,
                borderWidth: 1,
                borderColor: Colors.border,
                paddingVertical: 12,
                borderRadius: Radius.md,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Ionicons name="cloud-upload" size={16} color={Colors.text} />
              <AppText weight="semiBold">Import CSV</AppText>
            </Pressable>
            <Pressable
              onPress={handleExportCSV}
              style={({ pressed }) => ({
                flex: 1,
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
              <Ionicons name="download" size={16} color={Colors.bg} />
              <AppText weight="semiBold" color={Colors.bg}>
                Export CSV
              </AppText>
            </Pressable>
          </View>
          {importMsg ? (
            <View
              style={{
                backgroundColor: Colors.info + '22',
                padding: 10,
                borderRadius: 8,
                marginTop: 10,
                flexDirection: 'row',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <Ionicons name="information-circle" size={14} color={Colors.info} />
              <AppText size={12} color={Colors.info}>
                {importMsg}
              </AppText>
            </View>
          ) : null}
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
          <SectionHeader title="Manage data" subtitle="Accounts, categories & more" />
          <View style={{ gap: 2 }}>
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
    recurring: snap.recurring,
    categories: snap.categories,
    accounts: snap.accounts,
  });
  const bytes = new TextEncoder().encode(json).length;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
