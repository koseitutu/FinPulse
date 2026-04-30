import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, formatCompact, useTheme } from '@/constants/theme';
import { AppText, Button, Card, Chip, Empty, IconButton, SectionHeader } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import type { Category, TxType } from '@/store/types';

const ICONS: (keyof typeof import('@expo/vector-icons').Ionicons.glyphMap)[] = [
  'fast-food',
  'restaurant',
  'car',
  'car-sport',
  'flame',
  'bag',
  'cart',
  'basket',
  'game-controller',
  'medkit',
  'school',
  'home',
  'bulb',
  'water',
  'wifi',
  'flash',
  'briefcase',
  'laptop',
  'gift',
  'trending-up',
  'airplane',
  'barbell',
  'paw',
  'cafe',
  'beer',
  'film',
  'musical-notes',
  'pricetag',
  'wallet',
  'ticket',
];

const COLORS = [
  '#F4B942',
  '#4DA6FF',
  '#2ECC71',
  '#B24DFF',
  '#E74C3C',
  '#2EC4B6',
  '#FF8C42',
  '#FFD166',
  '#6C7E9B',
  '#FF6B9D',
];

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  useTheme();
  const categories = useAppStore((s) => s.categories);
  const transactions = useAppStore((s) => s.transactions);
  const addCategory = useAppStore((s) => s.addCategory);
  const updateCategory = useAppStore((s) => s.updateCategory);
  const deleteCategory = useAppStore((s) => s.deleteCategory);

  const [tab, setTab] = useState<TxType>('expense');
  const [editing, setEditing] = useState<Category | 'new' | null>(null);

  const listed = useMemo(
    () => categories.filter((c) => !c.parentId && c.type === tab),
    [categories, tab]
  );

  const countFor = (catId: string) =>
    transactions.filter(
      (t) =>
        t.categoryId === catId ||
        categories.find((x) => x.id === t.categoryId)?.parentId === catId
    ).length;

  const handleDelete = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    const linked = countFor(id);
    const confirm = () => deleteCategory(id);
    const msg =
      linked > 0
        ? `"${cat.name}" is used by ${linked} transactions. Deleting it will remove the category and its subcategories but transactions keep their reference.`
        : `Delete "${cat.name}"? This also removes its subcategories.`;
    if (Platform.OS === 'web') {
      confirm();
      return;
    }
    Alert.alert('Delete category?', msg, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: confirm },
    ]);
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
        <IconButton icon="chevron-back" onPress={() => router.back()} />
        <AppText weight="semiBold" size={16}>
          Categories
        </AppText>
        <IconButton
          icon="add"
          background={Colors.gold}
          color={Colors.bg}
          onPress={() => setEditing('new')}
        />
      </View>

      {/* Type tabs */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md }}>
        <Chip
          label="Expense"
          icon="arrow-up"
          color={Colors.expense}
          active={tab === 'expense'}
          onPress={() => setTab('expense')}
        />
        <Chip
          label="Income"
          icon="arrow-down"
          color={Colors.income}
          active={tab === 'income'}
          onPress={() => setTab('income')}
        />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingTop: 0,
          paddingBottom: 120,
          gap: Spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        {listed.length === 0 ? (
          <Empty
            icon="pricetag"
            title={`No ${tab} categories`}
            subtitle="Add one to organize your transactions."
            action={<Button label="Add category" icon="add" onPress={() => setEditing('new')} />}
          />
        ) : null}

        {listed.map((c) => {
          const subs = categories.filter((s) => s.parentId === c.id);
          const used = countFor(c.id);
          return (
            <Card key={c.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: c.color + '22',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={c.icon as never} size={20} color={c.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText weight="bold" size={15}>
                    {c.name}
                  </AppText>
                  <AppText size={11} color={Colors.textMuted}>
                    {used} transactions
                    {subs.length > 0 ? ` · ${subs.length} subcategories` : ''}
                    {c.budget ? ` · ${formatCompact(c.budget)} budget` : ''}
                  </AppText>
                </View>
                <Pressable
                  onPress={() => setEditing(c)}
                  style={({ pressed }) => ({
                    padding: 8,
                    opacity: pressed ? 0.6 : 1,
                  })}
                  hitSlop={6}
                >
                  <Ionicons name="create-outline" size={18} color={Colors.textSecondary} />
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(c.id)}
                  style={({ pressed }) => ({
                    padding: 8,
                    opacity: pressed ? 0.6 : 1,
                  })}
                  hitSlop={6}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.textMuted} />
                </Pressable>
              </View>

              {subs.length > 0 ? (
                <View
                  style={{
                    marginTop: Spacing.md,
                    paddingTop: Spacing.md,
                    borderTopWidth: 1,
                    borderTopColor: Colors.borderSubtle,
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 6,
                  }}
                >
                  {subs.map((s) => (
                    <View
                      key={s.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: s.color + '18',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: Radius.sm,
                      }}
                    >
                      <Ionicons name={s.icon as never} size={10} color={s.color} />
                      <AppText size={11} weight="medium" color={s.color}>
                        {s.name}
                      </AppText>
                    </View>
                  ))}
                </View>
              ) : null}
            </Card>
          );
        })}
      </ScrollView>

      <CategoryEditor
        key={editing === 'new' ? `new-${tab}` : editing?.id ?? 'none'}
        visible={editing !== null}
        category={editing === 'new' ? null : editing}
        defaultType={tab}
        onClose={() => setEditing(null)}
        onSave={(data, id) => {
          if (id) {
            updateCategory(id, data);
          } else {
            addCategory(data as Omit<Category, 'id'>);
          }
          setEditing(null);
        }}
      />
    </View>
  );
}

