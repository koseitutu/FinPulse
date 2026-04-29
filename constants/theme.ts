export const Colors = {
  // Core palette
  bg: '#070E1C',
  bgElevated: '#0A1628',
  surface: '#111E33',
  surfaceAlt: '#172842',
  surfaceHigh: '#1E3354',
  border: '#22375A',
  borderSubtle: '#18283F',

  // Text
  text: '#FFFFFF',
  textSecondary: '#A9B6CC',
  textMuted: '#6C7E9B',
  textDim: '#4A5A78',

  // Accent
  gold: '#F4B942',
  goldSoft: '#F4B94233',
  goldDim: '#8D6B26',

  // Semantic
  income: '#2ECC71',
  incomeSoft: '#2ECC7122',
  expense: '#E74C3C',
  expenseSoft: '#E74C3C22',
  info: '#4DA6FF',
  warn: '#F4B942',

  // Chart palette
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
};

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
