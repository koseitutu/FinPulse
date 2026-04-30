import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { FontMap } from '@/constants/Typography';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View } from 'react-native';
import { Colors } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts(FontMap);
  const processDueRecurring = useAppStore((s) => s.processDueRecurring);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
      processDueRecurring();
    }
  }, [loaded, error, processDueRecurring]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: Colors.bg }}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.bg },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="accounts/index" />
            <Stack.Screen name="categories/index" />
            <Stack.Screen name="budgets/index" />
            <Stack.Screen name="budgets/new" options={{ presentation: 'modal' }} />
            <Stack.Screen name="budgets/[id]" options={{ presentation: 'modal' }} />
            <Stack.Screen name="recurring/index" />
            <Stack.Screen name="recurring/new" options={{ presentation: 'modal' }} />
            <Stack.Screen name="archive/index" />
            <Stack.Screen name="dashboard/settings" />
            <Stack.Screen name="transfers/index" />
            <Stack.Screen name="transfers/new" options={{ presentation: 'modal' }} />
            <Stack.Screen name="transactions/new" options={{ presentation: 'modal' }} />
            <Stack.Screen name="transactions/[id]" options={{ presentation: 'modal' }} />
            <Stack.Screen name="search" options={{ presentation: 'modal' }} />
            <Stack.Screen name="settings/index" />
            <Stack.Screen name="data/index" />
          </Stack>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
