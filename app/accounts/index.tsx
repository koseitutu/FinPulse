import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, formatCompact, formatCurrency, useTheme } from '@/constants/theme';
import { AppText, Button, Card, Empty, IconButton, SectionHeader } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import type { Account, AccountType } from '@/store/types';

const TYPES: { key: AccountType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'cash', label: 'Cash', icon: 'cash' },
  { key: 'bank', label: 'Bank', icon: 'business' },
  { key: 'mobile_money', label: 'Mobile Money', icon: 'phone-portrait' },
  { key: 'card', label: 'Card', icon: 'card' },
  { key: 'savings', label: 'Savings', icon: 'shield-checkmark' },
];

const CURRENCIES = ['GHS', 'USD', 'EUR', 'GBP', 'NGN'];
const COLORS = ['#F4B942', '#4DA6FF', '#2ECC71', '#B24DFF', '#E74C3C', '#2EC4B6', '#FF8C42', '#FFD166'];

export default function AccountsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  useTheme();
  const accounts = useAppStore((s) => s.accounts);
  const transactions = useAppStore((s) => s.transactions);
  const addAccount = useAppStore((s) => s.addAccount);
  const updateAccount = useAppStore((s) => s.updateAccount);
  const deleteAccount = useAppStore((s) => s.deleteAccount);

  const [editing, setEditing] = useState<Account | 'new' | null>(null);

  const totalByCcy = useMemo(() => {
    const map = new Map<string, number>();
    accounts.forEach((a) => {
      map.set(a.currency, (map.get(a.currency) ?? 0) + a.balance);
    });
    return Array.from(map.entries());
  }, [accounts]);

  const handleDelete = (id: string) => {
    const acc = accounts.find((a) => a.id === id);
    if (!acc) return;
    const linked = transactions.filter((t) => t.accountId === id).length;
    const confirm = () => deleteAccount(id);
    const msg =
      linked > 0
        ? `"${acc.name}" has ${linked} linked transactions. The account will be removed but its transaction history is preserved.`
        : `Delete "${acc.name}"? This cannot be undone.`;
    if (Platform.OS === 'web') {
      confirm();
      return;
    }
    Alert.alert('Delete account?', msg, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: confirm },
    ]);
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
          Accounts
        </AppText>
        <IconButton
          icon="add"
          background={Colors.gold}
          color={Colors.bg}
          onPress={() => setEditing('new')}
        />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120, gap: Spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {accounts.length >= 2 ? (
          <Pressable
            onPress={() => router.push('/transfers/new')}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: Spacing.md,
              borderRadius: Radius.lg,
              backgroundColor: Colors.gold + '18',
              borderWidth: 1,
              borderColor: Colors.gold + '55',
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: Colors.gold,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="swap-horizontal" size={18} color={Colors.bg} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText weight="bold" size={14} color={Colors.gold}>
                Transfer between accounts
              </AppText>
              <AppText size={11} color={Colors.textSecondary}>
                Move money without affecting income or expenses
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.gold} />
          </Pressable>
        ) : null}

        {accounts.length > 0 ? (
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
                top: -30,
                width: 160,
                height: 160,
                borderRadius: 80,
                backgroundColor: Colors.gold + '18',
              }}
            />
            <AppText size={11} weight="semiBold" color={Colors.textMuted} style={{ letterSpacing: 1 }}>
              TOTAL ACROSS {accounts.length} ACCOUNTS
            </AppText>
            <View style={{ gap: 4, marginTop: 8 }}>
              {totalByCcy.map(([ccy, amt]) => (
                <AppText
                  key={ccy}
                  weight="bold"
                  size={24}
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {formatCurrency(amt, ccy)}
                </AppText>
              ))}
            </View>
          </View>
        ) : null}

        {accounts.length === 0 ? (
          <Empty
            icon="wallet"
            title="No accounts yet"
            subtitle="Add your first account to start tracking balances."
            action={<Button label="Add account" icon="add" onPress={() => setEditing('new')} />}
          />
        ) : null}

        {accounts.map((a) => {
          const typeDef = TYPES.find((t) => t.key === a.type);
          const txCount = transactions.filter((t) => t.accountId === a.id).length;
          return (
            <Card key={a.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: a.color + '22',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={(a.icon as never) ?? typeDef?.icon ?? 'wallet'} size={22} color={a.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText weight="bold" size={16}>
                    {a.name}
                  </AppText>
                  <AppText size={11} color={Colors.textMuted}>
                    {typeDef?.label ?? a.type.replace('_', ' ')} · {txCount} transactions
                  </AppText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <AppText weight="bold" size={16} color={a.balance < 0 ? Colors.expense : Colors.text} style={{ fontVariant: ['tabular-nums'] }}>
                    {formatCompact(a.balance, a.currency)}
                  </AppText>
                  <AppText size={10} color={Colors.textMuted}>
                    {a.currency}
                  </AppText>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: Spacing.md }}>
                {accounts.length >= 2 ? (
                  <Button
                    label="Transfer"
                    icon="swap-horizontal"
                    variant="secondary"
                    onPress={() =>
                      router.push({
                        pathname: '/transfers/new',
                        params: { fromId: a.id },
                      })
                    }
                    style={{ flex: 1 }}
                    small
                  />
                ) : null}
                <Button
                  label="Edit"
                  icon="create"
                  variant="secondary"
                  onPress={() => setEditing(a)}
                  style={{ flex: 1 }}
                  small
                />
                <Button
                  label="Delete"
                  icon="trash"
                  variant="ghost"
                  onPress={() => handleDelete(a.id)}
                  style={{ flex: 1 }}
                  small
                />
              </View>
            </Card>
          );
        })}
      </ScrollView>

      <AccountEditor
        key={editing === 'new' ? 'new' : editing?.id ?? 'none'}
        visible={editing !== null}
        account={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
        onSave={(data, id) => {
          if (id) {
            updateAccount(id, data);
          } else {
            addAccount(data as Omit<Account, 'id'>);
          }
          setEditing(null);
        }}
      />
    </View>
  );
}

