import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, useTheme } from '@/constants/theme';
import { AppText, IconButton } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { WIDGETS } from '@/components/widgets';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  useTheme();
  const preferences = useAppStore((s) => s.preferences);
  const dashboard = useAppStore((s) => s.dashboard);

  const QUICK_ACTIONS: { icon: keyof typeof Ionicons.glyphMap; label: string; href: string; color: string }[] = [
    { icon: 'add', label: 'Add', href: '/transactions/new', color: Colors.gold },
    { icon: 'wallet', label: 'Accounts', href: '/accounts', color: Colors.info },
    { icon: 'pricetags', label: 'Categories', href: '/categories', color: '#2EC4B6' },
    { icon: 'repeat', label: 'Recurring', href: '/recurring', color: '#B24DFF' },
    { icon: 'stats-chart', label: 'Insights', href: '/insights', color: Colors.income },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const visibleWidgets = dashboard.widgetOrder.filter((k) => dashboard.visibleWidgets[k]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + Spacing.md,
        paddingBottom: 100,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View>
          <AppText size={12} color={Colors.textMuted}>
            {greeting},
          </AppText>
          <AppText weight="bold" size={22}>
            {preferences.name}
          </AppText>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <IconButton icon="search" onPress={() => router.push('/search')} />
          <Link href="/dashboard/settings" asChild>
            <Pressable>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: Colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: Colors.border,
                }}
              >
                <Ionicons name="options" size={18} color={Colors.text} />
              </View>
            </Pressable>
          </Link>
        </View>
      </View>

      {/* Quick actions */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {QUICK_ACTIONS.map((a) => (
          <Pressable
            key={a.label}
            onPress={() => router.push(a.href as never)}
            style={{ flex: 1, alignItems: 'center', gap: 6 }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: a.color + '18',
                borderWidth: 1,
                borderColor: a.color + '33',
                alignItems: 'center',
                justifyContent: 'center',
                borderCurve: 'continuous',
              }}
            >
              <Ionicons name={a.icon} size={22} color={a.color} />
            </View>
            <AppText size={10} weight="medium" color={Colors.textSecondary}>
              {a.label}
            </AppText>
          </Pressable>
        ))}
      </View>

      {/* Widgets */}
      {visibleWidgets.map((key) => (
        <View key={key}>{WIDGETS[key].render()}</View>
      ))}

      {/* Extra quick links */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Link href="/recurring" asChild>
          <Pressable
            style={{
              flex: 1,
              padding: Spacing.md,
              borderRadius: 14,
              backgroundColor: Colors.surface,
              borderWidth: 1,
              borderColor: Colors.borderSubtle,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Ionicons name="repeat" size={18} color={Colors.gold} />
            <AppText size={13} weight="medium">
              Recurring
            </AppText>
          </Pressable>
        </Link>
        <Link href="/archive" asChild>
          <Pressable
            style={{
              flex: 1,
              padding: Spacing.md,
              borderRadius: 14,
              backgroundColor: Colors.surface,
              borderWidth: 1,
              borderColor: Colors.borderSubtle,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Ionicons name="archive" size={18} color={Colors.info} />
            <AppText size={13} weight="medium">
              Archive
            </AppText>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}
