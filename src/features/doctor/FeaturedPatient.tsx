import { subDays } from 'date-fns';
import { useState } from 'react';
import { Link } from 'react-router';
import { ChartLegend, VitalTrendChart } from '@/components/charts/VitalTrendChart';
import { Avatar } from '@/components/ui/Avatar';
import { focusRing } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { Skeleton } from '@/components/ui/States';
import { VitalCard } from '@/components/ui/VitalCard';
import { useLatestStaffNote } from '@/data/queries/care';
import { usePatient, useReadings } from '@/data/queries/patients';
import type { Reading, VitalKey } from '@/data/types';
import { cn } from '@/lib/cn';
import { ageOf, formatTime, formatWhen, patientName } from '@/lib/format';
import { latestWith, PATIENT_VITALS, vitalStatusOf } from '@/features/patient/vitals';

const RANGES = [{ value: '7', label: '7D' }, { value: '30', label: '30D' }, { value: '90', label: '90D' }] as const;
type Range = (typeof RANGES)[number]['value'];
const STAFF_LABEL: Record<string, { label: string; sub: (r: Reading) => string }> = {
  bp: { label: 'Blood pressure', sub: (r) => `mmHg · ${formatTime(r.takenAt)}` },
  pulse: { label: 'Pulse', sub: (r) => `bpm · ${formatTime(r.takenAt)}` },
  spo2: { label: 'SpO2', sub: (r) => `Oxygen · ${formatTime(r.takenAt)}` },
  glucose: { label: 'Glucose', sub: (r) => `mg/dL · ${formatTime(r.takenAt)}` },
};

const avg = (rs: Reading[], k: VitalKey) => {
  const v = rs.map((r) => r[k]).filter((x): x is number => x !== undefined);
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
};

/** The most recently escalated patient: BP chart, 4 vital cards and the latest nurse note. */
export function FeaturedPatient({ patientId }: { patientId: string }) {
  const summary = usePatient(patientId);
  const readings = useReadings(patientId);
  const note = useLatestStaffNote(patientId);
  const [range, setRange] = useState<Range>('30');

  if (!summary.data || !readings.data) return <Skeleton className="h-[420px] rounded-card" />;
  const p = summary.data.patient;
  const shown = readings.data.filter((r) => r.takenAt >= subDays(new Date(), Number(range)).toISOString());
  const sys = avg(shown, 'systolic');
  const dia = avg(shown, 'diastolic');

  return (
    <div className="flex flex-wrap gap-4">
      <Card padding="lg" className="flex min-w-0 flex-[2_1_560px] flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to={`/doctor/patients/${p.id}`} className={cn('flex items-center gap-3 rounded-inner text-ink no-underline', focusRing)}>
            <Avatar firstName={p.firstName} lastName={p.lastName} size={44} />
            <span className="flex flex-col">
              <span className="font-display text-lg font-semibold">{patientName(p)}</span>
              <span className="text-[13px] text-ink-muted">{p.sex}, {ageOf(p.dob)} · {p.conditions[0]} · MRN {p.mrn}</span>
            </span>
          </Link>
          <SegmentedTabs aria-label="Range" size="sm" value={range} onChange={setRange} options={[...RANGES]} />
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-ink-muted">Blood pressure · {range}-day average</span>
            <span className="font-display text-[44px] leading-[48px] font-medium tabular">{sys ?? '—'}/{dia ?? '—'} <span className="text-base text-ink-muted">mmHg</span></span>
          </div>
          <ChartLegend items={[{ label: 'Systolic', kind: 'line' }, { label: 'Diastolic', kind: 'second' }, { label: `At-risk limit ${p.thresholds.systolic.maxAtRisk}`, kind: 'dashed' }]} />
        </div>
        <VitalTrendChart readings={shown} vital="bp" thresholds={p.thresholds} area height={220} ariaLabel={`Blood pressure trend for ${patientName(p)}, last ${range} days`} />
      </Card>
      <div className="grid min-w-0 flex-[1_1_300px] grid-cols-2 gap-4">
        {PATIENT_VITALS.map((v) => {
          const r = latestWith(readings.data, v);
          const st = r ? vitalStatusOf(r, v) : null;
          const meta = STAFF_LABEL[v.key];
          return (
            <VitalCard key={v.key} label={meta.label} value={r ? `${v.value(r)}${v.key === 'spo2' ? '%' : ''}` : '—'} unit=""
              status={st?.status ?? null} size="sm" pillBelow timestamp={r ? meta.sub(r) : 'No reading'} className="p-[18px]" />
          );
        })}
        <Card padding="none" className="col-span-2 flex flex-col gap-2 p-[18px]">
          <span className="text-[13px] font-semibold">Latest nurse note</span>
          {note.isPending ? <Skeleton className="h-12" /> : note.data ? (
            <>
              <p className="m-0 text-sm leading-[21px]">{note.data.body}</p>
              <span className="text-xs text-ink-muted">{note.data.author} · {formatWhen(note.data.at)}</span>
            </>
          ) : <span className="text-sm text-ink-muted">No nurse notes yet.</span>}
        </Card>
      </div>
    </div>
  );
}
