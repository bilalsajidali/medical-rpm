export interface MinMaxAvgCardProps {
  label: string;
  unit: string;
  min: number | null;
  max: number | null;
  avg: number | null;
  counts: { critical: number; atrisk: number; normal: number };
}

const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

/** Min / Max / Avg for one vital plus the critical / at-risk / normal split. */
export function MinMaxAvgCard({ label, unit, min, max, avg, counts }: MinMaxAvgCardProps) {
  const total = counts.critical + counts.atrisk + counts.normal;
  const c = pct(counts.critical, total);
  const r = pct(counts.atrisk, total);
  const n = total ? 100 - c - r : 0;
  const split = total === 0
    ? 'No readings in this range'
    : c === 0 && r === 0 ? '100% normal' : `${c}% critical · ${r}% at-risk · ${n}% normal`;
  const fmt = (v: number | null) => (v === null ? '—' : String(v));
  return (
    <div className="flex flex-col gap-2.5 rounded-card border border-border bg-surface p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-semibold">{label}</span>
        <span className="text-xs text-ink-muted">{unit}</span>
      </div>
      <dl className="m-0 grid grid-cols-3 gap-1.5 tabular">
        {([['Min', min], ['Max', max], ['Avg', avg]] as const).map(([k, v]) => (
          <div key={k} className="flex flex-col">
            <dt className="text-xs text-ink-muted">{k}</dt>
            <dd className="m-0 text-base font-semibold">{fmt(v)}</dd>
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
}
