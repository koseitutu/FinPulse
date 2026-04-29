import React, { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { AppText, Button, Card, IconButton } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';

export default function NewDebtScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const addDebt = useAppStore((s) => s.addDebt);

  const [type, setType] = useState<'owed' | 'lent'>('owed');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [amount, setAmount] = useState('');
  const [days, setDays] = useState('30');
  const [notes, setNotes] = useState('');

  const handleCreate = () => {
    const amt = parseFloat(amount);
    if (!name.trim() || !contact.trim() || isNaN(amt) || amt <= 0) return;
    const d = new Date();
    d.setDate(d.getDate() + (parseInt(days, 10) || 30));
    addDebt({
      name: name.trim(),
      contactName: contact.trim(),
      amount: amt,
      type,
      dueDate: d.toISOString(),
      notes: notes.trim() || undefined,
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
          New Debt
        </AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120, gap: Spacing.lg }}>
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
          {(['owed', 'lent'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 8,
                backgroundColor: type === t ? (t === 'owed' ? Colors.expense : Colors.income) : 'transparent',
                alignItems: 'center',
              }}
            >
              <AppText size={13} weight="semiBold" color={type === t ? Colors.text : Colors.textSecondary}>
                {t === 'owed' ? 'I owe' : 'Owed to me'}
              </AppText>
            </Pressable>
          ))}
        </View>

        <Card>
          <AppText size={11} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1 }}>
            NAME
          </AppText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Loan from Kofi"
            placeholderTextColor={Colors.textDim}
            style={{ color: Colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 18, paddingVertical: 6 }}
          />
        </Card>

        <Card>
          <AppText size={11} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1 }}>
            CONTACT NAME
          </AppText>
          <TextInput
            value={contact}
            onChangeText={setContact}
            placeholder="Kofi Mensah"
            placeholderTextColor={Colors.textDim}
            style={{ color: Colors.text, fontFamily: 'Inter_500Medium', fontSize: 15, paddingVertical: 6 }}
          />
        </Card>

        <Card>
          <AppText size={11} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1 }}>
            AMOUNT
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
            <AppText weight="bold" size={20} color={Colors.textMuted}>
              GHS
            </AppText>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={Colors.textDim}
              keyboardType="decimal-pad"
              style={{ flex: 1, color: Colors.text, fontFamily: 'Inter_700Bold', fontSize: 32 }}
            />
          </View>
        </Card>

        <Card>
          <AppText size={11} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1 }}>
            DUE IN (DAYS)
          </AppText>
          <TextInput
            value={days}
            onChangeText={setDays}
            keyboardType="number-pad"
            placeholder="30"
            placeholderTextColor={Colors.textDim}
            style={{ color: Colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 18, paddingVertical: 6 }}
          />
        </Card>

        <Card>
          <AppText size={11} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1 }}>
            NOTES
          </AppText>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional…"
            placeholderTextColor={Colors.textDim}
            multiline
            style={{ color: Colors.text, fontFamily: 'Inter_400Regular', fontSize: 14, minHeight: 60, textAlignVertical: 'top' }}
          />
        </Card>

        <Button
          label="Add Debt"
          icon="checkmark"
          onPress={handleCreate}
          disabled={!name || !contact || !amount}
        />
      </ScrollView>
    </View>
  );
}
