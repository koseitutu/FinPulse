import React, { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { AppText, Button, Card, IconButton, SectionHeader } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';

const ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  'shield-checkmark',
  'airplane',
  'laptop',
  'home',
  'car',
  'school',
  'gift',
  'medkit',
  'heart',
  'star',
];
const COLORS = ['#F4B942', '#4DA6FF', '#2ECC71', '#B24DFF', '#FF8C42', '#2EC4B6', '#E74C3C'];

export default function NewGoalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const addGoal = useAppStore((s) => s.addGoal);
  const accounts = useAppStore((s) => s.accounts);

  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [icon, setIcon] = useState<keyof typeof Ionicons.glyphMap>('flag');
  const [color, setColor] = useState(Colors.gold);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [days, setDays] = useState('180');

  const handleCreate = () => {
    const t = parseFloat(target);
    const d = parseInt(days, 10);
    if (!name.trim() || isNaN(t) || t <= 0) return;
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + (isNaN(d) ? 180 : d));
    addGoal({
      name: name.trim(),
      targetAmount: t,
      currentAmount: 0,
      deadline: deadline.toISOString(),
      accountId,
      color,
      icon,
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
          New Goal
        </AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120, gap: Spacing.lg }}>
        <Card>
          <AppText size={11} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1 }}>
            GOAL NAME
          </AppText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Emergency fund"
            placeholderTextColor={Colors.textDim}
            style={{ color: Colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 18, paddingVertical: 6 }}
          />
        </Card>

        <Card>
          <AppText size={11} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1 }}>
            TARGET AMOUNT
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
            <AppText weight="bold" size={20} color={Colors.textMuted}>
              GHS
            </AppText>
            <TextInput
              value={target}
              onChangeText={setTarget}
              placeholder="0.00"
              placeholderTextColor={Colors.textDim}
              keyboardType="decimal-pad"
              style={{ flex: 1, color: Colors.text, fontFamily: 'Inter_700Bold', fontSize: 32 }}
            />
          </View>
        </Card>

        <Card>
          <AppText size={11} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1 }}>
            DEADLINE (DAYS FROM NOW)
          </AppText>
          <TextInput
            value={days}
            onChangeText={setDays}
            keyboardType="number-pad"
            placeholder="180"
            placeholderTextColor={Colors.textDim}
            style={{ color: Colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 18, paddingVertical: 6 }}
          />
        </Card>

        <View>
          <SectionHeader title="Icon" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {ICONS.map((i) => (
              <Pressable
                key={i}
                onPress={() => setIcon(i)}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  backgroundColor: icon === i ? color + '33' : Colors.surface,
                  borderWidth: 1,
                  borderColor: icon === i ? color : Colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={i} size={22} color={icon === i ? color : Colors.textSecondary} />
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <SectionHeader title="Color" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: c,
                  borderWidth: color === c ? 3 : 0,
                  borderColor: Colors.text,
                }}
              />
            ))}
          </View>
        </View>

        <View>
          <SectionHeader title="Linked account" subtitle="Optional" />
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

        <Button label="Create Goal" icon="checkmark" onPress={handleCreate} disabled={!name || !target} />
      </ScrollView>
    </View>
  );
}