function AccountEditor({
  visible,
  account,
  onClose,
  onSave,
}: {
  visible: boolean;
  account: Account | null;
  onClose: () => void;
  onSave: (data: Partial<Account>, id?: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(account?.name ?? '');
  const [type, setType] = useState<AccountType>(account?.type ?? 'bank');
  const [currency, setCurrency] = useState(account?.currency ?? 'GHS');
  const [balance, setBalance] = useState(account ? String(account.balance) : '0');
  const [color, setColor] = useState(account?.color ?? COLORS[0]);

  const typeDef = TYPES.find((t) => t.key === type);
  const icon = account?.icon ?? typeDef?.icon ?? 'wallet';

  const canSave = name.trim().length > 0 && !isNaN(parseFloat(balance));

  const handleSave = () => {
    if (!canSave) return;
    const amt = parseFloat(balance);
    onSave(
      {
        name: name.trim(),
        type,
        currency,
        balance: amt,
        color,
        icon: icon as string,
      },
      account?.id
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <Pressable
          onPress={onClose}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: Colors.bgElevated,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: Spacing.xl,
              paddingBottom: insets.bottom + Spacing.xl,
              maxHeight: '90%',
            }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: Colors.textDim,
                alignSelf: 'center',
                marginBottom: Spacing.md,
              }}
            />
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: Spacing.lg, paddingBottom: Spacing.lg }}
              showsVerticalScrollIndicator={false}
            >
              <AppText weight="bold" size={22}>
                {account ? 'Edit account' : 'New account'}
              </AppText>

              <View>
                <AppText size={11} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1, marginBottom: 8 }}>
                  NAME
                </AppText>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. MTN MoMo"
                  placeholderTextColor={Colors.textDim}
                  autoFocus={!account}
                  style={{
                    color: Colors.text,
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 16,
                    backgroundColor: Colors.surface,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    borderRadius: Radius.md,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                  }}
                />
              </View>

              <View>
                <SectionHeader title="Type" />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {TYPES.map((t) => (
                    <Pressable
                      key={t.key}
                      onPress={() => setType(t.key)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: Radius.md,
                        backgroundColor: type === t.key ? color + '22' : Colors.surface,
                        borderWidth: 1,
                        borderColor: type === t.key ? color : Colors.border,
                      }}
                    >
                      <Ionicons name={t.icon} size={14} color={type === t.key ? color : Colors.textSecondary} />
                      <AppText size={12} weight="semiBold" color={type === t.key ? Colors.text : Colors.textSecondary}>
                        {t.label}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View>
                <SectionHeader title="Currency" />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {CURRENCIES.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => setCurrency(c)}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: Radius.md,
                        backgroundColor: currency === c ? Colors.gold + '22' : Colors.surface,
                        borderWidth: 1,
                        borderColor: currency === c ? Colors.gold : Colors.border,
                      }}
                    >
                      <AppText size={13} weight="semiBold" color={currency === c ? Colors.gold : Colors.text}>
                        {c}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View>
                <AppText size={11} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1, marginBottom: 8 }}>
                  {account ? 'CURRENT BALANCE' : 'OPENING BALANCE'}
                </AppText>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: Colors.surface,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    borderRadius: Radius.md,
                    paddingHorizontal: 14,
                  }}
                >
                  <AppText weight="bold" size={16} color={Colors.textMuted}>
                    {currency}
                  </AppText>
                  <TextInput
                    value={balance}
                    onChangeText={setBalance}
                    placeholder="0.00"
                    placeholderTextColor={Colors.textDim}
                    keyboardType="decimal-pad"
                    style={{
                      flex: 1,
                      color: Colors.text,
                      fontFamily: 'Inter_700Bold',
                      fontSize: 24,
                      paddingVertical: 12,
                    }}
                  />
                </View>
              </View>

              <View>
                <SectionHeader title="Color" />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {COLORS.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => setColor(c)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: c,
                        borderWidth: color === c ? 3 : 0,
                        borderColor: Colors.text,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {color === c ? <Ionicons name="checkmark" size={18} color={Colors.bg} /> : null}
                    </Pressable>
                  ))}
                </View>
              </View>

              <Button
                label={account ? 'Save changes' : 'Create account'}
                icon="checkmark"
                onPress={handleSave}
                disabled={!canSave}
              />
              <Button label="Cancel" variant="ghost" onPress={onClose} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
