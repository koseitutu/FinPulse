import React, { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { AppText } from '@/components/ui';

interface DatePickerFieldProps {
  value: string; // ISO date string
  onChange: (iso: string) => void;
  label?: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export function DatePickerField({ value, onChange, label = 'DATE' }: DatePickerFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const date = new Date(value);

  const handleChange = (_event: unknown, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selected) {
      // Preserve time from original date
      const original = new Date(value);
      selected.setHours(original.getHours(), original.getMinutes(), original.getSeconds());
      onChange(selected.toISOString());
    }
  };

  if (Platform.OS === 'android') {
    return (
      <View>
        <AppText size={11} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1, marginBottom: 6 }}>
          {label}
        </AppText>
        <Pressable
          onPress={() => setShowPicker(true)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: Colors.surface,
            borderRadius: Radius.md,
            borderWidth: 1,
            borderColor: Colors.border,
            paddingHorizontal: Spacing.md,
            paddingVertical: 12,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="calendar-outline" size={16} color={Colors.textMuted} />
          <AppText size={15} color={Colors.text} style={{ flex: 1 }}>
            {formatDate(value)}
          </AppText>
          <Ionicons name="chevron-down" size={14} color={Colors.textMuted} />
        </Pressable>
        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleChange}
            maximumDate={new Date(2100, 11, 31)}
            minimumDate={new Date(2000, 0, 1)}
          />
        )}
      </View>
    );
  }

  // iOS — compact inline picker with modal for full calendar
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
          paddingVertical: 6,
        }}
      >
        <Ionicons name="calendar-outline" size={16} color={Colors.textMuted} />
        <DateTimePicker
          value={date}
          mode="date"
          display="compact"
          onChange={handleChange}
          maximumDate={new Date(2100, 11, 31)}
          minimumDate={new Date(2000, 0, 1)}
          style={{ flex: 1, marginLeft: 4 }}
          accentColor={Colors.gold}
          themeVariant="dark"
        />
      </View>
    </View>
  );
}
