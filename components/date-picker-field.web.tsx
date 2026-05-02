import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { AppText } from '@/components/ui';

interface DatePickerFieldProps {
  value: string; // ISO date string
  onChange: (iso: string) => void;
  label?: string;
}

function toInputValue(iso: string): string {
  // Convert ISO to YYYY-MM-DD for <input type="date">
  return iso.split('T')[0];
}

export function DatePickerField({ value, onChange, label = 'DATE' }: DatePickerFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // YYYY-MM-DD
    if (!val) return;
    // Preserve time from original
    const original = new Date(value);
    const [year, month, day] = val.split('-').map(Number);
    const next = new Date(original);
    next.setFullYear(year, month - 1, day);
    onChange(next.toISOString());
  };

  return (
    <View>
      <AppText size={11} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1, marginBottom: 6 }}>
        {label}
      </AppText>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: Colors.surface,
          borderRadius: Radius.md,
          borderWidth: 1,
          borderColor: Colors.border,
          paddingHorizontal: Spacing.md,
          paddingVertical: 12,
        }}
      >
        <Ionicons name="calendar-outline" size={16} color={Colors.textMuted} />
        {/* @ts-ignore – web-only input element */}
        <input
          type="date"
          value={toInputValue(value)}
          onChange={handleChange}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: Colors.text,
            fontFamily: 'Inter_400Regular, Inter, sans-serif',
            fontSize: 15,
            cursor: 'pointer',
          }}
        />
      </View>
    </View>
  );
}
