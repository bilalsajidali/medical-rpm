import { format } from 'date-fns';
import {
  Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import type { Reading, Status, Thresholds, VitalKey } from '@/data/types';
import { cn } from '@/lib/cn';

export type ChartVital = 'bp' | 'pulse' | 'spo2' | 'glucose';

export const CHART_VITALS: Record<ChartVital, { main: VitalKey; second?: VitalKey; unit: string; domain: [number, number]; ticks: number[] }> = {
  bp: { main: 'systolic', second: 'diastolic', unit: 'mmHg', domain: [60, 180], ticks: [60, 90, 120, 150, 180] },
  pulse: { main: 'pulse', unit: 'bpm', domain: [40, 130], ticks: [40, 70, 100, 130] },
  spo2: { main: 'spo2', unit: '%', domain: [84, 100], ticks: [84, 88, 92, 96, 100] },
  glucose: { main: 'glucose', unit: 'mg/dL', domain: [40, 340], ticks: [40, 115, 190, 265, 340] },
};

const STATUS_COLOR: Record<Status, string> = {
  critical: 'var(--color-critical)', atrisk: 'var(--color-atrisk)', normal: 'var(--color-normal)',
};

interface Point { t: number; main?: number; second?: number; mainStatus: Status; secondStatus: Status }

export interface VitalTrendChartProps {
  readings: Reading[];
  vital: ChartVital;
  thresholds: Thresholds;
  /** patient = shaded healthy band; staff = dashed at-risk line */
  variant?: 'staff' | 'patient';
  /** soft fill under the main line (doctor dashboard) */
  area?: boolean;
  height?: number;
  ariaLabel: string;
}

function flagStatus(r: Reading, vital: VitalKey): Status {
  return r.flags.find((f) => f.vital === vital)?.status ?? 'normal';
}

/** One dot only for out-of-range points: 5px, status color, white 2px stroke. */
function FlagDot(statusKey: 'mainStatus' | 'secondStatus') {
  return function Dot(props: { cx?: number; cy?: number; payload?: Point; index?: number }) {
    const { cx, cy, payload, index } = props;
    if (cx === undefined || cy === undefined || !payload || payload[statusKey] === 'normal') return <g key={`d${index}`} />;
    return <circle key={`d${index}`} cx={cx} cy={cy} r={5} fill={STATUS_COLOR[payload[statusKey]]} stroke="var(--color-surface)" strokeWidth={2} />;
  };
}

export function VitalTrendChart({ readings, vital, thresholds, variant = 'staff', area, height = 220, ariaLabel }: VitalTrendChartProps) {
  const cfg = CHART_VITALS[vital];
  const data: Point[] = readings
    .filter((r) => r[cfg.main] !== undefined)
    .map((r) => ({
      t: new Date(r.takenAt).getTime(),
      main: r[cfg.main],
      second: cfg.second ? r[cfg.second] : undefined,
      mainStatus: flagStatus(r, cfg.main),
      secondStatus: cfg.second ? flagStatus(r, cfg.second) : 'normal',
    }))
    .sort((a, b) => a.t - b.t);
  const range = thresholds[cfg.main];
  const limit = vital === 'spo2' ? range.minAtRisk : range.maxAtRisk;
  const [lo, hi] = cfg.domain;
  const clampY = (v: number) => Math.min(hi, Math.max(lo, v));

  if (data.length === 0) {
    return (
      <div role="img" aria-label={ariaLabel} className="flex items-center justify-center rounded-inner bg-subtle text-sm text-ink-muted" style={{ height }}>
        No readings in this range yet
      </div>
    );
  }

  return (
    <div role="img" aria-label={ariaLabel} style={{ height }} className="w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid vertical={false} stroke="var(--color-chart-grid)" />
          {variant === 'patient' && (
            <ReferenceArea y1={clampY(range.minAtRisk)} y2={clampY(range.maxAtRisk)} fill="var(--color-normal-bg)" fillOpacity={0.7} ifOverflow="hidden" />
          )}
          <XAxis
            dataKey="t" type="number" scale="time" domain={['dataMin', 'dataMax']}
            tickFormatter={(t: number) => format(t, 'MMM d')} tickCount={5}
            tick={{ fontSize: variant === 'patient' ? 14 : 12, fill: 'var(--color-ink-muted)' }}
            axisLine={{ stroke: 'var(--color-border)' }} tickLine={false} minTickGap={24}
          />
          <YAxis
            domain={cfg.domain} ticks={cfg.ticks} allowDataOverflow
            tick={{ fontSize: variant === 'patient' ? 13 : 12, fill: 'var(--color-ink-muted)' }}
            axisLine={false} tickLine={false} width={44}
          />
          {variant === 'staff' && (
            <ReferenceLine y={limit} stroke="var(--color-atrisk-ink)" strokeDasharray="6 5" strokeWidth={1.5} ifOverflow="hidden" />
          )}
          {area && <Area dataKey="main" stroke="none" fill="var(--color-accent)" fillOpacity={0.07} isAnimationActive={false} />}
          {cfg.second && (
            <Line dataKey="second" stroke="var(--color-chart-diastolic)" strokeWidth={2.5} dot={FlagDot('secondStatus')} activeDot={false} isAnimationActive={false} connectNulls />
          )}
          <Line dataKey="main" stroke="var(--color-accent)" strokeWidth={2.5} dot={FlagDot('mainStatus')} activeDot={{ r: 4 }} isAnimationActive={false} connectNulls />
          <Tooltip
            cursor={{ stroke: 'var(--color-border-strong)' }}
            content={({ active, payload }) => {
              const p = active ? (payload?.[0]?.payload as Point | undefined) : undefined;
              if (!p) return null;
              const value = cfg.second ? `${p.main}/${p.second ?? '—'}` : `${p.main}`;
              return (
                <div className="rounded-inner bg-ink px-3 py-2 text-xs text-surface tabular">
                  <div className="font-semibold">{value} {cfg.unit}</div>
                  <div className="text-surface/75">{format(p.t, 'MMM d, h:mm a')}</div>
                </div>
              );
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface LegendItem { label: string; kind: 'line' | 'second' | 'band' | 'dashed' }

/** Custom legend row shown above the chart. */
export function ChartLegend({ items, size = 'sm' }: { items: LegendItem[]; size?: 'sm' | 'md' }) {
  return (
    <div className={cn('flex flex-wrap gap-4 text-ink-muted', size === 'md' ? 'text-[15px]' : 'text-[13px]')}>
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className={cn(
              it.kind === 'line' && 'h-[3px] w-4 rounded-sm bg-accent',
              it.kind === 'second' && 'h-[3px] w-4 rounded-sm bg-chart-diastolic',
              it.kind === 'band' && 'h-3 w-4 rounded-[3px] border border-normal/40 bg-normal-bg',
              it.kind === 'dashed' && 'w-3.5 border-t-2 border-dashed border-atrisk-ink',
            )}
          />
          {it.label}
        </span>
      ))}
    </div>
  );
}
