import React from 'react';
import { Alert, Platform, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, formatCompact, useTheme } from '@/constants/theme';
import { AppText, Badge, Card, Empty, IconButton, SectionHeader } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { formatRelative } from '@/utils/finance';

export default function RecurringScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  useTheme();
  const recurring = useAppStore((s) => s.recurring);
  const categories = useAppStore((s) => s.categories);
  const accounts = useAppStore((s) => s.accounts);
  const toggleRecurring = useAppStore((s) => s.toggleRecurring);
  const deleteRecurring = useAppStore((s) => s.deleteRecurring);

  const active = recurring.filter((r) => r.isActive).sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
  const paused = recurring.filter((r) => !r.isActive);

  const monthlyImpact = active.reduce((acc, r) => {
    const factor = r.frequency === 'monthly' ? 1 : r.frequency === 'weekly' ? 4.33 : r.frequency === 'biweekly' ? 2.17 : r.frequency === 'daily' ? 30 : r.frequency === 'yearly' ? 1 / 12 : 1;
    return acc + (r.type === 'income' ? r.amount : -r.amount) * factor;
  }, 0);

  const handleDelete = (id: string) => {
    if (Platform.OS === 'web') {
      deleteRecurring(id);
      return;
    }
    Alert.alert('Delete recurring?', 'This removes the schedule.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteRecurring(id) },
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
          Recurring
        </AppText>
        <IconButton
          icon="add"
          background={Colors.gold}
          color={Colors.bg}
          onPress={() => router.push('/recurring/new')}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120, gap: Spacing.lg }}>
        <Card>
          <AppText size={11} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1 }}>
            MONTHLY NET IMPACT
          </AppText>
          <AppText
            weight="bold"
            size={30}
            color={monthlyImpact >= 0 ? Colors.income : Colors.expense}
            style={{ marginTop: 4, fontVariant: ['tabular-nums'] }}
          >
            {monthlyImpact >= 0 ? '+' : ''}
            {formatCompact(monthlyImpact)}
          </AppText>
          <AppText size={11} color={Colors.textMuted} style={{ marginTop: 4 }}>
            {active.length} active · {paused.length} paused
          </AppText>
        </Card>

        {active.length === 0 && paused.length === 0 ? (
          <Empty
            icon="repeat"
            title="No recurring schedules"
            subtitle="Automate rent, subscriptions, salary and more."
          />
        ) : null}

        {active.length > 0 ? (
          <View>
            <SectionHeader title="Upcoming" subtitle="Active schedules" />
            <View style={{ gap: 10 }}>
              {active.map((r) => {
                const cat = categories.find((c) => c.id === r.categoryId);
                const acc = accounts.find((a) => a.id === r.accountId);
                const overdue = new Date(r.nextDueDate).getTime() < Date.now();
                const color = r.type === 'income' ? Colors.income : cat?.color ?? Colors.expense;
                return (
                  <View
                    key={r.id}
                    style={{
                      backgroundColor: Colors.surface,
                      borderRadius: Radius.lg,
                      padding: Spacing.md,
                      borderWidth: 1,
                      borderColor: overdue ? Colors.expense + '66' : Colors.borderSubtle,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        backgroundColor: color + '22',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name={(cat?.icon as never) ?? 'repeat'} size={20} color={color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <AppText weight="semiBold" size={14}>
                          {r.name}
                        </AppText>
                        {overdue ? <Badge text="Due" color={Colors.expense} /> : null}
                      </View>
                      <AppText size={11} color={Colors.textMuted}>
                        {r.frequency} · {acc?.name} · next {formatRelative(r.nextDueDate)}
                      </AppText>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <AppText weight="semiBold" size={14} color={r.type === 'income' ? Colors.income : Colors.text}>
                        {r.type === 'income' ? '+' : '-'}
                        {formatCompact(r.amount)}
                      </AppText>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <Pressable onPress={() => toggleRecurring(r.id)} hitSlop={8}>
                          <Ionicons name="pause" size={14} color={Colors.textMuted} />
                        </Pressable>
                        <Pressable onPress={() => handleDelete(r.id)} hitSlop={8}>
                          <Ionicons name="trash-outline" size={14} color={Colors.textMuted} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {paused.length > 0 ? (
          <View>
            <SectionHeader title="Paused" />
            <View style={{ gap: 10 }}>
              {paused.map((r) => {
                const cat = categories.find((c) => c.id === r.categoryId);
                return (
                  <Pressable
                    key={r.id}
                    onPress={() => toggleRecurring(r.id)}
                    style={{
                      backgroundColor: Colors.surface,
                      borderRadius: Radius.lg,
                      padding: Spacing.md,
                      borderWidth: 1,
                      borderColor: Colors.borderSubtle,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      opacity: 0.65,
                    }}
                  >
                    <Ionicons name={(cat?.icon as never) ?? 'repeat'} size={20} color={Colors.textMuted} />
                    <View style={{ flex: 1 }}>
                      <AppText weight="semiBold" size={14}>
                        {r.name}
                      </AppText>
                      <AppText size={11} color={Colors.textMuted}>
                        {r.frequency} · tap to resume
                      </AppText>
                    </View>
                    <Ionicons name="play" size={14} color={Colors.gold} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
