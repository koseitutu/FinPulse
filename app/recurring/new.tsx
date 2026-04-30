import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, useTheme } from '@/constants/theme';
import { AppText, Button, Card, IconButton, SectionHeader } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import type { Frequency, TxType } from '@/store/types';

const FREQ: Frequency[] = ['daily', 'weekly', 'biweekly', 'monthly', 'yearly'];

export default function NewRecurringScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  useTheme();
  const accounts = useAppStore((s) => s.accounts);
  const categories = useAppStore((s) => s.categories);
  const addRecurring = useAppStore((s) => s.addRecurring);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TxType>('expense');
  const [freq, setFreq] = useState<Frequency>('monthly');
  const [categoryId, setCategoryId] = useState<string>('');
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [startDays, setStartDays] = useState('7');

  const parentCats = useMemo(() => categories.filter((c) => !c.parentId && c.type === type), [categories, type]);
  useEffect(() => {
    if (!categoryId && parentCats.length) setCategoryId(parentCats[0].id);
    else if (categoryId && !parentCats.find((c) => c.id === categoryId)) {
      setCategoryId(parentCats[0]?.id ?? '');
    }
  }, [parentCats, categoryId]);

  const handleCreate = () => {
    const amt = parseFloat(amount);
    if (!name.trim() || isNaN(amt) || amt <= 0 || !categoryId || !accountId) return;
    const days = parseInt(startDays, 10) || 7;
    const due = new Date();
    due.setDate(due.getDate() + days);
    addRecurring({
      name: name.trim(),
      amount: amt,
      type,
      categoryId,
      accountId,
      frequency: freq,
      nextDueDate: due.toISOString(),
      isActive: true,
    });
    router.back();
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
        <IconButton icon="close" onPress={() => router.back()} />
        <AppText weight="semiBold" size={16}>
          New Recurring
        </AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120, gap: Spacing.lg }}>
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: Colors.surface,
            borderRadius: Radius.md,
            padding: 4,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          {(['expense', 'income'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 8,
                backgroundColor: type === t ? (t === 'income' ? Colors.income : Colors.expense) : 'transparent',
                alignItems: 'center',
              }}
            >
              <AppText size={13} weight="semiBold" color={type === t ? Colors.text : Colors.textSecondary}>
                {t === 'income' ? 'Income' : 'Expense'}
              </AppText>
            </Pressable>
          ))}
        </View>

        <Card tone="purple">
          <AppText size={11} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1 }}>
            NAME
          </AppText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Netflix subscription"
            placeholderTextColor={Colors.textDim}
            style={{ color: Colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 18, paddingVertical: 6 }}
          />
        </Card>

        <Card tone="amber">
          <AppText size={11} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1 }}>
            AMOUNT
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
            <AppText weight="bold" size={20} color={Colors.textMuted}>
              GHS
            </AppText>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={Colors.textDim}
              keyboardType="decimal-pad"
              style={{ flex: 1, color: Colors.text, fontFamily: 'Inter_700Bold', fontSize: 32 }}
            />
          </View>
        </Card>

        <View>
          <SectionHeader title="Frequency" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {FREQ.map((f) => (
              <Pressable
                key={f}
                onPress={() => setFreq(f)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: Radius.md,
                  backgroundColor: freq === f ? Colors.gold + '22' : Colors.surface,
                  borderWidth: 1,
                  borderColor: freq === f ? Colors.gold : Colors.border,
                }}
              >
                <AppText size={12} weight="semiBold" color={freq === f ? Colors.gold : Colors.text}>
                  {f}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <SectionHeader title="Category" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {parentCats.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setCategoryId(c.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: Radius.md,
                  backgroundColor: categoryId === c.id ? c.color + '22' : Colors.surface,
                  borderWidth: 1,
                  borderColor: categoryId === c.id ? c.color : Colors.border,
                }}
              >
                <Ionicons name={c.icon as never} size={14} color={c.color} />
                <AppText size={12} weight="semiBold">
                  {c.name}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <SectionHeader title="Account" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {accounts.map((a) => (
              <Pressable
                key={a.id}
                onPress={() => setAccountId(a.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: Radius.md,
                  backgroundColor: accountId === a.id ? a.color + '22' : Colors.surface,
                  borderWidth: 1,
                  borderColor: accountId === a.id ? a.color : Colors.border,
                }}
              >
                <Ionicons name={a.icon as never} size={14} color={a.color} />
                <AppText size={12} weight="semiBold">
                  {a.name}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>

        <Card tone="teal">
          <AppText size={11} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1 }}>
            FIRST PAYMENT IN (DAYS)
          </AppText>
          <TextInput
            value={startDays}
            onChangeText={setStartDays}
            placeholder="7"
            placeholderTextColor={Colors.textDim}
            keyboardType="number-pad"
            style={{ color: Colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 18, paddingVertical: 6 }}
          />
        </Card>

        <Button
          label="Create Schedule"
          icon="checkmark"
          onPress={handleCreate}
          disabled={!name || !amount || !categoryId}
        />
      </ScrollView>
    </View>
  );
}
