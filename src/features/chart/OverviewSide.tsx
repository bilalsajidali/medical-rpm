import { Badge } from '@/components/ui/Badge';
import { focusRing } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState, SkeletonRows } from '@/components/ui/States';
import { Timeline } from '@/components/ui/Timeline';
import type { TimelineItem } from '@/data/api/notes';
import type { PatientSummary } from '@/data/api/patients';
import type { Thresholds, VitalKey } from '@/data/types';
import { cn } from '@/lib/cn';
import { formatTimeCodes, BILLING_RESULT_LABEL } from '@/lib/rules/billing';
import { format } from 'date-fns';

const ROWS: { key: VitalKey; label: string; pct?: boolean; lowOnly?: boolean }[] = [
  { key: 'systolic', label: 'Systolic' }, { key: 'diastolic', label: 'Diastolic' }, { key: 'pulse', label: 'Pulse' },
  { key: 'spo2', label: 'SpO2', pct: true, lowOnly: true }, { key: 'glucose', label: 'Glucose' },
];

export function ThresholdSummary({ thresholds, onEdit }: { thresholds: Thresholds; onEdit?: () => void }) {
  return (
    <Card padding="none" className="flex flex-col gap-3 p-[22px]">
      <CardHeader title="Thresholds" size="sm" right={onEdit && (
        <button type="button" onClick={onEdit} className={cn('rounded-full text-[13px] font-semibold text-accent', focusRing)}>Edit</button>
      )} />
      <table className="w-full border-collapse text-[13px] tabular">
        <thead>
          <tr className="text-left">
            <th scope="col" className="py-1.5 text-xs font-medium text-ink-muted">Vital</th>
            <th scope="col" className="py-1.5 text-xs font-medium text-critical-ink">Critical</th>
            <th scope="col" className="py-1.5 text-xs font-medium text-atrisk-ink">At-risk</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(({ key, label, pct, lowOnly }) => {
            const r = thresholds[key];
            const u = pct ? '%' : '';
            return (
              <tr key={key}>
                <th scope="row" className="border-t border-divider py-1.5 text-left font-normal">{label}</th>
                <td className="border-t border-divider py-1.5">{lowOnly ? `<${r.minCritical}${u}` : `<${r.minCritical} · >${r.maxCritical}`}</td>
                <td className="border-t border-divider py-1.5">{lowOnly ? `<${r.minAtRisk}${u}` : `<${r.minAtRisk} · >${r.maxAtRisk}`}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

export function BillingCard({ summary }: { summary: PatientSummary }) {
  const m = summary.month;
  const b = m.billing;
  const row = (k: string, v: string) => (
    <div className="flex justify-between gap-2 text-sm"><span className="text-ink-muted">{k}</span><span className="font-semibold tabular">{v}</span></div>
  );
  return (
    <Card padding="none" className="flex flex-col gap-3 p-[22px]">
      <CardHeader title="Billing this month" size="sm" />
      {row('Reading days', `${m.readingDays} / ${m.daysSoFar}`)}
      {row('Staff time', `${m.minutes} min`)}
      {row('Live conversation', m.liveCallAt ? `Yes · ${format(new Date(m.liveCallAt), 'MMM d')}` : 'No')}
      {row('Codes', [b.deviceCode, formatTimeCodes(b.timeCodes)].filter((c) => c && c !== '—').join(' · ') || '—')}
      <Badge variant={b.result === 'ready' ? 'accent' : 'neutral'} className="self-start">
        {b.result === 'ready' ? 'Ready to bill' : BILLING_RESULT_LABEL[b.result]}
      </Badge>
    </Card>
  );
}

export function MedicalSummary({ summary }: { summary: PatientSummary }) {
  const p = summary.patient;
  return (
    <Card padding="none" className="flex flex-col gap-3 p-[22px]">
      <CardHeader title="Medical summary" size="sm" />
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-ink-muted">Conditions</span>
        <div className="flex flex-wrap gap-1.5">{p.conditions.map((c) => <Badge key={c} variant="tag" className="text-[13px]">{c}</Badge>)}</div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-ink-muted">Medications</span>
        <span className="text-sm leading-[21px]">{p.medications.length ? p.medications.join(' · ') : 'None recorded'}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-ink-muted">Allergies</span>
        <span className="text-sm">{p.allergies.length ? p.allergies.join(', ') : 'No known allergies'}</span>
      </div>
    </Card>
  );
}

export function TimelineCard({ items, loading, limit = 4, onSeeAll }: { items: TimelineItem[] | undefined; loading: boolean; limit?: number; onSeeAll?: () => void }) {
  return (
    <Card padding="none" className="flex flex-col gap-3.5 p-[22px]">
      <CardHeader title="Care timeline" size="sm" right={onSeeAll && (
        <button type="button" onClick={onSeeAll} className={cn('rounded-full text-[13px] font-semibold text-accent', focusRing)}>See all</button>
      )} />
      {loading ? <SkeletonRows rows={3} />
        : !items || items.length === 0 ? <EmptyState title="No activity yet" className="py-4" />
        : <Timeline items={items.slice(0, limit)} />}
    </Card>
  );
}
