import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { AppText, Card, IconCircle, SectionHeader } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';

interface Item {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
  color: string;
  description?: string;
}

const MAIN: Item[] = [
  { label: 'Accounts', icon: 'wallet', href: '/accounts', color: Colors.gold, description: 'Manage wallets & cards' },
  { label: 'Categories', icon: 'pricetags', href: '/categories', color: '#2EC4B6', description: 'Organize spending' },
  { label: 'Budgets', icon: 'speedometer', href: '/insights', color: '#FF8C42', description: 'Track category limits' },
  { label: 'Recurring', icon: 'repeat', href: '/recurring', color: '#B24DFF', description: 'Manage schedules' },
  { label: 'Global Search', icon: 'search', href: '/search', color: Colors.info, description: 'Find anything' },
  { label: 'Archive', icon: 'archive', href: '/archive', color: Colors.textMuted, description: 'Old transactions' },
];

const TOOLS: Item[] = [
  { label: 'Dashboard Widgets', icon: 'grid', href: '/dashboard/settings', color: Colors.text },
  { label: 'Backup & Restore', icon: 'cloud-upload', href: '/data', color: Colors.info },
  { label: 'Settings', icon: 'settings', href: '/settings', color: Colors.text },
];

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const prefs = useAppStore((s) => s.preferences);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + Spacing.md,
        paddingBottom: 100,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.lg,
      }}
    >
      <AppText weight="bold" size={24}>
        More
      </AppText>

      {/* Profile card */}
      <View
        style={{
          backgroundColor: Colors.bgElevated,
          borderRadius: Radius.xl,
          padding: Spacing.lg,
          borderWidth: 1,
          borderColor: Colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: Colors.gold,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppText weight="bold" size={22} color={Colors.bg}>
            {prefs.name.charAt(0)}
          </AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText weight="bold" size={16}>
            {prefs.name}
          </AppText>
          <AppText size={12} color={Colors.textMuted}>
            FinPulse · {prefs.currency} default
          </AppText>
        </View>
        <Pressable
          onPress={() => router.push('/settings')}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 10,
            backgroundColor: Colors.surface,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <AppText size={12} weight="semiBold">
            Edit
          </AppText>
        </Pressable>
      </View>

      <Card>
        <SectionHeader title="Features" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {MAIN.map((item) => (
            <Link key={item.label} href={item.href as never} asChild>
              <Pressable
                style={({ pressed }) => ({
                  width: '48%',
                  backgroundColor: Colors.bgElevated,
                  borderRadius: Radius.lg,
                  padding: Spacing.md,
                  borderWidth: 1,
                  borderColor: Colors.borderSubtle,
                  gap: 8,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <IconCircle icon={item.icon} color={item.color} size={36} />
                <AppText weight="semiBold" size={13}>
                  {item.label}
                </AppText>
                {item.description ? (
                  <AppText size={11} color={Colors.textMuted}>
                    {item.description}
                  </AppText>
                ) : null}
              </Pressable>
            </Link>
          ))}
        </View>
      </Card>

      <Card>
        <SectionHeader title="Tools" />
        <View style={{ gap: 2 }}>
          {TOOLS.map((item, i) => (
            <Link key={item.label} href={item.href as never} asChild>
              <Pressable
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 12,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: Colors.borderSubtle,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Ionicons name={item.icon} size={18} color={item.color} />
                <AppText size={14} weight="medium" style={{ flex: 1 }}>
                  {item.label}
                </AppText>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </Pressable>
            </Link>
          ))}
        </View>
      </Card>

      <AppText size={11} color={Colors.textDim} style={{ textAlign: 'center', marginTop: Spacing.xl }}>
        FinPulse v1.0 · Local-first · Built for Ghana
      </AppText>
    </ScrollView>
  );
}
