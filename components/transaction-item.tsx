import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Colors, Radius, Spacing, formatCurrency } from '@/constants/theme';
import { AppText } from '@/components/ui';
import { formatRelative } from '@/utils/finance';
import type { Transaction, Category, Account, Tag } from '@/store/types';

export interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
  subcategory?: Category;
  account?: Account;
  tags?: Tag[];
  /** @deprecated Cards are self-contained — no longer draws a separator line. Kept for API compat. */
  showSeparator?: boolean;
  selectMode?: boolean;
  isSelected?: boolean;
  onLongPress?: () => void;
  onPress?: () => void;
  /** Render without Link wrapper (e.g. in archive where tapping row isn't navigation) */
  noLink?: boolean;
  /** Extra content after the two metadata lines (e.g. tags row) */
  renderBelow?: React.ReactNode;
  /** Override right-side second line. Defaults to formatRelative(date) */
  dateLabel?: string;
}

export function TransactionItem({
  transaction: t,
  category: cat,
  subcategory: sub,
  account: acc,
  tags = [],
  showSeparator: _deprecated,
  selectMode = false,
  isSelected = false,
  onLongPress,
  onPress,
  noLink = false,
  renderBelow,
  dateLabel,
}: TransactionItemProps) {
  const color = t.type === 'income' ? Colors.income : cat?.color ?? Colors.expense;
  const amountColor = t.type === 'income' ? Colors.income : Colors.expense;

  const metaLine = [cat?.name, sub?.name, acc?.name].filter(Boolean).join(' · ');
  const rightDate = dateLabel ?? formatRelative(t.date);

  const rowContent = (
    <Pressable
      onLongPress={selectMode ? undefined : onLongPress}
      onPress={onPress}
      style={({ pressed }) => ({
        // Card appearance
        backgroundColor: isSelected ? Colors.gold + '18' : Colors.surface,
        borderRadius: Radius.lg,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: isSelected ? Colors.gold + '55' : Colors.border,
        boxShadow: '0 1px 3px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        // Row layout
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: Spacing.md,
        paddingVertical: 13,
        opacity: pressed ? 0.72 : 1,
      })}
    >
      {/* Checkbox in select mode */}
      {selectMode && (
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            borderWidth: 2,
            borderColor: isSelected ? Colors.gold : Colors.border,
            backgroundColor: isSelected ? Colors.gold : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isSelected && <Ionicons name="checkmark" size={13} color={Colors.bg} />}
        </View>
      )}

      {/* Category icon — rounded square */}
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          borderCurve: 'continuous',
          backgroundColor: color + '20',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Ionicons name={(cat?.icon as never) ?? 'pricetag'} size={20} color={color} />
      </View>

      {/* Middle: name + category • account */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <AppText
            weight="bold"
            size={15}
            numberOfLines={1}
            style={{ flex: 1 }}
          >
            {t.merchant || cat?.name || 'Transaction'}
          </AppText>
          {t.isRecurring ? (
            <Ionicons name="repeat" size={11} color={Colors.gold} style={{ flexShrink: 0 }} />
          ) : null}
        </View>
        <AppText size={12} color={Colors.textMuted} numberOfLines={1} style={{ marginTop: 1 }}>
          {metaLine || 'Uncategorized'}
        </AppText>
        {renderBelow}
      </View>

      {/* Right: amount + date */}
      <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
        <AppText
          weight="bold"
          size={15}
          color={amountColor}
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {t.type === 'income' ? '+' : '-'}
          {formatCurrency(t.amount, t.currency)}
        </AppText>
        <AppText size={11} color={Colors.textMuted} style={{ marginTop: 1 }}>
          {rightDate}
        </AppText>
      </View>
    </Pressable>
  );

  if (noLink) return rowContent;

  return (
    <Link href={{ pathname: '/transactions/[id]', params: { id: t.id } }} asChild>
      {rowContent}
    </Link>
  );
}
