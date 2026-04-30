import React from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, useTheme } from '@/constants/theme';
import { AppText, Card, IconButton, IconCircle, SectionHeader } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { WIDGETS } from '@/components/widgets';
import type { WidgetKey } from '@/store/types';

export default function DashboardSettings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  useTheme();
  const dashboard = useAppStore((s) => s.dashboard);
  const toggleWidget = useAppStore((s) => s.toggleWidget);
  const setOrder = useAppStore((s) => s.setDashboardOrder);

  const move = (key: WidgetKey, delta: number) => {
    const idx = dashboard.widgetOrder.indexOf(key);
    if (idx < 0) return;
    const newIdx = Math.max(0, Math.min(dashboard.widgetOrder.length - 1, idx + delta));
    const arr = [...dashboard.widgetOrder];
    arr.splice(idx, 1);
    arr.splice(newIdx, 0, key);
    setOrder(arr);
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
          Dashboard
        </AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120, gap: Spacing.lg }}>
        <Card tone="purple">
          <SectionHeader
            title="Customize your home"
            subtitle="Toggle what shows up. Use arrows to reorder."
          />
          <View style={{ gap: 10 }}>
            {dashboard.widgetOrder.map((key, i) => {
              const w = WIDGETS[key];
              const visible = dashboard.visibleWidgets[key];
              return (
                <View
                  key={key}
                  style={{
                    backgroundColor: Colors.bgElevated,
                    borderRadius: Radius.lg,
                    padding: Spacing.md,
                    borderWidth: 1,
                    borderColor: Colors.borderSubtle,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    opacity: visible ? 1 : 0.55,
                  }}
                >
                  <View style={{ gap: 4 }}>
                    <Pressable
                      onPress={() => move(key, -1)}
                      disabled={i === 0}
                      style={{ opacity: i === 0 ? 0.3 : 1 }}
                      hitSlop={6}
                    >
                      <Ionicons name="chevron-up" size={18} color={Colors.text} />
                    </Pressable>
                    <Pressable
                      onPress={() => move(key, 1)}
                      disabled={i === dashboard.widgetOrder.length - 1}
                      style={{ opacity: i === dashboard.widgetOrder.length - 1 ? 0.3 : 1 }}
                      hitSlop={6}
                    >
                      <Ionicons name="chevron-down" size={18} color={Colors.text} />
                    </Pressable>
                  </View>
                  <IconCircle icon={w.icon} color={Colors.gold} size={36} />
                  <View style={{ flex: 1 }}>
                    <AppText weight="semiBold" size={14}>
                      {w.label}
                    </AppText>
                    <AppText size={11} color={Colors.textMuted}>
                      Position {i + 1}
                    </AppText>
                  </View>
                  <Switch
                    value={visible}
                    onValueChange={() => toggleWidget(key)}
                    trackColor={{ true: Colors.gold, false: Colors.surfaceHigh }}
                    thumbColor={Colors.bgElevated}
                  />
                </View>
              );
            })}
          </View>
        </Card>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: Colors.info + '15',
            borderRadius: Radius.md,
            padding: Spacing.md,
            borderWidth: 1,
            borderColor: Colors.info + '33',
          }}
        >
          <Ionicons name="information-circle" size={16} color={Colors.info} />
          <AppText size={12} color={Colors.textSecondary} style={{ flex: 1 }}>
            Changes take effect immediately. Reorder with the arrows on the left.
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}
