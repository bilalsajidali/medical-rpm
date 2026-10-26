import type { ComponentProps } from 'react';
import { DailyAvgPeek } from '@/components/charts/DailyAvgPeek';
import { cn } from '@/lib/cn';
import { usePeek } from './usePeek';

export interface MinMaxAvgCardProps {
  label: string;
  unit: string;
  min: number | null;
  max: number | null;
  /** already formatted (day-weighted average) */
  avg: string;
  counts: { critical: number; atrisk: number; normal: number };
  /** hovering / focusing the card expands it into the daily-average chart */
  peek?: Omit<ComponentProps<typeof DailyAvgPeek>, 'open' | 'anchor' | 'label' | 'unit'>;
}

const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

/** Min / Max / Avg for one vital plus the critical / at-risk / normal split. */
export function MinMaxAvgCard({ label, unit, min, max, avg, counts, peek: peekData }: MinMaxAvgCardProps) {
  const { ref: peekRef, ...peek } = usePeek(!!peekData && peekData.days.length > 0);
  const total = counts.critical + counts.atrisk + counts.normal;
  const c = pct(counts.critical, total);
  const r = pct(counts.atrisk, total);
  const n = total ? 100 - c - r : 0;
  const split = total === 0
    ? 'No readings in this range'
    : c === 0 && r === 0 ? '100% normal' : `${c}% critical · ${r}% at-risk · ${n}% normal`;
  const fmt = (v: number | null) => (v === null ? '—' : String(v));
  const wrapped = peek.enabled && !!peekData;
  const card = (
    <div className={cn(
      'flex flex-col gap-2.5 rounded-card border border-border bg-surface p-4',
      wrapped && cn('h-full transition-[scale,opacity] duration-500 ease-[var(--ease-spring)] motion-reduce:transition-none', peek.open && 'scale-[0.97] opacity-60'),
    )}>
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-semibold">{label}</span>
        <span className="text-xs text-ink-muted">{unit}</span>
      </div>
      <dl className="m-0 grid grid-cols-3 gap-1.5 tabular">
        {([['Min', fmt(min)], ['Max', fmt(max)], ['Avg', avg]] as const).map(([k, v]) => (
          <div key={k} className="flex flex-col">
            <dt className="text-xs text-ink-muted">{k}</dt>
            <dd className="m-0 text-base font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-muted-bg" aria-hidden="true">
        <div className="bg-critical" style={{ width: `${c}%` }} />
        <div className="bg-atrisk" style={{ width: `${r}%` }} />
        <div className="bg-normal" style={{ width: `${n}%` }} />
      </div>
      <span className="text-xs text-ink-muted">{split}</span>
    </div>
  );
  if (!wrapped) return card;
  return (
    <div
      className={cn('relative rounded-card outline-none focus-visible:ring-2 focus-visible:ring-accent', peek.open && 'z-30')}
      tabIndex={0}
      aria-label={`${label}: average ${avg} ${unit}. Show daily averages`}
      aria-expanded={peek.open}
      ref={peekRef}
      {...peek.handlers}
    >
      {card}
      <DailyAvgPeek open={peek.open} anchor={peek.anchor} label={label} unit={unit} {...peekData} />
    </div>
  );
}
