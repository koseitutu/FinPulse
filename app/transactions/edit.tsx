import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, useScaledFont, useTheme } from '@/constants/theme';
import { AppText, Button, Card, Chip, IconButton, SectionHeader } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import type { TxType } from '@/store/types';

export default function EditTransactionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  useTheme();
  const scaled = useScaledFont();
  const { editId } = useLocalSearchParams<{ editId: string }>();

  const accounts = useAppStore((s) => s.accounts);
  const categories = useAppStore((s) => s.categories);
  const tags = useAppStore((s) => s.tags);
  const updateTransaction = useAppStore((s) => s.updateTransaction);
  const tx = useAppStore((s) => s.transactions.find((t) => t.id === editId));

  // Initialize state from existing transaction
  const [type, setType] = useState<TxType>(tx?.type ?? 'expense');
  const [amount, setAmount] = useState(tx ? String(tx.amount) : '');
  const [merchant, setMerchant] = useState(tx?.merchant ?? '');
  const [notes, setNotes] = useState(tx?.notes ?? '');
  const [accountId, setAccountId] = useState(tx?.accountId ?? accounts[0]?.id ?? '');
  const [categoryId, setCategoryId] = useState<string>(tx?.categoryId ?? '');
  const [subcategoryId, setSubcategoryId] = useState<string>(tx?.subcategoryId ?? '');
  const [tagIds, setTagIds] = useState<string[]>(tx?.tagIds ?? []);
  const [date] = useState<string>(tx?.date ?? new Date().toISOString());

  const parentCats = useMemo(() => categories.filter((c) => !c.parentId && c.type === type), [categories, type]);
  const subCats = useMemo(() => categories.filter((c) => c.parentId === categoryId), [categories, categoryId]);

  useEffect(() => {
    // When type changes, if current category doesn't match the new type, reset
    const cat = categories.find((c) => c.id === categoryId);
    if (cat && cat.type !== type) {
      setCategoryId(parentCats[0]?.id ?? '');
      setSubcategoryId('');
    }
  }, [type, parentCats, categoryId, categories]);

  const toggleTag = (id: string) => {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSave = () => {
    if (!editId || !tx) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;
    if (!accountId || !categoryId) return;

    updateTransaction(editId, {
      amount: amt,
      currency: accounts.find((a) => a.id === accountId)?.currency ?? tx.currency,
      type,
      categoryId,
      subcategoryId: subcategoryId || undefined,
      tagIds,
      date,
      notes: notes || undefined,
      accountId,
      merchant: merchant || undefined,
    });

    // Go back to the detail screen so it shows fresh data
    router.back();
  };

  if (!tx) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <AppText color={Colors.textMuted}>Transaction not found.</AppText>
      </View>
    );
  }

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
          Edit Transaction
        </AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120, gap: Spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {/* Type toggle */}
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

        {/* Amount */}
        <Card tone="purple">
          <AppText size={11} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1 }}>
            AMOUNT
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
            <AppText weight="bold" size={22} color={Colors.textMuted}>
              {accounts.find((a) => a.id === accountId)?.currency ?? tx.currency}
            </AppText>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={Colors.textDim}
              keyboardType="decimal-pad"
              style={{
                flex: 1,
                color: Colors.text,
                fontFamily: 'Inter_700Bold',
                fontSize: scaled(36),
              }}
            />
          </View>
        </Card>

        {/* Account */}
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

        {/* Category */}
        <View>
          <SectionHeader title="Category" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {parentCats.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => {
                  setCategoryId(c.id);
                  setSubcategoryId('');
                }}
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

        {/* Subcategory */}
        {subCats.length > 0 ? (
          <View>
            <SectionHeader title="Subcategory" subtitle="Optional" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {subCats.map((c) => (
                <Chip
                  key={c.id}
                  label={c.name}
                  icon={c.icon as never}
                  color={c.color}
                  active={subcategoryId === c.id}
                  onPress={() => setSubcategoryId(subcategoryId === c.id ? '' : c.id)}
                />
              ))}
            </View>
          </View>
        ) : null}

        {/* Tags */}
        <View>
          <SectionHeader title="Tags" subtitle="Optional" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {tags.map((t) => (
              <Chip
                key={t.id}
                label={`#${t.name}`}
                color={t.color}
                active={tagIds.includes(t.id)}
                onPress={() => toggleTag(t.id)}
              />
            ))}
          </View>
        </View>

        {/* Merchant */}
        <Card tone="blue">
          <AppText size={11} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1, marginBottom: 6 }}>
            MERCHANT
          </AppText>
          <TextInput
            value={merchant}
            onChangeText={setMerchant}
            placeholder="e.g. Shoprite"
            placeholderTextColor={Colors.textDim}
            style={{ color: Colors.text, fontFamily: 'Inter_400Regular', fontSize: scaled(15), paddingVertical: 4 }}
          />
        </Card>

        {/* Notes */}
        <Card tone="amber">
          <AppText size={11} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1, marginBottom: 6 }}>
            NOTES
          </AppText>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add a note…"
            placeholderTextColor={Colors.textDim}
            multiline
            numberOfLines={3}
            style={{
              color: Colors.text,
              fontFamily: 'Inter_400Regular',
              fontSize: scaled(14),
              minHeight: 60,
              textAlignVertical: 'top',
            }}
          />
        </Card>

        <Button
          label="Save Changes"
          icon="checkmark"
          onPress={handleSave}
          disabled={!amount || !categoryId || !accountId}
        />
      </ScrollView>
    </View>
  );
}
