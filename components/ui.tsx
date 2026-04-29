import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  Text,
  TextProps,
  TextStyle,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Fonts } from '@/constants/Typography';

export function Card({
  style,
  children,
  ...rest
}: ViewProps & { children?: React.ReactNode }) {
  return (
    <View
      style={[
        {
          backgroundColor: Colors.surface,
          borderRadius: Radius.lg,
          padding: Spacing.lg,
          borderWidth: 1,
          borderColor: Colors.borderSubtle,
          borderCurve: 'continuous',
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

export function GlassCard({ style, children, ...rest }: ViewProps & { children?: React.ReactNode }) {
  return (
    <View
      style={[
        {
          backgroundColor: Colors.surfaceAlt,
          borderRadius: Radius.xl,
          padding: Spacing.lg,
          borderWidth: 1,
          borderColor: Colors.border,
          borderCurve: 'continuous',
          boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
        } as ViewStyle,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

type TypographyProps = TextProps & {
  weight?: keyof typeof Fonts;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
};

export function AppText({ weight = 'regular', size = 14, color = Colors.text, style, ...rest }: TypographyProps) {
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: Fonts[weight],
          fontSize: size,
          color,
        },
        style,
      ]}
    />
  );
}

export function SectionHeader({
  title,
  action,
  subtitle,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
      }}
    >
      <View style={{ flex: 1 }}>
        <AppText weight="semiBold" size={18}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText size={12} color={Colors.textMuted} style={{ marginTop: 2 }}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {action}
    </View>
  );
}

export function Chip({
  label,
  active,
  color,
  onPress,
  icon,
}: {
  label: string;
  active?: boolean;
  color?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}) {
  const accent = color ?? Colors.gold;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: Radius.pill,
        backgroundColor: active ? accent + '22' : Colors.surfaceAlt,
        borderWidth: 1,
        borderColor: active ? accent : Colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {icon ? <Ionicons name={icon} size={12} color={active ? accent : Colors.textSecondary} /> : null}
      <AppText size={12} weight="medium" color={active ? accent : Colors.textSecondary}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function Badge({ text, color = Colors.gold }: { text: string; color?: string }) {
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: Radius.pill,
        backgroundColor: color + '22',
        alignSelf: 'flex-start',
      }}
    >
      <AppText size={10} weight="semiBold" color={color}>
        {text.toUpperCase()}
      </AppText>
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  style,
  small,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const bg =
    variant === 'primary'
      ? Colors.gold
      : variant === 'danger'
      ? Colors.expense
      : variant === 'secondary'
      ? Colors.surfaceHigh
      : 'transparent';
  const fg =
    variant === 'primary'
      ? Colors.bg
      : variant === 'ghost'
      ? Colors.text
      : variant === 'danger'
      ? Colors.text
      : Colors.text;
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderRadius: Radius.md,
          paddingVertical: small ? 10 : 14,
          paddingHorizontal: small ? 14 : 18,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderColor: Colors.border,
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={small ? 14 : 16} color={fg} /> : null}
      <AppText weight="semiBold" color={fg} size={small ? 13 : 15}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function IconCircle({
  icon,
  color = Colors.gold,
  size = 40,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color + '22',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={icon} size={size * 0.5} color={color} />
    </View>
  );
}

export function ProgressBar({
  value,
  max,
  color = Colors.gold,
  height = 8,
  background = Colors.surfaceHigh,
  showOverflow,
}: {
  value: number;
  max: number;
  color?: string;
  height?: number;
  background?: string;
  showOverflow?: boolean;
}) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const over = showOverflow && value > max;
  return (
    <View
      style={{
        height,
        borderRadius: height / 2,
        backgroundColor: background,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${pct * 100}%`,
          height: '100%',
          backgroundColor: over ? Colors.expense : color,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}

export function Divider() {
  return <View style={{ height: 1, backgroundColor: Colors.borderSubtle }} />;
}

export function Empty({ icon, title, subtitle, action }: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={{ alignItems: 'center', padding: Spacing.xl, gap: 10 }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: Colors.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: Colors.border,
        }}
      >
        <Ionicons name={icon} size={30} color={Colors.textMuted} />
      </View>
      <AppText weight="semiBold" size={16}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText size={13} color={Colors.textMuted} style={{ textAlign: 'center' }}>
          {subtitle}
        </AppText>
      ) : null}
      {action}
    </View>
  );
}

export function IconButton({
  icon,
  onPress,
  color = Colors.text,
  background = Colors.surface,
  size = 40,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  color?: string;
  background?: string;
  size?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Ionicons name={icon} size={size * 0.45} color={color} />
    </Pressable>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  right,
  onBack,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onBack?: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingBottom: Spacing.lg,
      }}
    >
      {onBack ? (
        <IconButton icon="chevron-back" onPress={onBack} size={36} />
      ) : null}
      <View style={{ flex: 1 }}>
        <AppText weight="bold" size={24}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText size={12} color={Colors.textMuted}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export function SwipeablePressable({
  children,
  onPress,
  style,
  ...props
}: PressableProps & { style?: StyleProp<ViewStyle>; children?: React.ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.7 : 1,
        },
        style as ViewStyle,
      ]}
      {...props}
    >
      {children}
    </Pressable>
  );
}
