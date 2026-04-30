import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { FontScale } from '@/store/types';

export type ThemeMode = 'dark' | 'light';

/**
 * Multipliers applied to every font size in the app. The user picks one via
 * Settings → Font Size. The hooks below read the preference reactively so
 * text re-renders the instant the preference changes.
 */
export const FONT_SCALE_MULTIPLIERS: Record<FontScale, number> = {
  small: 0.88,
  medium: 1.0,
  large: 1.18,
};

/**
 * Mutable snapshot of the current font-scale multiplier, mirrored from the
 * store so non-component code paths (style objects built outside render) can
 * read it synchronously. Components should prefer `useFontScale()` which
 * re-renders on change.
 */
export const FontScaleState = { multiplier: 1 };

export function scaleFont(size: number, multiplier = FontScaleState.multiplier): number {
  return Math.round(size * multiplier);
}

export type CardTone = 'purple' | 'blue' | 'teal' | 'coral' | 'amber';

export interface ToneColor {
  bg: string;
  border: string;
  accent: string;
}

export interface Palette {
  // Core
  bg: string;
  bgElevated: string;
  surface: string;
  surfaceAlt: string;
  surfaceHigh: string;
  border: string;
  borderSubtle: string;

  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textDim: string;

  // Accent (gold — consistent on both themes)
  gold: string;
  goldSoft: string;
  goldDim: string;

  // Semantic
  income: string;
  incomeSoft: string;
  expense: string;
  expenseSoft: string;
  info: string;
  warn: string;

  // Chart palette
  chart: string[];

  // Platform / shadow hints
  shadow: string;
  overlay: string;
  inverseText: string;

  // Card tones — bold, colorful variants for the light theme. In dark
  // mode these all map to the standard surface so cards keep the
  // existing dark look.
  tones: Record<CardTone, ToneColor>;
}

export const darkPalette: Palette = {
  bg: '#070E1C',
  bgElevated: '#0A1628',
  surface: '#111E33',
  surfaceAlt: '#172842',
  surfaceHigh: '#1E3354',
  border: '#22375A',
  borderSubtle: '#18283F',

  text: '#FFFFFF',
  textSecondary: '#A9B6CC',
  textMuted: '#6C7E9B',
  textDim: '#4A5A78',

  gold: '#F4B942',
  goldSoft: '#F4B94233',
  goldDim: '#8D6B26',

  income: '#2ECC71',
  incomeSoft: '#2ECC7122',
  expense: '#E74C3C',
  expenseSoft: '#E74C3C22',
  info: '#4DA6FF',
  warn: '#F4B942',

  chart: [
    '#F4B942',
    '#4DA6FF',
    '#2ECC71',
    '#E74C3C',
    '#B24DFF',
    '#FF8C42',
    '#2EC4B6',
    '#FFD166',
  ],

  shadow: 'rgba(0,0,0,0.35)',
  overlay: 'rgba(0,0,0,0.55)',
  inverseText: '#0A1628',

  // Dark mode keeps the neutral navy card — tones collapse to the
  // regular surface so the existing dark design is preserved.
  tones: {
    purple: { bg: '#111E33', border: '#22375A', accent: '#B24DFF' },
    blue: { bg: '#111E33', border: '#22375A', accent: '#4DA6FF' },
    teal: { bg: '#111E33', border: '#22375A', accent: '#2EC4B6' },
    coral: { bg: '#111E33', border: '#22375A', accent: '#FF8C7A' },
    amber: { bg: '#111E33', border: '#22375A', accent: '#F4B942' },
  },
};

