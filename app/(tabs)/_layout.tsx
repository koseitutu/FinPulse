import React from 'react';
import { Pressable, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { AppText } from '@/components/ui';

const TABS: { name: string; title: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { name: 'index', title: 'Home', icon: 'home' },
  { name: 'transactions', title: 'Activity', icon: 'swap-horizontal' },
  { name: 'insights', title: 'Insights', icon: 'stats-chart' },
  { name: 'more', title: 'More', icon: 'grid' },
];

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => (
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: Colors.bgElevated,
            borderTopColor: Colors.border,
            borderTopWidth: 1,
            paddingBottom: Math.max(insets.bottom, 8),
            paddingTop: 10,
            position: 'relative',
          }}
        >
          {/* Left side: Home, Activity */}
          {TABS.slice(0, 2).map((tab) => {
            const routeIndex = props.state.routes.findIndex((r) => r.name === tab.name);
            const focused = props.state.index === routeIndex;
            return (
              <Pressable
                key={tab.name}
                onPress={() => props.navigation.navigate(tab.name as never)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  gap: 4,
                  paddingVertical: 6,
                }}
              >
                <Ionicons name={tab.icon} size={22} color={focused ? Colors.gold : Colors.textMuted} />
                <AppText size={10} weight={focused ? 'semiBold' : 'regular'} color={focused ? Colors.gold : Colors.textMuted}>
                  {tab.title}
                </AppText>
              </Pressable>
            );
          })}

          {/* Center Scan */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Pressable
              onPress={() => router.push('/scanner')}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: Colors.gold,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: -24,
                borderWidth: 4,
                borderColor: Colors.bgElevated,
                boxShadow: '0 8px 20px rgba(244,185,66,0.4)',
              }}
            >
              <Ionicons name="scan" size={26} color={Colors.bg} />
            </Pressable>
          </View>

          {/* Right side: Insights, More */}
          {TABS.slice(2).map((tab) => {
            const routeIndex = props.state.routes.findIndex((r) => r.name === tab.name);
            const focused = props.state.index === routeIndex;
            return (
              <Pressable
                key={tab.name}
                onPress={() => props.navigation.navigate(tab.name as never)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  gap: 4,
                  paddingVertical: 6,
                }}
              >
                <Ionicons name={tab.icon} size={22} color={focused ? Colors.gold : Colors.textMuted} />
                <AppText size={10} weight={focused ? 'semiBold' : 'regular'} color={focused ? Colors.gold : Colors.textMuted}>
                  {tab.title}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="transactions" />
      <Tabs.Screen name="insights" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
