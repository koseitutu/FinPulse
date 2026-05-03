import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, formatCompact, useScaledFont, useTheme } from '@/constants/theme';
import { AppText, IconButton } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { TransactionDivider, TransactionItem } from '@/components/transaction-item';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  useTheme();
  const scaled = useScaledFont();
  const txs = useAppStore((s) => s.transactions);
  const categories = useAppStore((s) => s.categories);
  const accounts = useAppStore((s) => s.accounts);
  const tags = useAppStore((s) => s.tags);
  const recurring = useAppStore((s) => s.recurring);

  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) return null;
    const txMatches = txs.filter((t) => {
      const cat = categories.find((c) => c.id === t.categoryId);
      return (
        t.notes?.toLowerCase().includes(q) ||
        t.merchant?.toLowerCase().includes(q) ||
        cat?.name.toLowerCase().includes(q) ||
        t.amount.toString().includes(q)
      );
    }).slice(0, 20);
    const catMatches = categories.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 10);
    const accMatches = accounts.filter((a) => a.name.toLowerCase().includes(q)).slice(0, 10);
    const tagMatches = tags.filter((t) => t.name.toLowerCase().includes(q)).slice(0, 10);
    const recMatches = recurring.filter((r) => r.name.toLowerCase().includes(q));
    return { txMatches, catMatches, accMatches, tagMatches, recMatches };
  }, [q, txs, categories, accounts, tags, recurring]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, paddingTop: insets.top }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          padding: Spacing.lg,
        }}
      >
        <IconButton icon="close" onPress={() => router.back()} />
        <View
          style={{
            flex: 1,
            backgroundColor: Colors.surface,
            borderRadius: Radius.md,
            borderWidth: 1,
            borderColor: Colors.border,
            paddingHorizontal: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Ionicons name="search" size={16} color={Colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            autoFocus
            placeholder="Search everything…"
            placeholderTextColor={Colors.textDim}
            style={{
              flex: 1,
              color: Colors.text,
              paddingVertical: 12,
              fontFamily: 'Inter_400Regular',
              fontSize: scaled(14),
            }}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 80, gap: Spacing.lg }}>
        {!q ? (
          <View style={{ alignItems: 'center', paddingVertical: 60, gap: 10 }}>
            <Ionicons name="search" size={40} color={Colors.textDim} />
            <AppText size={14} color={Colors.textMuted}>
              Search across transactions, categories, tags & recurring.
            </AppText>
          </View>
        ) : null}

        {results ? (
          <>
            {results.txMatches.length > 0 ? (
              <Group title="Transactions" count={results.txMatches.length}>
                <View
                  style={{
                    borderRadius: Radius.md,
                    borderCurve: 'continuous',
                    borderWidth: 1,
                    borderColor: Colors.border,
                    overflow: 'hidden',
                    marginTop: 6,
                  }}
                >
                  {results.txMatches.map((t, idx) => {
                    const cat = categories.find((c) => c.id === t.categoryId);
                    const acc = accounts.find((a) => a.id === t.accountId);
                    return (
                      <React.Fragment key={t.id}>
                        {idx > 0 && <TransactionDivider />}
                        <TransactionItem
                          transaction={t}
                          category={cat}
                          account={acc}
                          grouped
                        />
                      </React.Fragment>
                    );
                  })}
                </View>
              </Group>
            ) : null}

            {results.catMatches.length > 0 ? (
              <Group title="Categories" count={results.catMatches.length}>
                {results.catMatches.map((c) => (
                  <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }}>
                    <View
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        backgroundColor: c.color + '22',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name={c.icon as never} size={14} color={c.color} />
                    </View>
                    <AppText size={13} style={{ flex: 1 }}>
                      {c.name}
                    </AppText>
                    <AppText size={11} color={Colors.textMuted}>
                      {c.parentId ? 'subcategory' : c.type}
                    </AppText>
                  </View>
                ))}
              </Group>
            ) : null}

            {results.accMatches.length > 0 ? (
              <Group title="Accounts" count={results.accMatches.length}>
                {results.accMatches.map((a) => (
                  <View key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }}>
                    <Ionicons name={a.icon as never} size={18} color={a.color} />
                    <AppText size={13} style={{ flex: 1 }}>
                      {a.name}
                    </AppText>
                    <AppText size={12} weight="semiBold">
                      {formatCompact(a.balance, a.currency)}
                    </AppText>
                  </View>
                ))}
              </Group>
            ) : null}

            {results.tagMatches.length > 0 ? (
              <Group title="Tags" count={results.tagMatches.length}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 8 }}>
                  {results.tagMatches.map((t) => (
                    <View
                      key={t.id}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 10,
                        backgroundColor: t.color + '22',
                      }}
                    >
                      <AppText size={12} weight="medium" color={t.color}>
                        #{t.name}
                      </AppText>
                    </View>
                  ))}
                </View>
              </Group>
            ) : null}

            {results.recMatches.length > 0 ? (
              <Group title="Recurring" count={results.recMatches.length}>
                {results.recMatches.map((r) => (
                  <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }}>
                    <Ionicons name="repeat" size={16} color={Colors.gold} />
                    <AppText size={13} style={{ flex: 1 }}>
                      {r.name}
                    </AppText>
                    <AppText size={12} color={Colors.textMuted}>
                      {r.frequency}
                    </AppText>
                  </View>
                ))}
              </Group>
            ) : null}

            {results.txMatches.length +
              results.catMatches.length +
              results.accMatches.length +
              results.tagMatches.length +
              results.recMatches.length ===
            0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 60, gap: 10 }}>
                <Ionicons name="sad-outline" size={40} color={Colors.textDim} />
                <AppText size={14} color={Colors.textMuted}>
                  No results for &quot;{query}&quot;
                </AppText>
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Group({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.borderSubtle,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <AppText size={11} weight="semiBold" color={Colors.textMuted} style={{ letterSpacing: 1 }}>
          {title.toUpperCase()}
        </AppText>
        <View
          style={{
            paddingHorizontal: 6,
            paddingVertical: 1,
            borderRadius: 6,
            backgroundColor: Colors.gold + '22',
          }}
        >
          <AppText size={9} weight="semiBold" color={Colors.gold}>
            {count}
          </AppText>
        </View>
      </View>
      {children}
    </View>
  );
}