// Polished light mode, tuned for readability and a warm, premium feel.
// Color story pulled from the app icon: deep navy + rich gold cowry shell +
// electric cyan. Backgrounds lean into a warm ivory/parchment to echo the
// gold tones, while text stays deep navy and accents keep the cyan info hue.
export const lightPalette: Palette = {
  // Backgrounds — near-white canvas so the colorful cards pop.
  // A hint of warmth keeps it from feeling sterile.
  bg: '#FBF9F4',
  bgElevated: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F1EEE6',
  surfaceHigh: '#E4E0D4',
  border: '#D9D3C2',
  borderSubtle: '#ECE7D9',

  // Text — deep navy straight from the icon for maximum contrast.
  text: '#0B1A33',
  textSecondary: '#3F4E6B',
  textMuted: '#6B6A5A',
  textDim: '#A59C7F',

  // Gold accent (unchanged — pops on light too).
  gold: '#C8921F',
  goldSoft: '#C8921F26',
  goldDim: '#8D6B26',

  // Semantic — slightly deeper shades so they read well on warm surfaces.
  income: '#1FA463',
  incomeSoft: '#1FA46322',
  expense: '#D93A2B',
  expenseSoft: '#D93A2B1F',
  info: '#1E88E5',
  warn: '#E0A42F',

  chart: [
    '#C8921F',
    '#1E88E5',
    '#1FA463',
    '#D93A2B',
    '#8F3FD9',
    '#EE7420',
    '#1FA6A0',
    '#E6B73A',
  ],

  shadow: 'rgba(11,26,51,0.14)',
  overlay: 'rgba(11,26,51,0.45)',
  inverseText: '#FFFAE8',

  // Bold, colorful card tones. Backgrounds are saturated enough to
  // stand out against the near-white canvas but light enough that the
  // deep-navy body text remains legible (contrast > 7:1 on all tones).
  tones: {
    purple: { bg: '#E7DEFB', border: '#C9B6F3', accent: '#6D3FD9' },
    blue: { bg: '#D9E8FD', border: '#A8C9F5', accent: '#1E6FE0' },
    teal: { bg: '#CFEEE5', border: '#8FD6C5', accent: '#0F9E86' },
    coral: { bg: '#FBDDD6', border: '#F4B2A3', accent: '#D94B32' },
    amber: { bg: '#FAE6BB', border: '#E9C87A', accent: '#B87A10' },
  },
};

/**
 * `Colors` is a live, mutable snapshot of the active palette. Components read
 * values off this object in inline styles, which means that once we swap the
 * underlying palette and trigger a re-render, every component picks up the new
 * colors automatically without having to thread a context through every prop.
 */
export const Colors: Palette = { ...darkPalette };

export function applyPalette(mode: ThemeMode) {
  const next = mode === 'light' ? lightPalette : darkPalette;
  Object.assign(Colors, next);
  // keep chart as a fresh array so consumers that memoize on identity re-key
  Colors.chart = [...next.chart];
}

/**
 * Subscribes a component to the active theme. Calling this in any screen-level
 * component re-renders that screen when the user toggles light/dark mode,
 * which in turn re-reads the mutated `Colors` object.
 */
export function useTheme(): ThemeMode {
  const mode = useAppStore((s) => s.preferences.theme) as ThemeMode;
  // Sync module-level Colors before returning so consumers reading Colors in
  // the same render see the latest values.
  applyPalette(mode);
  return mode;
}

/**
 * Subscribes a component to the current font-scale preference. Returns the
 * active multiplier (e.g. 1.0 for Medium) and keeps the shared
 * `FontScaleState.multiplier` in sync so every scaled text re-reads the new
 * value on the same render.
 */
export function useFontScale(): number {
  const pref = useAppStore((s) => s.preferences.fontScale) as FontScale | undefined;
  const key: FontScale = pref ?? 'medium';
  const multiplier = FONT_SCALE_MULTIPLIERS[key] ?? 1;
  FontScaleState.multiplier = multiplier;
  return multiplier;
}

/**
 * Convenience hook: returns a function that scales a raw font size using the
 * current preference. Handy for inline styles on components that don't use
 * `AppText` (e.g. `TextInput`).
 */
export function useScaledFont() {
  const multiplier = useFontScale();
  return React.useCallback(
    (size: number) => Math.round(size * multiplier),
    [multiplier]
  );
}

/**
 * Deterministic tone picker for list cards — rotates through the colorful
 * tone set so a list of cards gets a pleasing, predictable color story
 * without every card looking identical.
 */
const TONE_CYCLE: CardTone[] = ['purple', 'blue', 'teal', 'coral', 'amber'];
export function cycleTone(index: number): CardTone {
  const i = ((index % TONE_CYCLE.length) + TONE_CYCLE.length) % TONE_CYCLE.length;
  return TONE_CYCLE[i];
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const formatCurrency = (amount: number, currency = 'GHS') => {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}${currency} ${formatted}`;
};

export const formatCompact = (amount: number, currency = 'GHS') => {
  const abs = Math.abs(amount);
  let str: string;
  if (abs >= 1_000_000) str = (abs / 1_000_000).toFixed(1) + 'M';
  else if (abs >= 1_000) str = (abs / 1_000).toFixed(1) + 'k';
  else str = abs.toFixed(0);
  return `${amount < 0 ? '-' : ''}${currency} ${str}`;
};
