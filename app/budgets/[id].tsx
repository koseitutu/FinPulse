import React, { useMemo, useState } from 'react';
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
import { Colors, Radius, Spacing, formatCompact, useTheme } from '@/constants/theme';
import { AppText, Button, IconButton, ProgressBar } from '@/components/ui';
import { useActiveTransactions, useAppStore } from '@/store/useAppStore';
import { daysInMonth, filterMonth } from '@/utils/finance';

const QUICK = [100, 250, 500, 1000, 2000, 5000];

export default function BudgetEditScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const categories = useAppStore((s) => s.categories);
  const updateCategory = useAppStore((s) => s.updateCategory);
  const txs = useActiveTransactions();
  const currency = useAppStore((s) => s.preferences.currency);

  const category = useMemo(() => categories.find((c) => c.id === id), [categories, id]);

  const [amount, setAmount] = useState(
    category?.budget && category.budget > 0 ? String(category.budget) : ''
  );

  if (!category) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.bg,
          paddingTop: insets.top,
          padding: Spacing.lg,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <IconButton icon="close" onPress={() => router.back()} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Ionicons name="alert-circle" size={40} color={Colors.textMuted} />
          <AppText weight="semiBold" size={16}>
            Category not found
          </AppText>
          <AppText size={13} color={Colors.textMuted}>
            It may have been deleted.
          </AppText>
        </View>
      </View>
    );
  }

  const parsed = parseFloat(amount.replace(/,/g, ''));
  const valid = amount.trim().length > 0 && !isNaN(parsed) && parsed > 0;

  // Current spend for preview
  const now = new Date();
  const monthTx = filterMonth(txs, now.getFullYear(), now.getMonth());
  const spent = monthTx
    .filter((t) => {
      if (t.type !== 'expense') return false;
      const c = categories.find((x) => x.id === t.categoryId);
      return t.categoryId === category.id || c?.parentId === category.id;
    })
    .reduce((a, t) => a + t.amount, 0);

  const dayCount = daysInMonth(now.getFullYear(), now.getMonth());
  const previewBudget = valid ? parsed : 0;
  const previewPct = previewBudget > 0 ? (spent / previewBudget) * 100 : 0;
  const previewRemaining = previewBudget - spent;
  const dailyAllowance =
    previewBudget > 0 ? previewBudget / dayCount : 0;

  const handleSave = () => {
    if (!valid) return;
    updateCategory(category.id, { budget: parsed });
    router.back();
  };

  const handleRemove = () => {
    const remove = () => {
      updateCategory(category.id, { budget: undefined });
      router.back();
    };
    if (Platform.OS === 'web') {
      remove();
      return;
    }
    Alert.alert(
      'Remove budget?',
      `"${category.name}" will no longer have a monthly limit.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: remove },
      ]
    );
  };

  const hadBudget = typeof category.budget === 'number' && category.budget > 0;

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
            {hadBudget ? 'Edit budget' : 'New budget'}
          </AppText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: Spacing.lg,
            paddingTop: 0,
            paddingBottom: insets.bottom + 120,
            gap: Spacing.xl,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Category header */}
          <View
            style={{
              backgroundColor: Colors.bgElevated,
              borderRadius: Radius.xl,
              padding: Spacing.xl,
              borderWidth: 1,
              borderColor: Colors.border,
              alignItems: 'center',
              gap: 10,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                backgroundColor: category.color + '22',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={category.icon as never} size={30} color={category.color} />
            </View>
            <AppText weight="bold" size={20}>
              {category.name}
            </AppText>
            <AppText size={12} color={Colors.textMuted}>
              Monthly spending limit
            </AppText>
          </View>

          {/* Amount input */}
          <View>
            <AppText
              size={11}
              color={Colors.textMuted}
              weight="semiBold"
              style={{ letterSpacing: 1.2, marginBottom: 10 }}
            >
              MONTHLY BUDGET
            </AppText>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: Colors.surface,
                borderWidth: 1,
                borderColor: valid ? category.color : Colors.border,
                borderRadius: Radius.lg,
                paddingHorizontal: 16,
                paddingVertical: 4,
              }}
            >
              <AppText weight="bold" size={20} color={Colors.textMuted}>
                {currency}
              </AppText>
              <TextInput
                value={amount}
                onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))}
                placeholder="0.00"
                placeholderTextColor={Colors.textDim}
                keyboardType="decimal-pad"
                autoFocus={!hadBudget}
                selectionColor={category.color}
                style={{
                  flex: 1,
                  color: Colors.text,
                  fontFamily: 'Inter_700Bold',
                  fontSize: 28,
                  paddingVertical: 12,
                }}
              />
            </View>

            {/* Quick amounts */}
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 8,
                marginTop: 12,
              }}
            >
              {QUICK.map((q) => {
                const selected = parsed === q;
                return (
                  <Pressable
                    key={q}
                    onPress={() => setAmount(String(q))}
                    style={({ pressed }) => ({
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: Radius.pill,
                      backgroundColor: selected ? category.color + '22' : Colors.surface,
                      borderWidth: 1,
                      borderColor: selected ? category.color : Colors.border,
                      opacity: pressed ? 0.75 : 1,
                    })}
                  >
                    <AppText
                      size={12}
                      weight="semiBold"
                      color={selected ? category.color : Colors.textSecondary}
                    >
                      {formatCompact(q, currency)}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Live preview */}
          {valid ? (
            <View
              style={{
                backgroundColor: Colors.surface,
                borderRadius: Radius.lg,
                padding: Spacing.lg,
                borderWidth: 1,
                borderColor: Colors.borderSubtle,
                gap: 12,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <AppText
                  size={11}
                  color={Colors.textMuted}
                  weight="semiBold"
                  style={{ letterSpacing: 1 }}
                >
                  THIS MONTH PREVIEW
                </AppText>
                <AppText
                  weight="bold"
                  size={14}
                  color={
                    previewPct > 100
                      ? Colors.expense
                      : previewPct >= 80
                      ? Colors.warn
                      : Colors.income
                  }
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {previewPct.toFixed(0)}% used
                </AppText>
              </View>
              <ProgressBar
                value={spent}
                max={parsed}
                color={
                  previewPct > 100
                    ? Colors.expense
                    : previewPct >= 80
                    ? Colors.warn
                    : category.color
                }
                height={8}
                showOverflow
              />
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <View>
                  <AppText size={11} color={Colors.textMuted}>
                    Spent
                  </AppText>
                  <AppText
                    weight="semiBold"
                    size={14}
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {formatCompact(spent, currency)}
                  </AppText>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <AppText size={11} color={Colors.textMuted}>
                    {previewRemaining >= 0 ? 'Left' : 'Over'}
                  </AppText>
                  <AppText
                    weight="semiBold"
                    size={14}
                    color={previewRemaining >= 0 ? Colors.income : Colors.expense}
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {formatCompact(Math.abs(previewRemaining), currency)}
                  </AppText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <AppText size={11} color={Colors.textMuted}>
                    Per day
                  </AppText>
                  <AppText
                    weight="semiBold"
                    size={14}
                    color={Colors.gold}
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {formatCompact(dailyAllowance, currency)}
                  </AppText>
                </View>
              </View>
            </View>
          ) : null}

          {/* Info */}
          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              padding: Spacing.md,
              backgroundColor: Colors.surfaceAlt,
              borderRadius: Radius.md,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <Ionicons name="information-circle" size={16} color={Colors.info} />
            <AppText
              size={12}
              color={Colors.textSecondary}
              style={{ flex: 1, lineHeight: 17 }}
            >
              Budgets reset automatically every month and include spending from all
              subcategories of {category.name}.
            </AppText>
          </View>
        </ScrollView>

        {/* Footer actions */}
        <View
          style={{
            padding: Spacing.lg,
            paddingBottom: insets.bottom + Spacing.md,
            gap: 10,
            borderTopWidth: 1,
            borderTopColor: Colors.borderSubtle,
            backgroundColor: Colors.bg,
          }}
        >
          <Button
            label={hadBudget ? 'Save budget' : 'Set budget'}
            icon="checkmark"
            onPress={handleSave}
            disabled={!valid}
          />
          {hadBudget ? (
            <Button
              label="Remove budget"
              variant="ghost"
              icon="trash-outline"
              onPress={handleRemove}
            />
          ) : null}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
