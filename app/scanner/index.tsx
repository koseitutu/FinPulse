import React, { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useImageAnalysis } from '@fastshot/ai';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { AppText, Button, Card, IconButton, SectionHeader } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';

interface Extracted {
  amount?: string;
  date?: string;
  merchant?: string;
  category?: string;
  raw: string;
}

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const categories = useAppStore((s) => s.categories);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { analyzeImage, isLoading } = useImageAnalysis();

  const pickImage = async (source: 'camera' | 'library') => {
    setErrorMsg(null);
    setExtracted(null);
    try {
      if (source === 'camera' && Platform.OS !== 'web') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          setErrorMsg('Camera permission denied.');
          return;
        }
      }
      const result =
        source === 'camera' && Platform.OS !== 'web'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.6,
              base64: false,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.6,
              base64: false,
            });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      const uri = result.assets[0].uri;
      setImageUri(uri);
      analyze(uri);
    } catch (e) {
      console.error(e);
      setErrorMsg('Could not load image.');
    }
  };

  const analyze = async (uri: string) => {
    try {
      const result = await analyzeImage({
        imageUrl: uri,
        prompt: `You are analyzing a receipt photo. Extract these fields and return STRICT JSON only, no markdown fences:
{
  "merchant": "store name",
  "amount": "numeric total amount without currency symbol",
  "date": "YYYY-MM-DD",
  "category": "one of: Food, Transport, Utilities, Shopping, Entertainment, Health, Education, Rent, Other"
}
If a field is unknown, use an empty string. Return ONLY JSON.`,
      });
      const raw = typeof result === 'string' ? result : JSON.stringify(result);
      const cleaned = raw.replace(/```json|```/g, '').trim();
      try {
        const match = cleaned.match(/\{[\s\S]*\}/);
        const parsed = match ? JSON.parse(match[0]) : {};
        setExtracted({ ...parsed, raw: cleaned });
      } catch {
        setExtracted({ raw: cleaned });
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('AI analysis failed. Please try a clearer image.');
    }
  };

  const applyAndNew = () => {
    if (!extracted) return;
    // map category name to categoryId
    const match = categories.find(
      (c) =>
        !c.parentId &&
        c.type === 'expense' &&
        (extracted.category ?? '').toLowerCase().includes(c.name.toLowerCase().split(' ')[0])
    );
    router.replace({
      pathname: '/transactions/new',
      params: {
        amount: extracted.amount ?? '',
        merchant: extracted.merchant ?? '',
        notes: `Extracted from receipt`,
        categoryId: match?.id ?? '',
        date: extracted.date
          ? new Date(extracted.date).toISOString()
          : new Date().toISOString(),
        receiptImageUri: imageUri ?? '',
      },
    });
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
          Receipt Scanner
        </AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 120 }}>
        {!imageUri ? (
          <Card>
            <View style={{ alignItems: 'center', gap: 12, paddingVertical: Spacing.xl }}>
              <View
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 45,
                  backgroundColor: Colors.gold + '22',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="scan" size={44} color={Colors.gold} />
              </View>
              <AppText weight="bold" size={18}>
                Snap a receipt
              </AppText>
              <AppText size={12} color={Colors.textMuted} style={{ textAlign: 'center', maxWidth: 260 }}>
                AI Vision reads the merchant, amount, date and suggests a category.
              </AppText>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button
                label={Platform.OS === 'web' ? 'Upload photo' : 'Open camera'}
                icon={Platform.OS === 'web' ? 'image' : 'camera'}
                onPress={() => pickImage('camera')}
                style={{ flex: 1 }}
              />
              <Button
                label="Library"
                icon="images"
                variant="secondary"
                onPress={() => pickImage('library')}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        ) : (
          <>
            <View style={{ borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border }}>
              <Image source={{ uri: imageUri }} style={{ width: '100%', height: 260 }} contentFit="cover" />
              {isLoading ? (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(7,14,28,0.7)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                  }}
                >
                  <ActivityIndicator color={Colors.gold} />
                  <AppText weight="semiBold">Analyzing receipt…</AppText>
                  <AppText size={11} color={Colors.textMuted}>
                    2–10 seconds
                  </AppText>
                </View>
              ) : null}
            </View>

            {errorMsg ? (
              <Card style={{ borderColor: Colors.expense + '66' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="alert-circle" size={18} color={Colors.expense} />
                  <AppText size={13} color={Colors.expense} style={{ flex: 1 }} selectable>
                    {errorMsg}
                  </AppText>
                </View>
              </Card>
            ) : null}

            {extracted ? (
              <Card>
                <SectionHeader title="Extracted fields" subtitle="Review and continue" />
                <FieldRow label="Merchant" value={extracted.merchant || '-'} />
                <FieldRow label="Amount" value={extracted.amount ? `GHS ${extracted.amount}` : '-'} />
                <FieldRow label="Date" value={extracted.date || '-'} />
                <FieldRow label="Category" value={extracted.category || '-'} />
                <Button
                  label="Use data & create transaction"
                  icon="arrow-forward"
                  style={{ marginTop: Spacing.md }}
                  onPress={applyAndNew}
                />
              </Card>
            ) : null}

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button
                label="Retake"
                icon="refresh"
                variant="secondary"
                style={{ flex: 1 }}
                onPress={() => {
                  setImageUri(null);
                  setExtracted(null);
                  setErrorMsg(null);
                }}
              />
              <Button
                label="Skip to manual"
                icon="create"
                variant="ghost"
                style={{ flex: 1 }}
                onPress={() => router.replace('/transactions/new')}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderSubtle,
      }}
    >
      <AppText size={12} color={Colors.textMuted}>
        {label}
      </AppText>
      <AppText size={13} weight="semiBold" selectable>
        {value}
      </AppText>
    </View>
  );
}

// Silence unused import on web
void Pressable;
