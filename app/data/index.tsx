import React, { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { Colors, Radius, Spacing, useTheme } from '@/constants/theme';
import { AppText, Card, IconButton, IconCircle, SectionHeader } from '@/components/ui';
import { useAppStore, type BackupData } from '@/store/useAppStore';
import { buildBackupJSON, parseBackupJSON, saveTextFile, backupFilename } from '@/utils/backup';
import { buildCSV, parseCSV } from '@/utils/export';
import type { Transaction, TxType } from '@/store/types';

type StatusKind = 'info' | 'success' | 'error';
type Status = { kind: StatusKind; message: string } | null;

const ICON_BY_KIND: Record<StatusKind, keyof typeof import('@expo/vector-icons').Ionicons.glyphMap> = {
  info: 'information-circle',
  success: 'checkmark-circle',
  error: 'alert-circle',
};

const getColorsByKind = (): Record<StatusKind, string> => ({
  info: Colors.info,
  success: Colors.income,
  error: Colors.expense,
});

export default function ManageDataScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  useTheme();
  const COLORS_BY_KIND = getColorsByKind();

  const preferences = useAppStore((s) => s.preferences);
  const accounts = useAppStore((s) => s.accounts);
  const categories = useAppStore((s) => s.categories);
  const tags = useAppStore((s) => s.tags);
  const transactions = useAppStore((s) => s.transactions);
  const recurring = useAppStore((s) => s.recurring);
  const transfers = useAppStore((s) => s.transfers);
  const dashboard = useAppStore((s) => s.dashboard);
  const archiveConfig = useAppStore((s) => s.archiveConfig);
  const addTransactions = useAppStore((s) => s.addTransactions);
  const restoreFromBackup = useAppStore((s) => s.restoreFromBackup);

  const [busy, setBusy] = useState<null | 'backup' | 'restore' | 'csv-export' | 'csv-import'>(null);
  const [status, setStatus] = useState<Status>(null);

  const storageSize = useMemo(() => {
    const json = JSON.stringify({
      preferences,
      accounts,
      categories,
      tags,
      transactions,
      recurring,
      transfers,
      dashboard,
      archiveConfig,
    });
    const bytes = new TextEncoder().encode(json).length;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }, [preferences, accounts, categories, tags, transactions, recurring, transfers, dashboard, archiveConfig]);

  const flash = (kind: StatusKind, message: string, ms = 4000) => {
    setStatus({ kind, message });
    setTimeout(() => setStatus(null), ms);
  };

  const handleBackup = async () => {
    if (busy) return;
    setBusy('backup');
    try {
      const json = buildBackupJSON({
        preferences,
        accounts,
        categories,
        tags,
        transactions,
        recurring,
        dashboard,
        archiveConfig,
      });
      const filename = backupFilename('json');
      const res = await saveTextFile(filename, json, 'application/json');
      if (res.ok) {
        flash('success', `Backup ready · ${filename}`);
      } else {
        flash('error', `Backup failed: ${res.error}`);
      }
    } catch (e) {
      flash('error', `Backup failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setBusy(null);
    }
  };

  const confirmRestore = (data: BackupData) =>
    new Promise<boolean>((resolve) => {
      const txCount = data.transactions?.length ?? 0;
      const accCount = data.accounts?.length ?? 0;
      const summary = `This will REPLACE all current data with:\n\n• ${accCount} accounts\n• ${txCount} transactions\n• ${data.categories?.length ?? 0} categories\n• ${data.recurring?.length ?? 0} recurring items\n\nExported ${new Date(data.exportedAt).toLocaleString()}.\n\nContinue?`;
      if (Platform.OS === 'web') {
        const ok = typeof window !== 'undefined' && window.confirm(summary);
        resolve(!!ok);
        return;
      }
      Alert.alert('Restore backup?', summary, [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Restore', style: 'destructive', onPress: () => resolve(true) },
      ]);
    });

  const readPickedFile = async (asset: DocumentPicker.DocumentPickerAsset): Promise<string> => {
    if (Platform.OS === 'web' && asset.file) {
      return asset.file.text();
    }
    if (!asset.uri) throw new Error('Selected file has no readable uri.');
    const res = await fetch(asset.uri);
    return res.text();
  };

  const handleRestore = async () => {
    if (busy) return;
    setBusy('restore');
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain', '.json', '*/*'],
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.[0]) {
        setBusy(null);
        return;
      }
      const text = await readPickedFile(res.assets[0]);
      if (!text.trim()) {
        flash('error', 'Selected file is empty.');
        return;
      }
      let data: BackupData;
      try {
        data = parseBackupJSON(text);
      } catch (e) {
        flash('error', `Invalid backup: ${e instanceof Error ? e.message : 'unknown error'}`);
        return;
      }
      const ok = await confirmRestore(data);
      if (!ok) {
        flash('info', 'Restore cancelled.');
        return;
      }
      restoreFromBackup(data);
      flash('success', `Restored ${data.transactions?.length ?? 0} transactions and all settings.`, 5000);
    } catch (e) {
      flash('error', `Restore failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setBusy(null);
    }
  };

  const handleExportCSV = async () => {
    if (busy) return;
    setBusy('csv-export');
    try {
      if (transactions.length === 0) {
        flash('info', 'No transactions to export.');
        return;
      }
      const csv = buildCSV(transactions, categories);
      const filename = `finpulse_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
      const res = await saveTextFile(filename, csv, 'text/csv');
      if (res.ok) {
        flash('success', `Exported ${transactions.length} transactions.`);
      } else {
        flash('error', `Export failed: ${res.error}`);
      }
    } catch (e) {
      flash('error', `Export failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setBusy(null);
    }
  };

  const handleImportCSV = async () => {
    if (busy) return;
    setBusy('csv-import');
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', '.csv', '*/*'],
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.[0]) {
        setBusy(null);
        return;
      }
      const text = await readPickedFile(res.assets[0]);
      if (!text.trim()) {
        flash('error', 'CSV file is empty.');
        return;
      }
      const rows = parseCSV(text);
      if (rows.length < 2) {
        flash('error', 'CSV has no data rows.');
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
        flash('error', 'Create an account before importing.');
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
        const cat =
          categories.find(
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
        flash('error', 'No valid rows found in CSV.');
        return;
      }
      addTransactions(imported);
      flash('success', `Imported ${imported.length} transactions.`, 5000);
    } catch (e) {
      flash('error', `Import failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setBusy(null);
    }
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
          Manage Data
        </AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: 120 + insets.bottom,
          gap: Spacing.lg,
        }}
      >
        <Card tone="purple">
          <SectionHeader
            title="Local storage"
            subtitle="Everything stays on this device until you export it."
          />
          <View style={{ flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' }}>
            <StatTile label="Accounts" value={accounts.length} />
            <StatTile label="Transactions" value={transactions.length} />
            <StatTile label="Categories" value={categories.filter((c) => !c.parentId).length} />
            <StatTile label="Recurring" value={recurring.length} />
            <StatTile label="Size" value={storageSize} />
          </View>
        </Card>

        <Card tone="blue">
          <SectionHeader
            title="Full backup"
            subtitle="Exports accounts, categories, transactions, budgets, recurring, and preferences as a single JSON file you can save anywhere."
          />
          <View style={{ gap: 10 }}>
            <ActionRow
              icon="cloud-upload-outline"
              color={Colors.gold}
              title="Back up everything"
              subtitle="Save a .json snapshot of all your data"
              onPress={handleBackup}
              loading={busy === 'backup'}
              disabled={!!busy && busy !== 'backup'}
              primary
            />
            <ActionRow
              icon="cloud-download-outline"
              color={Colors.info}
              title="Restore from backup"
              subtitle="Pick a previously exported FinPulse .json file"
              onPress={handleRestore}
              loading={busy === 'restore'}
              disabled={!!busy && busy !== 'restore'}
            />
          </View>
          <View
            style={{
              marginTop: Spacing.md,
              padding: 10,
              borderRadius: 8,
              backgroundColor: Colors.surfaceHigh,
              flexDirection: 'row',
              gap: 8,
              alignItems: 'flex-start',
            }}
          >
            <Ionicons name="warning" size={14} color={Colors.gold} style={{ marginTop: 2 }} />
            <AppText size={11} color={Colors.textSecondary} style={{ flex: 1, lineHeight: 16 }}>
              Restoring replaces every account, transaction, budget and setting in the app. Back up
              first if you want to keep what&apos;s here.
            </AppText>
          </View>
        </Card>

        <Card tone="teal">
          <SectionHeader
            title="Transactions CSV"
            subtitle="For spreadsheets or importing into other apps · Date, Type, Amount, Currency, Category, Subcategory, Merchant, Notes"
          />
          <View style={{ gap: 10 }}>
            <ActionRow
              icon="download-outline"
              color={Colors.income}
              title="Export transactions as CSV"
              subtitle={`${transactions.length} transactions`}
              onPress={handleExportCSV}
              loading={busy === 'csv-export'}
              disabled={!!busy && busy !== 'csv-export'}
            />
            <ActionRow
              icon="arrow-up-circle-outline"
              color={Colors.textSecondary}
              title="Import transactions from CSV"
              subtitle="Adds rows to your default account"
              onPress={handleImportCSV}
              loading={busy === 'csv-import'}
              disabled={!!busy && busy !== 'csv-import'}
            />
          </View>
        </Card>

        {status ? (
          <View
            style={{
              backgroundColor: COLORS_BY_KIND[status.kind] + '22',
              borderWidth: 1,
              borderColor: COLORS_BY_KIND[status.kind] + '55',
              padding: Spacing.md,
              borderRadius: Radius.md,
              flexDirection: 'row',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <Ionicons name={ICON_BY_KIND[status.kind]} size={18} color={COLORS_BY_KIND[status.kind]} />
            <AppText size={13} color={COLORS_BY_KIND[status.kind]} style={{ flex: 1 }}>
              {status.message}
            </AppText>
          </View>
        ) : null}

        <AppText size={11} color={Colors.textDim} style={{ textAlign: 'center', lineHeight: 16 }}>
          Backup schema v1 · Use the same format to move FinPulse to a new device.
        </AppText>
      </ScrollView>
    </View>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <View
      style={{
        flexGrow: 1,
        minWidth: 90,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: Radius.md,
        backgroundColor: Colors.surfaceHigh,
        borderWidth: 1,
        borderColor: Colors.borderSubtle,
      }}
    >
      <AppText size={10} weight="semiBold" color={Colors.textMuted} style={{ letterSpacing: 1 }}>
        {label.toUpperCase()}
      </AppText>
      <AppText weight="bold" size={18} style={{ marginTop: 4, fontVariant: ['tabular-nums'] }}>
        {value}
      </AppText>
    </View>
  );
}

function ActionRow({
  icon,
  color,
  title,
  subtitle,
  onPress,
  loading,
  disabled,
  primary,
}: {
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  color: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: Radius.md,
        backgroundColor: primary ? color + '15' : Colors.surfaceHigh,
        borderWidth: 1,
        borderColor: primary ? color + '55' : Colors.borderSubtle,
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        minHeight: 56,
      })}
    >
      <IconCircle icon={icon} color={color} size={40} />
      <View style={{ flex: 1 }}>
        <AppText weight="semiBold" size={14}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText size={11} color={Colors.textMuted} style={{ marginTop: 2 }}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {loading ? (
        <Ionicons name="hourglass-outline" size={18} color={color} />
      ) : (
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      )}
    </Pressable>
  );
}
