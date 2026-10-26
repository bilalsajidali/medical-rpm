import { format } from 'date-fns';
import { useId, useMemo, useState, type PointerEvent } from 'react';
import { cn } from '@/lib/cn';
import { averageOfDays, dailyAverages } from '@/lib/rules/averages';
import { smoothPath } from './smoothPath';

export interface PeekPoint {
  /** ISO timestamp */
  at: string;
  /** plotted number (main vital) */
  value: number;
  /** what the reading shows, e.g. "128/84" */
  display: string;
}

const W = 300;
const H = 96;
const PAD = 8;

/**
 * The expanded layer a VitalCard grows into on hover/focus: 30-day trend with
 * scrubbing plus low / average / high. Sits over the card; the card owns `open`.
 */
export function VitalPeek({ open, label, unit, points, days = 30, anchor = 'left' }: {
  open: boolean;
  /** which card edge the panel stays pinned to as it grows (keeps it on screen) */
  anchor?: 'left' | 'right';
  label: string;
  unit: string;
  points: PeekPoint[];
  days?: number;
}) {
  const gradId = useId();
  const [hover, setHover] = useState<number | null>(null);

  const geo = useMemo(() => {
    const vals = points.map((p) => p.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min || 1;
    const xy = points.map((p, i): [number, number] => [
      points.length === 1 ? W / 2 : (i / (points.length - 1)) * W,
      PAD + (1 - (p.value - min) / span) * (H - PAD * 2),
    ]);
    const line = smoothPath(xy);
    const area = xy.length > 1 ? `${line} L${W},${H} L0,${H} Z` : '';
    // day-weighted: average each day's readings, then the days
    const avg = averageOfDays(dailyAverages(points)) ?? 0;
    const lo = points[vals.indexOf(min)];
    const hi = points[vals.indexOf(max)];
    return { xy, line, area, avg, lo, hi };
  }, [points]);

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    geo.xy.forEach(([px], i) => { if (Math.abs(px - x) < Math.abs(geo.xy[best][0] - x)) best = i; });
    setHover(best);
  };

  const latest = points[points.length - 1];
  const shown = hover !== null ? points[hover] : latest;
  const dot = hover !== null ? geo.xy[hover] : geo.xy[geo.xy.length - 1];
  const fmtAvg = Number.isInteger(geo.avg) ? geo.avg : geo.avg.toFixed(unit === '%' ? 1 : 0);
  // staggered reveal: each block rides in slightly after the previous one
  const reveal = (i: number) => ({ transitionDelay: open ? `${80 + i * 45}ms` : '0ms' });
  const item = cn(
    'transition-[opacity,translate,filter] duration-500 ease-[var(--ease-spring)] motion-reduce:transition-none',
    open ? 'translate-y-0 opacity-100 blur-[0px]' : 'translate-y-1.5 opacity-0 blur-[3px]',
  );

  return (
    <div
      aria-hidden={!open}
      // at least card + 24px, but never too narrow for the chart and stats
      style={{ width: 'max(calc(100% + 24px), 320px)' }}
      className={cn(
        'peek-glass absolute -top-3 z-30 rounded-[26px] p-5',
        anchor === 'left' ? '-left-3 origin-top-left' : '-right-3 origin-top-right',
        'transition-[scale,opacity,border-radius,filter] duration-[560ms] ease-[var(--ease-spring)] motion-reduce:transition-none',
        open
          ? 'pointer-events-auto scale-100 opacity-100 blur-[0px]'
          : 'pointer-events-none scale-[0.94] rounded-[20px] opacity-0 blur-[6px] duration-200 ease-out',
      )}
    >
      <div className={cn('flex items-baseline justify-between gap-2', item)} style={reveal(0)}>
        <span className="text-base font-medium text-ink-muted">{label}</span>
        <span className="text-xs font-semibold tracking-wide text-ink-muted uppercase">{days} days · {points.length} readings</span>
      </div>

      <div className={cn('mt-1 flex items-baseline gap-2', item)} style={reveal(1)}>
        <span key={shown.at} className="peek-pop font-display text-[34px] leading-10 font-medium tabular">{shown.display}</span>
        <span className="text-base text-ink-muted">{unit}</span>
        <span className="ml-auto text-sm text-ink-muted tabular">
          {hover !== null ? format(new Date(shown.at), 'MMM d, h:mm a') : 'Latest'}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className={cn('mt-3 h-24 w-full touch-none overflow-visible text-accent', item)}
        style={reveal(2)}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`${label}, last ${days} days`}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity={0.28} />
            <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
          </linearGradient>
        </defs>
        <path
          d={geo.area}
          fill={`url(#${gradId})`}
          className={cn('origin-bottom transition-[scale,opacity] duration-700 ease-[var(--ease-spring)] motion-reduce:transition-none', open ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0')}
          style={{ transitionDelay: open ? '160ms' : '0ms', transformBox: 'fill-box' }}
        />
        <path
          d={geo.line}
          pathLength={1}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          strokeDasharray="1 1"
          className="transition-[stroke-dashoffset] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{ strokeDashoffset: open ? 0 : 1, transitionDelay: open ? '120ms' : '0ms' }}
        />
        {hover !== null && (
          <line x1={dot[0]} x2={dot[0]} y1={0} y2={H} stroke="currentColor" strokeOpacity={0.25} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        )}
      </svg>
      {/* dot lives in HTML so it stays round while the svg stretches */}
      <div className="pointer-events-none relative -mt-24 h-24">
        {dot && (
          <span
            className={cn(
              'absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-accent shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-accent)_22%,transparent)]',
              'transition-[left,top,opacity] duration-300 ease-[var(--ease-spring)] motion-reduce:transition-none',
              open ? 'opacity-100' : 'opacity-0',
            )}
            style={{ left: `${(dot[0] / W) * 100}%`, top: `${(dot[1] / H) * 100}%`, transitionDelay: open && hover === null ? '700ms' : '0ms' }}
          />
        )}
      </div>

      <div className={cn('mt-4 grid grid-cols-3 gap-2', item)} style={reveal(3)}>
        {[
          { k: 'Low', v: geo.lo.display },
          { k: 'Average', v: unit === 'mmHg' ? `${fmtAvg} sys` : `${fmtAvg}` },
          { k: 'High', v: geo.hi.display },
        ].map((s) => (
          <div key={s.k} className="flex flex-col gap-0.5 rounded-inner bg-subtle/80 px-3 py-2">
            <span className="text-xs font-medium text-ink-muted">{s.k}</span>
            <span className="font-display text-[17px] font-semibold tabular">{s.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
