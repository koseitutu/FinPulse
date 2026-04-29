import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';
import { Colors } from '@/constants/theme';
import { AppText } from './ui';

export interface Slice {
  label: string;
  value: number;
  color: string;
}

export function Donut({
  data,
  size = 180,
  thickness = 22,
  centerLabel,
  centerSublabel,
}: {
  data: Slice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSublabel?: string;
}) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const c = 2 * Math.PI * radius;

  let offset = 0;
  const filtered = data.filter((d) => d.value > 0);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={Colors.surfaceHigh}
          strokeWidth={thickness}
          fill="none"
        />
        {total > 0 &&
          filtered.map((d, i) => {
            const frac = d.value / total;
            const len = frac * c;
            const dasharray = `${len} ${c - len}`;
            const dashoffset = c - offset;
            offset += len;
            return (
              <Circle
                key={i}
                cx={cx}
                cy={cy}
                r={radius}
                stroke={d.color}
                strokeWidth={thickness}
                fill="none"
                strokeDasharray={dasharray}
                strokeDashoffset={dashoffset}
                strokeLinecap="butt"
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            );
          })}
      </Svg>
      <View
        style={{
          position: 'absolute',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {centerLabel ? (
          <AppText weight="bold" size={20}>
            {centerLabel}
          </AppText>
        ) : null}
        {centerSublabel ? (
          <AppText size={11} color={Colors.textMuted} style={{ marginTop: 2 }}>
            {centerSublabel}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

export function LegendRow({ data }: { data: Slice[] }) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  return (
    <View style={{ gap: 8, flex: 1 }}>
      {data.map((d, i) => {
        const pct = total > 0 ? (d.value / total) * 100 : 0;
        return (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: d.color }} />
            <AppText size={12} color={Colors.textSecondary} style={{ flex: 1 }} numberOfLines={1}>
              {d.label}
            </AppText>
            <AppText size={12} weight="semiBold" color={Colors.text}>
              {pct.toFixed(0)}%
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

export function BarChart({
  data,
  height = 140,
  barColor = Colors.gold,
  negativeColor = Colors.expense,
  showLabels = true,
}: {
  data: { label: string; value: number; highlight?: boolean }[];
  height?: number;
  barColor?: string;
  negativeColor?: string;
  showLabels?: boolean;
}) {
  const max = Math.max(1, ...data.map((d) => Math.abs(d.value)));
  const barWidth = 100 / data.length;

  return (
    <View style={{ height, width: '100%' }}>
      <Svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
        {data.map((d, i) => {
          const h = (Math.abs(d.value) / max) * (height - (showLabels ? 20 : 8));
          const x = i * barWidth + barWidth * 0.15;
          const w = barWidth * 0.7;
          const y = height - h - (showLabels ? 16 : 4);
          const color = d.value < 0 ? negativeColor : d.highlight ? Colors.gold : barColor;
          return (
            <G key={i}>
              <Rect x={x} y={y} width={w} height={h} rx={1.2} fill={color} opacity={0.9} />
            </G>
          );
        })}
      </Svg>
      {showLabels ? (
        <View style={{ flexDirection: 'row', position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          {data.map((d, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <AppText size={9} color={Colors.textMuted}>
                {d.label}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function LineChart({
  data,
  height = 140,
  color = Colors.gold,
  fill = true,
  horizontalLines = 3,
}: {
  data: number[];
  height?: number;
  color?: string;
  fill?: boolean;
  horizontalLines?: number;
}) {
  if (data.length === 0) return null;
  const w = 100;
  const h = height;
  const padding = 8;
  const max = Math.max(...data, 0);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / Math.max(1, data.length - 1)) * (w - padding * 2) + padding;
    const y = h - padding - ((v - min) / range) * (h - padding * 2);
    return [x, y] as [number, number];
  });

  const d = points.reduce((acc, [x, y], i) => (i === 0 ? `M${x},${y}` : `${acc} L${x},${y}`), '');
  const area =
    d + ` L${points[points.length - 1][0]},${h - padding} L${points[0][0]},${h - padding} Z`;

  return (
    <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {Array.from({ length: horizontalLines }).map((_, i) => {
        const y = padding + (i / (horizontalLines - 1 || 1)) * (h - padding * 2);
        return (
          <Line
            key={i}
            x1={padding}
            x2={w - padding}
            y1={y}
            y2={y}
            stroke={Colors.borderSubtle}
            strokeWidth={0.2}
            strokeDasharray="1,1"
          />
        );
      })}
      {fill ? <Path d={area} fill={color} opacity={0.18} /> : null}
      <Path d={d} stroke={color} strokeWidth={1.6} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {points.map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={1.2} fill={color} />
      ))}
    </Svg>
  );
}

export function Sparkline({ values, color = Colors.gold }: { values: number[]; color?: string }) {
  if (values.length < 2) return null;
  const w = 100;
  const h = 30;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  return (
    <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <Path d={`M${pts.join(' L')}`} stroke={color} strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function ProgressRing({
  value,
  max,
  size = 80,
  thickness = 8,
  color = Colors.gold,
  children,
}: {
  value: number;
  max: number;
  size?: number;
  thickness?: number;
  color?: string;
  children?: React.ReactNode;
}) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const c = 2 * Math.PI * radius;
  const dasharray = `${pct * c} ${c}`;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={Colors.surfaceHigh}
          strokeWidth={thickness}
          fill="none"
        />
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={color}
          strokeWidth={thickness}
          fill="none"
          strokeDasharray={dasharray}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </Svg>
      <View style={{ position: 'absolute' }}>{children}</View>
    </View>
  );
}
