import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, formatCompact, formatCurrency } from '@/constants/theme';
import { AppText, Button, IconButton } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import type { Account } from '@/store/types';

export default function NewTransferScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ fromId?: string; toId?: string }>();
  const accounts = useAppStore((s) => s.accounts);
  const addTransfer = useAppStore((s) => s.addTransfer);

  const [fromId, setFromId] = useState<string | null>(null);
  const [toId, setToId] = useState<string | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [picker, setPicker] = useState<'from' | 'to' | null>(null);

  // Initialize sensible defaults from params or first two accounts
  useEffect(() => {
    if (accounts.length === 0) return;
    if (!fromId) {
      const initial =
        params.fromId && accounts.some((a) => a.id === params.fromId)
          ? params.fromId
          : accounts[0].id;
      setFromId(initial);
    }
    if (!toId) {
      const preferred =
        params.toId && accounts.some((a) => a.id === params.toId)
          ? params.toId
          : accounts.find((a) => a.id !== (params.fromId ?? accounts[0].id))?.id ?? null;
      setToId(preferred);
    }
  }, [accounts, params.fromId, params.toId, fromId, toId]);

  const fromAccount = useMemo(
    () => accounts.find((a) => a.id === fromId) ?? null,
    [accounts, fromId]
  );
  const toAccount = useMemo(
    () => accounts.find((a) => a.id === toId) ?? null,
    [accounts, toId]
  );

  const sameCurrency =
    fromAccount && toAccount && fromAccount.currency === toAccount.currency;

  // When same-currency, mirror fromAmount into toAmount
  useEffect(() => {
    if (sameCurrency) setToAmount(fromAmount);
  }, [fromAmount, sameCurrency]);

  const parsedFrom = parseFloat(fromAmount.replace(/,/g, '')) || 0;
  const parsedTo = sameCurrency ? parsedFrom : parseFloat(toAmount.replace(/,/g, '')) || 0;

  const sameAccount = fromId && toId && fromId === toId;
  const insufficient =
    fromAccount && parsedFrom > 0 && fromAccount.balance - parsedFrom < 0;

  const canSubmit =
    fromAccount &&
    toAccount &&
    !sameAccount &&
    parsedFrom > 0 &&
    parsedTo > 0 &&
    (sameCurrency || parsedTo > 0);

  const handleSwap = () => {
    const prevFrom = fromId;
    setFromId(toId);
    setToId(prevFrom);
    // Swap amounts too when cross-currency so they stay meaningful
    if (!sameCurrency) {
      setFromAmount(toAmount);
      setToAmount(fromAmount);
    }
  };

  const submit = () => {
    if (!canSubmit || !fromAccount || !toAccount) return;

    const doTransfer = () => {
      addTransfer({
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        fromAmount: parsedFrom,
        toAmount: parsedTo,
        fromCurrency: fromAccount.currency,
        toCurrency: toAccount.currency,
        date: new Date().toISOString(),
        notes: notes.trim() || undefined,
      });
      router.back();
    };

    if (insufficient) {
      if (Platform.OS === 'web') {
        doTransfer();
        return;
      }
      Alert.alert(
        'Insufficient balance',
        `${fromAccount.name} will go to ${formatCurrency(
          fromAccount.balance - parsedFrom,
          fromAccount.currency
        )}. Proceed anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Transfer', style: 'destructive', onPress: doTransfer },
        ]
      );
      return;
    }
    doTransfer();
  };

  if (accounts.length < 2) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.bg,
          paddingTop: insets.top,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: Spacing.lg,
          }}
        >
          <IconButton icon="close" onPress={() => router.back()} />
          <AppText weight="semiBold" size={16}>
            Transfer
          </AppText>
          <View style={{ width: 40 }} />
        </View>
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: 10 }}
        >
          <Ionicons name="swap-horizontal" size={40} color={Colors.textMuted} />
          <AppText weight="semiBold" size={16}>
            You need two accounts
          </AppText>
          <AppText size={13} color={Colors.textMuted} style={{ textAlign: 'center' }}>
            Add at least two accounts to transfer money between them.
          </AppText>
          <Button
            label="Add an account"
            icon="add"
            onPress={() => {
              router.back();
              router.push('/accounts');
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: Colors.bg }}
    >
      <View style={{ flex: 1, paddingTop: insets.top }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: Spacing.lg,
          }}
        >
          <IconButton icon="close" onPress={() => router.back()} />
          <AppText weight="semiBold" size={16}>
            New transfer
          </AppText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: Spacing.lg,
            paddingTop: 0,
            paddingBottom: insets.bottom + 140,
            gap: Spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Route card */}
          <View
            style={{
              backgroundColor: Colors.bgElevated,
              borderRadius: Radius.xl,
              borderWidth: 1,
              borderColor: Colors.border,
              overflow: 'hidden',
            }}
          >
            <AccountRow
              label="FROM"
              account={fromAccount}
              onPress={() => setPicker('from')}
              amountColor={Colors.expense}
            />
            <View
              style={{
                height: 1,
                backgroundColor: Colors.borderSubtle,
                marginLeft: Spacing.lg,
              }}
            />
            <AccountRow
              label="TO"
              account={toAccount}
              onPress={() => setPicker('to')}
              amountColor={Colors.income}
            />

            {/* Swap button */}
            <View
              style={{
                position: 'absolute',
                right: Spacing.lg,
                top: '50%',
                transform: [{ translateY: -18 }],
              }}
            >
              <Pressable
                onPress={handleSwap}
                style={({ pressed }) => ({
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: Colors.gold,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 3,
                  borderColor: Colors.bgElevated,
                  opacity: pressed ? 0.7 : 1,
                  boxShadow: '0 6px 12px rgba(244,185,66,0.3)',
                })}
              >
                <Ionicons name="swap-vertical" size={16} color={Colors.bg} />
              </Pressable>
            </View>
          </View>

          {/* Same account warning */}
          {sameAccount ? (
            <View
              style={{
                flexDirection: 'row',
                gap: 10,
                padding: Spacing.md,
                backgroundColor: Colors.expense + '18',
                borderRadius: Radius.md,
                borderWidth: 1,
                borderColor: Colors.expense + '55',
              }}
            >
              <Ionicons name="alert-circle" size={16} color={Colors.expense} />
              <AppText size={12} color={Colors.expense} style={{ flex: 1 }}>
                Pick two different accounts to transfer between.
              </AppText>
            </View>
          ) : null}

          {/* Amount(s) */}
          {fromAccount && toAccount && !sameAccount ? (
            <View style={{ gap: Spacing.md }}>
              <AmountInput
                label={sameCurrency ? 'AMOUNT' : `SEND · ${fromAccount.currency}`}
                currency={fromAccount.currency}
                value={fromAmount}
                onChangeText={setFromAmount}
                accent={Colors.gold}
                autoFocus
                balance={fromAccount.balance}
                showBalance
              />

              {!sameCurrency ? (
                <>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <View style={{ flex: 1, height: 1, backgroundColor: Colors.borderSubtle }} />
                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: Radius.pill,
                        backgroundColor: Colors.surfaceAlt,
                        borderWidth: 1,
                        borderColor: Colors.border,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Ionicons name="repeat" size={10} color={Colors.info} />
                      <AppText size={10} weight="semiBold" color={Colors.info}>
                        CROSS-CURRENCY
                      </AppText>
                    </View>
                    <View style={{ flex: 1, height: 1, backgroundColor: Colors.borderSubtle }} />
                  </View>
                  <AmountInput
                    label={`RECEIVE · ${toAccount.currency}`}
                    currency={toAccount.currency}
                    value={toAmount}
                    onChangeText={setToAmount}
                    accent={Colors.income}
                  />
                  {parsedFrom > 0 && parsedTo > 0 ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        paddingVertical: 6,
                      }}
                    >
                      <Ionicons name="calculator-outline" size={13} color={Colors.textMuted} />
                      <AppText size={12} color={Colors.textMuted}>
                        Rate: 1 {fromAccount.currency} ={' '}
                        <AppText size={12} weight="semiBold" color={Colors.text}>
                          {(parsedTo / parsedFrom).toFixed(4)} {toAccount.currency}
                        </AppText>
                      </AppText>
                    </View>
                  ) : null}
                </>
              ) : null}

              {insufficient ? (
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 10,
                    padding: Spacing.md,
                    backgroundColor: Colors.warn + '18',
                    borderRadius: Radius.md,
                    borderWidth: 1,
                    borderColor: Colors.warn + '55',
                  }}
                >
                  <Ionicons name="warning" size={16} color={Colors.warn} />
                  <AppText size={12} color={Colors.textSecondary} style={{ flex: 1 }}>
                    This transfer will take {fromAccount.name} to{' '}
                    <AppText size={12} weight="semiBold" color={Colors.expense}>
                      {formatCurrency(fromAccount.balance - parsedFrom, fromAccount.currency)}
                    </AppText>
                    .
                  </AppText>
                </View>
              ) : null}

              {/* Notes */}
              <View>
                <AppText
                  size={11}
                  color={Colors.textMuted}
                  weight="semiBold"
                  style={{ letterSpacing: 1, marginBottom: 8 }}
                >
                  NOTE (OPTIONAL)
                </AppText>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g. Move savings"
                  placeholderTextColor={Colors.textDim}
                  style={{
                    color: Colors.text,
                    fontFamily: 'Inter_500Medium',
                    fontSize: 14,
                    backgroundColor: Colors.surface,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    borderRadius: Radius.md,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                  }}
                />
              </View>

              {/* Preview */}
              {parsedFrom > 0 && parsedTo > 0 && fromAccount && toAccount ? (
                <View
                  style={{
                    backgroundColor: Colors.surface,
                    borderRadius: Radius.lg,
                    padding: Spacing.lg,
                    borderWidth: 1,
                    borderColor: Colors.borderSubtle,
                    gap: 10,
                  }}
                >
                  <AppText
                    size={11}
                    color={Colors.textMuted}
                    weight="semiBold"
                    style={{ letterSpacing: 1 }}
                  >
                    AFTER TRANSFER
                  </AppText>
                  <BalanceDeltaRow
                    account={fromAccount}
                    delta={-parsedFrom}
                  />
                  <BalanceDeltaRow account={toAccount} delta={parsedTo} />
                </View>
              ) : null}
            </View>
          ) : null}
        </ScrollView>

        {/* Footer */}
        <View
          style={{
            padding: Spacing.lg,
            paddingBottom: insets.bottom + Spacing.md,
            borderTopWidth: 1,
            borderTopColor: Colors.borderSubtle,
            backgroundColor: Colors.bg,
          }}
        >
          <Button
            label={insufficient ? 'Transfer anyway' : 'Transfer'}
            icon="arrow-forward"
            onPress={submit}
            disabled={!canSubmit}
            variant={insufficient ? 'danger' : 'primary'}
          />
        </View>

        {/* Account picker */}
        <AccountPickerSheet
          visible={picker !== null}
          accounts={accounts}
          excludeId={picker === 'from' ? toId ?? undefined : fromId ?? undefined}
          onClose={() => setPicker(null)}
          onSelect={(id) => {
            if (picker === 'from') setFromId(id);
            if (picker === 'to') setToId(id);
            setPicker(null);
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function AccountRow({
  label,
  account,
  onPress,
  amountColor,
}: {
  label: string;
  account: Account | null;
  onPress: () => void;
  amountColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        padding: Spacing.lg,
        paddingRight: 64, // room for swap btn
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: account ? account.color + '22' : Colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: account ? 'transparent' : Colors.border,
        }}
      >
        {account ? (
          <Ionicons name={account.icon as never} size={22} color={account.color} />
        ) : (
          <Ionicons name="wallet-outline" size={22} color={Colors.textMuted} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <AppText
          size={10}
          color={Colors.textMuted}
          weight="semiBold"
          style={{ letterSpacing: 1.2 }}
        >
          {label}
        </AppText>
        <AppText weight="bold" size={16} style={{ marginTop: 2 }}>
          {account?.name ?? 'Select account'}
        </AppText>
        {account ? (
          <AppText
            size={11}
            color={amountColor}
            style={{ fontVariant: ['tabular-nums'], marginTop: 2 }}
          >
            {formatCompact(account.balance, account.currency)} available
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

function AmountInput({
  label,
  currency,
  value,
  onChangeText,
  accent,
  autoFocus,
  balance,
  showBalance,
}: {
  label: string;
  currency: string;
  value: string;
  onChangeText: (v: string) => void;
  accent: string;
  autoFocus?: boolean;
  balance?: number;
  showBalance?: boolean;
}) {
  const parsed = parseFloat(value.replace(/,/g, '')) || 0;
  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <AppText
          size={11}
          color={Colors.textMuted}
          weight="semiBold"
          style={{ letterSpacing: 1.2 }}
        >
          {label}
        </AppText>
        {showBalance && typeof balance === 'number' ? (
          <Pressable
            onPress={() => onChangeText(String(balance))}
            hitSlop={6}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <AppText size={11} color={accent} weight="semiBold">
              Use max
            </AppText>
          </Pressable>
        ) : null}
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: Colors.surface,
          borderWidth: 1,
          borderColor: parsed > 0 ? accent : Colors.border,
          borderRadius: Radius.lg,
          paddingHorizontal: 16,
          paddingVertical: 2,
        }}
      >
        <AppText weight="bold" size={18} color={Colors.textMuted}>
          {currency}
        </AppText>
        <TextInput
          value={value}
          onChangeText={(t) => onChangeText(t.replace(/[^0-9.]/g, ''))}
          placeholder="0.00"
          placeholderTextColor={Colors.textDim}
          keyboardType="decimal-pad"
          autoFocus={autoFocus}
          selectionColor={accent}
          style={{
            flex: 1,
            color: Colors.text,
            fontFamily: 'Inter_700Bold',
            fontSize: 28,
            paddingVertical: 12,
          }}
        />
      </View>
    </View>
  );
}

function BalanceDeltaRow({ account, delta }: { account: Account; delta: number }) {
  const newBalance = account.balance + delta;
  const negative = newBalance < 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 10,
          backgroundColor: account.color + '22',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={account.icon as never} size={13} color={account.color} />
      </View>
      <AppText size={13} weight="semiBold" style={{ flex: 1 }}>
        {account.name}
      </AppText>
      <AppText
        size={12}
        color={Colors.textMuted}
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {formatCompact(account.balance, account.currency)}
      </AppText>
      <Ionicons name="arrow-forward" size={12} color={Colors.textDim} />
      <AppText
        size={13}
        weight="bold"
        color={negative ? Colors.expense : delta > 0 ? Colors.income : Colors.text}
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {formatCompact(newBalance, account.currency)}
      </AppText>
    </View>
  );
}

function AccountPickerSheet({
  visible,
  accounts,
  excludeId,
  onClose,
  onSelect,
}: {
  visible: boolean;
  accounts: Account[];
  excludeId?: string;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  return (
    <Pressable
      onPress={onClose}
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
      }}
    >
      <Pressable
        onPress={(e) => e.stopPropagation()}
        style={{
          backgroundColor: Colors.bgElevated,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: Spacing.lg,
          paddingBottom: insets.bottom + Spacing.lg,
          maxHeight: '70%',
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
        <AppText weight="bold" size={18} style={{ marginBottom: Spacing.md }}>
          Choose account
        </AppText>
        <ScrollView
          contentContainerStyle={{ gap: 8, paddingBottom: Spacing.md }}
          showsVerticalScrollIndicator={false}
        >
          {accounts.map((a) => {
            const disabled = a.id === excludeId;
            return (
              <Pressable
                key={a.id}
                disabled={disabled}
                onPress={() => onSelect(a.id)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: Spacing.md,
                  borderRadius: Radius.md,
                  backgroundColor: Colors.surface,
                  borderWidth: 1,
                  borderColor: Colors.borderSubtle,
                  opacity: disabled ? 0.35 : pressed ? 0.7 : 1,
                })}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: a.color + '22',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={a.icon as never} size={18} color={a.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText weight="semiBold" size={14}>
                    {a.name}
                  </AppText>
                  <AppText size={11} color={Colors.textMuted}>
                    {a.type.replace('_', ' ')} · {a.currency}
                  </AppText>
                </View>
                <AppText
                  weight="semiBold"
                  size={13}
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {formatCompact(a.balance, a.currency)}
                </AppText>
                {disabled ? (
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                      backgroundColor: Colors.surfaceAlt,
                    }}
                  >
                    <AppText size={9} weight="semiBold" color={Colors.textMuted}>
                      IN USE
                    </AppText>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </Pressable>
    </Pressable>
  );
}