function CategoryEditor({
  visible,
  category,
  defaultType,
  onClose,
  onSave,
}: {
  visible: boolean;
  category: Category | null;
  defaultType: TxType;
  onClose: () => void;
  onSave: (data: Partial<Category>, id?: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(category?.name ?? '');
  const [type, setType] = useState<TxType>(category?.type ?? defaultType);
  const [icon, setIcon] = useState<string>(category?.icon ?? 'pricetag');
  const [color, setColor] = useState(category?.color ?? COLORS[0]);
  const [budget, setBudget] = useState(category?.budget ? String(category.budget) : '');

  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const parsedBudget = budget.trim() ? parseFloat(budget) : undefined;
    onSave(
      {
        name: name.trim(),
        type,
        icon,
        color,
        budget:
          type === 'expense' && parsedBudget !== undefined && !isNaN(parsedBudget) && parsedBudget > 0
            ? parsedBudget
            : undefined,
      },
      category?.id
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <Pressable
          onPress={onClose}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: Colors.bgElevated,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: Spacing.xl,
              paddingBottom: insets.bottom + Spacing.xl,
              maxHeight: '92%',
            }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: Colors.textDim,
                alignSelf: 'center',
                marginBottom: Spacing.md,
              }}
            />
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: Spacing.lg, paddingBottom: Spacing.lg }}
              showsVerticalScrollIndicator={false}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    backgroundColor: color + '22',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={icon as never} size={26} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText weight="bold" size={20}>
                    {category ? 'Edit category' : 'New category'}
                  </AppText>
                  <AppText size={12} color={Colors.textMuted}>
                    Preview updates live
                  </AppText>
                </View>
              </View>

              <View>
                <AppText size={11} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1, marginBottom: 8 }}>
                  NAME
                </AppText>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Coffee"
                  placeholderTextColor={Colors.textDim}
                  autoFocus={!category}
                  style={{
                    color: Colors.text,
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 16,
                    backgroundColor: Colors.surface,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    borderRadius: Radius.md,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                  }}
                />
              </View>

              <View>
                <SectionHeader title="Type" />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(['expense', 'income'] as const).map((t) => (
                    <Pressable
                      key={t}
                      onPress={() => setType(t)}
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        borderRadius: Radius.md,
                        backgroundColor:
                          type === t
                            ? (t === 'income' ? Colors.income : Colors.expense) + '22'
                            : Colors.surface,
                        borderWidth: 1,
                        borderColor:
                          type === t
                            ? t === 'income'
                              ? Colors.income
                              : Colors.expense
                            : Colors.border,
                        alignItems: 'center',
                      }}
                    >
                      <AppText
                        size={13}
                        weight="semiBold"
                        color={
                          type === t
                            ? t === 'income'
                              ? Colors.income
                              : Colors.expense
                            : Colors.textSecondary
                        }
                      >
                        {t === 'income' ? 'Income' : 'Expense'}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View>
                <SectionHeader title="Icon" />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {ICONS.map((i) => (
                    <Pressable
                      key={i}
                      onPress={() => setIcon(i as string)}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: icon === i ? color + '22' : Colors.surface,
                        borderWidth: 1,
                        borderColor: icon === i ? color : Colors.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name={i} size={20} color={icon === i ? color : Colors.textSecondary} />
                    </Pressable>
                  ))}
                </View>
              </View>

              <View>
                <SectionHeader title="Color" />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
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
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {color === c ? <Ionicons name="checkmark" size={18} color={Colors.bg} /> : null}
                    </Pressable>
                  ))}
                </View>
              </View>

              {type === 'expense' ? (
                <View>
                  <AppText size={11} color={Colors.textMuted} weight="semiBold" style={{ letterSpacing: 1, marginBottom: 8 }}>
                    MONTHLY BUDGET (OPTIONAL)
                  </AppText>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      backgroundColor: Colors.surface,
                      borderWidth: 1,
                      borderColor: Colors.border,
                      borderRadius: Radius.md,
                      paddingHorizontal: 14,
                    }}
                  >
                    <AppText weight="bold" size={16} color={Colors.textMuted}>
                      GHS
                    </AppText>
                    <TextInput
                      value={budget}
                      onChangeText={setBudget}
                      placeholder="0.00"
                      placeholderTextColor={Colors.textDim}
                      keyboardType="decimal-pad"
                      style={{
                        flex: 1,
                        color: Colors.text,
                        fontFamily: 'Inter_700Bold',
                        fontSize: 20,
                        paddingVertical: 12,
                      }}
                    />
                  </View>
                </View>
              ) : null}

              <Button
                label={category ? 'Save changes' : 'Create category'}
                icon="checkmark"
                onPress={handleSave}
                disabled={!canSave}
              />
              <Button label="Cancel" variant="ghost" onPress={onClose} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
