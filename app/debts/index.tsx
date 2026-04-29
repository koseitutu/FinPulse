import React, { useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, formatCompact, formatCurrency } from '@/constants/theme';
import { AppText, Badge, Button, Card, Empty, IconButton, ProgressBar, SectionHeader } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { formatRelative } from '@/utils/finance';
import type { Debt } from '@/store/types';

export default function DebtsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const debts = useAppStore((s) => s.debts);
  const deleteDebt = useAppStore((s) => s.deleteDebt);
  const payDebt = useAppStore((s) => s.payDebt);

  const [payFor, setPayFor] = useState<Debt | null>(null);
  const [payAmount, setPayAmount] = useState('');

  const active = debts.filter((d) => !d.isPaid);
  const paid = debts.filter((d) => d.isPaid);

  const totalOwed = active.filter((d) => d.type === 'owed').reduce((a, d) => a + (d.amount - d.amountPaid), 0);
  const totalLent = active.filter((d) => d.type === 'lent').reduce((a, d) => a + (d.amount - d.amountPaid), 0);

  const handleDelete = (id: string) => {
    if (Platform.OS === 'web') {
      deleteDebt(id);
      return;
    }
    Alert.alert('Delete debt?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteDebt(id) },
    ]);
  };

  const handlePay = () => {
    if (!payFor) return;
    const a = parseFloat(payAmount);
    if (!isNaN(a) && a > 0) payDebt(payFor.id, a);
    setPayFor(null);
    setPayAmount('');
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
          Debts & Loans
        </AppText>
        <IconButton
          icon="add"
          background={Colors.gold}
          color={Colors.bg}
          onPress={() => router.push('/debts/new')}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120, gap: Spacing.lg }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: Colors.expenseSoft,
              borderRadius: Radius.lg,
              padding: Spacing.md,
              borderWidth: 1,
              borderColor: Colors.expense + '44',
            }}
          >
            <AppText size={10} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1 }}>
              YOU OWE
            </AppText>
            <AppText weight="bold" size={22} color={Colors.expense} style={{ fontVariant: ['tabular-nums'] }}>
              {formatCompact(totalOwed)}
            </AppText>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: Colors.incomeSoft,
              borderRadius: Radius.lg,
              padding: Spacing.md,
              borderWidth: 1,
              borderColor: Colors.income + '44',
            }}
          >
            <AppText size={10} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1 }}>
              OWED TO YOU
            </AppText>
            <AppText weight="bold" size={22} color={Colors.income} style={{ fontVariant: ['tabular-nums'] }}>
              {formatCompact(totalLent)}
            </AppText>
          </View>
        </View>

        {active.length === 0 && paid.length === 0 ? (
          <Empty
            icon="cash"
            title="No debts tracked"
            subtitle="Keep tabs on money owed or loaned."
            action={<Button label="Add debt" icon="add" onPress={() => router.push('/debts/new')} />}
          />
        ) : null}

        {active.length > 0 ? (
          <View>
            <SectionHeader title="Active" subtitle={`${active.length} open`} />
            <View style={{ gap: 10 }}>
              {active.map((d) => {
                const overdue = new Date(d.dueDate).getTime() < Date.now();
                const remaining = d.amount - d.amountPaid;
                const pct = (d.amountPaid / d.amount) * 100;
                const mainColor = d.type === 'owed' ? Colors.expense : Colors.income;
                return (
                  <Card key={d.id}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          backgroundColor: mainColor + '22',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons
                          name={d.type === 'owed' ? 'arrow-up-circle' : 'arrow-down-circle'}
                          size={22}
                          color={mainColor}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <AppText weight="bold" size={15}>
                            {d.name}
                          </AppText>
                          {overdue ? <Badge text="Overdue" color={Colors.expense} /> : null}
                        </View>
                        <AppText size={11} color={Colors.textMuted}>
                          {d.contactName} · Due {formatRelative(d.dueDate)}
                        </AppText>
                      </View>
                      <Pressable onPress={() => handleDelete(d.id)} hitSlop={8}>
                        <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
                      </Pressable>
                    </View>

                    <View style={{ marginTop: Spacing.md, gap: 6 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <AppText size={12} color={Colors.textSecondary}>
                          {formatCurrency(d.amountPaid)} of {formatCurrency(d.amount)}
                        </AppText>
                        <AppText size={12} weight="semiBold" color={mainColor}>
                          {pct.toFixed(0)}%
                        </AppText>
                      </View>
                      <ProgressBar value={d.amountPaid} max={d.amount} color={mainColor} />
                      <AppText size={11} color={Colors.textMuted}>
                        {formatCompact(remaining)} remaining
                      </AppText>
                    </View>

                    <Button
                      label={d.type === 'owed' ? 'Record payment' : 'Mark received'}
                      icon="checkmark-circle"
                      small
                      style={{ marginTop: Spacing.md }}
                      onPress={() => setPayFor(d)}
                    />
                  </Card>
                );
              })}
            </View>
          </View>
        ) : null}

        {paid.length > 0 ? (
          <View>
            <SectionHeader title="Settled" />
            <View style={{ gap: 8 }}>
              {paid.map((d) => (
                <View
                  key={d.id}
                  style={{
                    backgroundColor: Colors.surface,
                    borderRadius: Radius.md,
                    padding: Spacing.md,
                    borderWidth: 1,
                    borderColor: Colors.borderSubtle,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    opacity: 0.65,
                  }}
                >
                  <Ionicons name="checkmark-circle" size={18} color={Colors.income} />
                  <View style={{ flex: 1 }}>
                    <AppText size={13} weight="semiBold">
                      {d.name}
                    </AppText>
                    <AppText size={11} color={Colors.textMuted}>
                      {d.contactName} · settled
                    </AppText>
                  </View>
                  <AppText size={13} weight="semiBold">
                    {formatCurrency(d.amount)}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={!!payFor} transparent animationType="fade" onRequestClose={() => setPayFor(null)}>
        <Pressable onPress={() => setPayFor(null)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: Colors.bgElevated,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: Spacing.xl,
              paddingBottom: insets.bottom + Spacing.xl,
              gap: Spacing.md,
            }}
          >
            <AppText weight="bold" size={18}>
              {payFor?.type === 'owed' ? 'Record payment' : 'Mark received'}
            </AppText>
            <View
              style={{
                backgroundColor: Colors.surface,
                borderRadius: Radius.md,
                padding: Spacing.md,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <AppText size={11} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1 }}>
                AMOUNT
              </AppText>
              <TextInput
                value={payAmount}
                onChangeText={setPayAmount}
                placeholder="0.00"
                placeholderTextColor={Colors.textDim}
                keyboardType="decimal-pad"
                autoFocus
                style={{ color: Colors.text, fontFamily: 'Inter_700Bold', fontSize: 28, paddingVertical: 4 }}
              />
            </View>
            <Button label="Confirm" icon="checkmark" onPress={handlePay} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
