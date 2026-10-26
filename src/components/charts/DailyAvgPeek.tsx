import { format } from 'date-fns';
import { useId, useMemo, useState, type PointerEvent } from 'react';
import { STATUS_STYLE } from '@/components/ui/StatusPill';
import type { VitalKey } from '@/data/types';
import { cn } from '@/lib/cn';
import { averageOfDays, formatAvg, type DayAverage, type VitalValue } from '@/lib/rules/averages';
import { smoothPath } from './smoothPath';

const W = 300;
const H = 104;
const PAD = 10;

export interface PeriodAverage { label: string; avg: number | null }

const dayDate = (day: string) => new Date(`${day}T12:00:00`);

/**
 * Hover layer for a Min / Max / Avg card: one point per day (that day's average, with a
 * bar for its low–high spread). Scrub the chart or drag the slider to step through days;
 * the selected day lists its individual readings. Sits over the card; the card owns `open`.
 */
export function DailyAvgPeek({ open, anchor = 'left', label, unit, vital, days, rangeDays, periods }: {
  open: boolean;
  anchor?: 'left' | 'right';
  label: string;
  unit: string;
  vital: VitalKey;
  /** days with readings in the selected range, oldest → newest */
  days: DayAverage<VitalValue>[];
  rangeDays: number;
  /** e.g. 7 / 15 / 30-day averages, always shown */
  periods: PeriodAverage[];
}) {
  const gradId = useId();
  const [picked, setPicked] = useState<number | null>(null);
  const idx = picked !== null && picked < days.length ? picked : days.length - 1;

  const geo = useMemo(() => {
    const lo = Math.min(...days.map((d) => d.min));
    const hi = Math.max(...days.map((d) => d.max));
    const span = hi - lo || 1;
    const y = (v: number) => PAD + (1 - (v - lo) / span) * (H - PAD * 2);
    const x = (i: number) => (days.length === 1 ? W / 2 : (i / (days.length - 1)) * W);
    const xy = days.map((d, i): [number, number] => [x(i), y(d.avg)]);
    const line = smoothPath(xy);
    return {
      xy, line,
      area: xy.length > 1 ? `${line} L${W},${H} L0,${H} Z` : '',
      spreads: days.map((d, i) => ({ x: x(i), y1: y(d.max), y2: y(d.min), multi: d.items.length > 1 })),
    };
  }, [days]);

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    geo.xy.forEach(([px], i) => { if (Math.abs(px - x) < Math.abs(geo.xy[best][0] - x)) best = i; });
    setPicked(best);
  };

  const day = days[idx];
  const dot = geo.xy[idx];
  const totalReadings = days.reduce((n, d) => n + d.items.length, 0);
  const rangeAvg = averageOfDays(days);
  const bp = vital === 'systolic' || vital === 'diastolic';
  // selected range first, then the fixed periods it doesn't already cover
  const rangeLabel = `${rangeDays} days`;
  const chips = [{ label: rangeLabel, avg: rangeAvg }, ...periods.filter((p) => p.label !== rangeLabel)];

  return (
    <div
      aria-hidden={!open}
      style={{ width: 'max(calc(100% + 24px), 340px)' }}
      className={cn(
        'peek-glass absolute -top-3 z-30 rounded-[26px] p-5',
        anchor === 'left' ? '-left-3 origin-top-left' : '-right-3 origin-top-right',
        'transition-[scale,opacity,filter] duration-[560ms] ease-[var(--ease-spring)] motion-reduce:transition-none',
        open ? 'pointer-events-auto scale-100 opacity-100 blur-[0px]' : 'pointer-events-none scale-[0.94] opacity-0 blur-[6px] duration-200 ease-out',
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-base font-medium text-ink-muted">{label}</span>
        <span className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
          {days.length} of {rangeDays} days · {totalReadings} readings
        </span>
      </div>

      <div className="mt-1 flex items-baseline gap-2">
        <span key={day.day} className="peek-pop font-display text-[34px] leading-10 font-medium tabular">{formatAvg(day.avg, vital)}</span>
        <span className="text-base text-ink-muted">{unit}</span>
        <span className="ml-auto text-right text-sm text-ink-muted tabular">
          Daily avg · {format(dayDate(day.day), 'EEE, MMM d')}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="mt-3 h-[104px] w-full touch-none overflow-visible text-accent"
        onPointerMove={onMove}
        onPointerDown={onMove}
        role="img"
        aria-label={`${label} daily averages, last ${rangeDays} days`}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity={0.24} />
            <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={geo.area} fill={`url(#${gradId})`} />
        {/* low–high spread for days with more than one reading */}
        {geo.spreads.map((s, i) => s.multi && (
          <line key={i} x1={s.x} x2={s.x} y1={s.y1} y2={s.y2} stroke="currentColor" strokeOpacity={i === idx ? 0.55 : 0.2}
            strokeWidth={4} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={geo.line} fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <line x1={dot[0]} x2={dot[0]} y1={0} y2={H} stroke="currentColor" strokeOpacity={0.25} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      </svg>
      {/* dot lives in HTML so it stays round while the svg stretches */}
      <div className="pointer-events-none relative -mt-[104px] h-[104px]">
        <span
          className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-accent shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-accent)_22%,transparent)] transition-[left,top] duration-300 ease-[var(--ease-spring)] motion-reduce:transition-none"
          style={{ left: `${(dot[0] / W) * 100}%`, top: `${(dot[1] / H) * 100}%` }}
        />
      </div>

      <input
        type="range"
        min={0}
        max={Math.max(0, days.length - 1)}
        value={idx}
        onChange={(e) => setPicked(Number(e.target.value))}
        disabled={days.length < 2}
        tabIndex={open ? 0 : -1}
        aria-label={`Day: ${format(dayDate(day.day), 'MMMM d')}`}
        className="mt-2 w-full accent-[var(--color-accent)]"
      />
      <div className="flex justify-between text-[11px] text-ink-muted tabular">
        <span>{format(dayDate(days[0].day), 'MMM d')}</span>
        <span>{format(dayDate(days[days.length - 1].day), 'MMM d')}</span>
      </div>

      <div className="mt-3 flex flex-col gap-1.5 rounded-inner bg-subtle/80 px-3 py-2.5">
        <div className="flex items-baseline justify-between text-xs font-medium text-ink-muted">
          <span>{day.items.length} reading{day.items.length === 1 ? '' : 's'} this day</span>
          {day.items.length > 1 && <span className="tabular">Low {day.min} · High {day.max}</span>}
        </div>
        <ul className="m-0 flex max-h-[104px] list-none flex-col gap-1 overflow-y-auto p-0">
          {day.items.map((it) => {
            const st = it.reading.flags.find((f) => f.vital === vital)?.status ?? 'normal';
            return (
              <li key={it.reading.id} className="flex items-center gap-2 text-[13px] tabular">
                <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-full', STATUS_STYLE[st].dot)} />
                <span className="w-16 text-ink-muted">{format(new Date(it.at), 'h:mm a')}</span>
                <span className="font-semibold">{it.value}</span>
                {bp && <span className="text-ink-muted">BP {it.reading.systolic}/{it.reading.diastolic}</span>}
              </li>
            );
          })}
        </ul>
      </div>

      <div className={cn('mt-3 grid gap-2', chips.length > 3 ? 'grid-cols-4' : 'grid-cols-3')}>
        {chips.map((p) => (
          <div key={p.label} className="flex flex-col gap-0.5 rounded-inner bg-subtle/80 px-2.5 py-2">
            <span className="text-[11px] font-medium text-ink-muted">Avg · {p.label}</span>
            <span className="font-display text-[17px] font-semibold tabular">{formatAvg(p.avg, vital)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
