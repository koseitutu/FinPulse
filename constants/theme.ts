import { useAppStore } from '@/store/useAppStore';

export type ThemeMode = 'dark' | 'light';

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
};

// Polished light mode, tuned for readability and a warm, premium feel.
export const lightPalette: Palette = {
  // Backgrounds — soft off-white with a gentle blue tint so the gold still pops.
  bg: '#F5F7FB',
  bgElevated: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF2F8',
  surfaceHigh: '#E3E9F3',
  border: '#D6DEEB',
  borderSubtle: '#E7ECF4',

  // Text — deep navy for maximum contrast against the near-white backgrounds.
  text: '#0B1A33',
  textSecondary: '#3F4E6B',
  textMuted: '#6B7890',
  textDim: '#9AA5BA',

  // Gold accent (unchanged — pops on light too).
  gold: '#F4B942',
  goldSoft: '#F4B9421F',
  goldDim: '#B98A28',

  // Semantic — slightly deeper shades so they read well on light surfaces.
  income: '#1FA463',
  incomeSoft: '#1FA46322',
  expense: '#D93A2B',
  expenseSoft: '#D93A2B1F',
  info: '#3B82F6',
  warn: '#E0A42F',

  chart: [
    '#E0A42F',
    '#3B82F6',
    '#1FA463',
    '#D93A2B',
    '#8F3FD9',
    '#EE7420',
    '#1FA6A0',
    '#E6B73A',
  ],

  shadow: 'rgba(11,26,51,0.12)',
  overlay: 'rgba(11,26,51,0.45)',
  inverseText: '#FFFFFF',
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
