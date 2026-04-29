import React, { useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, formatCompact, formatCurrency } from '@/constants/theme';
import { AppText, Button, Card, Empty, IconButton, ProgressBar } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { formatDate } from '@/utils/finance';
import type { SavingsGoal } from '@/store/types';

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const goals = useAppStore((s) => s.savingsGoals);
  const deleteGoal = useAppStore((s) => s.deleteGoal);
  const contributeGoal = useAppStore((s) => s.contributeGoal);

  const [contribFor, setContribFor] = useState<SavingsGoal | null>(null);
  const [contribAmount, setContribAmount] = useState('');

  const totalTarget = goals.reduce((a, g) => a + g.targetAmount, 0);
  const totalSaved = goals.reduce((a, g) => a + g.currentAmount, 0);
  const overallPct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const handleContribute = () => {
    if (!contribFor) return;
    const amt = parseFloat(contribAmount);
    if (!isNaN(amt) && amt > 0) {
      contributeGoal(contribFor.id, amt);
    }
    setContribFor(null);
    setContribAmount('');
  };

  const handleDelete = (id: string) => {
    if (Platform.OS === 'web') {
      deleteGoal(id);
      return;
    }
    Alert.alert('Delete goal?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(id) },
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
          Savings Goals
        </AppText>
        <IconButton
          icon="add"
          background={Colors.gold}
          color={Colors.bg}
          onPress={() => router.push('/goals/new')}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120, gap: Spacing.lg }}>
        {/* Overall progress */}
        {goals.length > 0 ? (
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
                top: -20,
                width: 140,
                height: 140,
                borderRadius: 70,
                backgroundColor: Colors.income + '18',
              }}
            />
            <AppText size={11} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1 }}>
              COMBINED PROGRESS
            </AppText>
            <AppText weight="bold" size={30} style={{ marginTop: 6, fontVariant: ['tabular-nums'] }}>
              {formatCurrency(totalSaved)}
            </AppText>
            <AppText size={12} color={Colors.textSecondary}>
              of {formatCurrency(totalTarget)} target
            </AppText>
            <View style={{ marginTop: Spacing.md }}>
              <ProgressBar value={totalSaved} max={totalTarget} color={Colors.income} height={10} />
            </View>
            <AppText size={11} color={Colors.textMuted} style={{ marginTop: 6 }}>
              {overallPct.toFixed(1)}% achieved across {goals.length} goals
            </AppText>
          </View>
        ) : null}

        {goals.length === 0 ? (
          <Empty
            icon="flag"
            title="No savings goals yet"
            subtitle="Set a target and start saving toward something meaningful."
            action={<Button label="Create first goal" icon="add" onPress={() => router.push('/goals/new')} />}
          />
        ) : null}

        {goals.map((g) => {
          const pct = (g.currentAmount / g.targetAmount) * 100;
          const remaining = Math.max(0, g.targetAmount - g.currentAmount);
          const daysLeft = Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000);
          return (
            <Card key={g.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: g.color + '22',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={g.icon as never} size={22} color={g.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText weight="bold" size={16}>
                    {g.name}
                  </AppText>
                  <AppText size={11} color={Colors.textMuted}>
                    {daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'} · {formatDate(g.deadline)}
                  </AppText>
                </View>
                <Pressable onPress={() => handleDelete(g.id)} style={{ padding: 6 }}>
                  <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
                </Pressable>
              </View>

              <View style={{ marginTop: Spacing.md, gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <AppText size={12} color={Colors.textSecondary}>
                    {formatCurrency(g.currentAmount)} of {formatCurrency(g.targetAmount)}
                  </AppText>
                  <AppText size={12} weight="semiBold" color={g.color}>
                    {pct.toFixed(0)}%
                  </AppText>
                </View>
                <ProgressBar value={g.currentAmount} max={g.targetAmount} color={g.color} height={10} />
                <AppText size={11} color={Colors.textMuted} style={{ marginTop: 4 }}>
                  {formatCompact(remaining)} to go · {g.contributions.length} contributions
                </AppText>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: Spacing.md }}>
                <Button
                  label="Add contribution"
                  icon="add-circle"
                  onPress={() => setContribFor(g)}
                  style={{ flex: 1 }}
                  small
                />
                <Button
                  label="Details"
                  icon="chevron-forward"
                  variant="ghost"
                  onPress={() => {}}
                  style={{ flex: 1 }}
                  small
                />
              </View>
            </Card>
          );
        })}
      </ScrollView>

      {/* Contribution modal */}
      <Modal visible={!!contribFor} transparent animationType="fade" onRequestClose={() => setContribFor(null)}>
        <Pressable
          onPress={() => setContribFor(null)}
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
              gap: Spacing.md,
            }}
          >
            <AppText weight="bold" size={18}>
              Contribute to {contribFor?.name}
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
                value={contribAmount}
                onChangeText={setContribAmount}
                placeholder="0.00"
                placeholderTextColor={Colors.textDim}
                keyboardType="decimal-pad"
                autoFocus
                style={{
                  color: Colors.text,
                  fontFamily: 'Inter_700Bold',
                  fontSize: 28,
                  paddingVertical: 4,
                }}
              />
            </View>
            <Button label="Save Contribution" icon="checkmark" onPress={handleContribute} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
