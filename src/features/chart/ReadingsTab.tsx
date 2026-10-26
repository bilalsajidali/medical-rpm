import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { focusRing } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { PillSelect } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/States';
import { StatusPill } from '@/components/ui/StatusPill';
import type { Reading, Status, VitalKey } from '@/data/types';
import { cn } from '@/lib/cn';
import { dailyAverages, dayKey, formatAvg, periodAverage, vitalValues, withinDays, type DayAverage } from '@/lib/rules/averages';
import { worstStatus } from '@/lib/rules/status';
import { staffReadingColumns } from './staffReadingColumns';

type DaysFilter = '7' | '15' | '30' | '90' | 'all';
type View = 'readings' | 'days';

const VITALS: VitalKey[] = ['systolic', 'diastolic', 'pulse', 'spo2', 'glucose'];
const PERIODS = [7, 15, 30, 90];

interface DayRow {
  day: string;
  readings: Reading[];
  avg: Partial<Record<VitalKey, DayAverage>>;
  status: Status;
}

/** One row per day (newest first) with each vital's daily average. */
function byDay(readings: Reading[]): DayRow[] {
  const perVital = VITALS.map((k) => [k, new Map(dailyAverages(vitalValues(readings, k)).map((d) => [d.day, d]))] as const);
  const days = new Map<string, Reading[]>();
  for (const r of readings) {
    const k = dayKey(r.takenAt);
    days.set(k, [...(days.get(k) ?? []), r]);
  }
  return [...days.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([day, rs]) => ({
      day,
      readings: rs,
      avg: Object.fromEntries(perVital.flatMap(([k, m]) => (m.has(day) ? [[k, m.get(day)!]] : []))),
      status: worstStatus(rs.map((r) => r.status)),
    }));
}

const dayDate = (day: string) => new Date(`${day}T12:00:00`);

/** Daily average, plus the day's low–high when there was more than one reading. */
function AvgCell({ d, k }: { d: DayAverage | undefined; k: VitalKey }) {
  if (!d) return <span className="text-ink-muted">—</span>;
  return (
    <div className="flex flex-col">
      <span className="font-medium">{formatAvg(d.avg, k)}{k === 'spo2' ? '%' : ''}</span>
      {d.items.length > 1 && <span className="text-xs text-ink-muted">{d.min}–{d.max}</span>}
    </div>
  );
}

const dayColumns: ColumnDef<DayRow>[] = [
  { id: 'day', header: 'Day', accessorFn: (r) => r.day, cell: ({ row }) => <span className="font-medium whitespace-nowrap">{format(dayDate(row.original.day), 'EEE, MMM d')}</span> },
  { id: 'count', header: 'Readings', accessorFn: (r) => r.readings.length },
  {
    id: 'bp', header: 'BP avg', enableSorting: false,
    cell: ({ row: { original: r } }) => {
      const s = r.avg.systolic;
      const d = r.avg.diastolic;
      if (!s) return <span className="text-ink-muted">—</span>;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{formatAvg(s.avg)}/{formatAvg(d?.avg ?? null)}</span>
          {s.items.length > 1 && <span className="text-xs text-ink-muted">sys {s.min}–{s.max}</span>}
        </div>
      );
    },
  },
  { id: 'pulse', header: 'Pulse avg', enableSorting: false, cell: ({ row }) => <AvgCell d={row.original.avg.pulse} k="pulse" /> },
  { id: 'spo2', header: 'SpO2 avg', enableSorting: false, cell: ({ row }) => <AvgCell d={row.original.avg.spo2} k="spo2" /> },
  { id: 'glucose', header: 'Glucose avg', enableSorting: false, cell: ({ row }) => <AvgCell d={row.original.avg.glucose} k="glucose" /> },
  { id: 'status', header: 'Worst', enableSorting: false, cell: ({ row }) => <StatusPill status={row.original.status} /> },
];

/** 7 / 15 / 30 / 90-day averages per vital, each the mean of daily averages. */
function PeriodAverages({ readings }: { readings: Reading[] }) {
  const rows = [
    { label: 'Blood pressure', unit: 'mmHg', keys: ['systolic', 'diastolic'] as VitalKey[] },
    { label: 'Pulse', unit: 'bpm', keys: ['pulse'] as VitalKey[] },
    { label: 'SpO2', unit: '%', keys: ['spo2'] as VitalKey[] },
    { label: 'Glucose', unit: 'mg/dL', keys: ['glucose'] as VitalKey[] },
  ].filter((r) => readings.some((x) => x[r.keys[0]] !== undefined));
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-sm tabular">
        <thead>
          <tr className="text-left">
            <th scope="col" className="border-b border-border px-3 py-2.5 text-xs font-medium text-ink-muted">Vital</th>
            {PERIODS.map((d) => <th key={d} scope="col" className="border-b border-border px-3 py-2.5 text-xs font-medium text-ink-muted">Last {d} days</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <th scope="row" className="border-b border-divider px-3 py-3 text-left font-medium">
                {r.label} <span className="text-xs font-normal text-ink-muted">{r.unit}</span>
              </th>
              {PERIODS.map((d) => (
                <td key={d} className="border-b border-divider px-3 py-3 font-semibold">
                  {r.keys.map((k) => formatAvg(periodAverage(readings, k, d), k)).join('/')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ReadingsTab({ readings }: { readings: Reading[] }) {
  const [view, setView] = useState<View>('readings');
  const [status, setStatus] = useState<'all' | Status>('all');
  const [days, setDays] = useState<DaysFilter>('30');
  const [day, setDay] = useState<string | null>(null);
  const inRange = useMemo(() => (days === 'all' ? readings : withinDays(readings, Number(days))), [readings, days]);
  const rows = inRange.filter((r) => (status === 'all' || r.status === status) && (!day || dayKey(r.takenAt) === day));
  const dayRows = useMemo(() => byDay(inRange), [inRange]);

  return (
    <>
      <Card padding="md" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <SegmentedTabs aria-label="View" value={view} onChange={(v) => { setView(v); setDay(null); }} onSurface options={[
              { value: 'readings', label: 'All readings' }, { value: 'days', label: 'By day' },
            ]} />
            {view === 'readings' && (
              <SegmentedTabs aria-label="Status" value={status} onChange={setStatus} options={[
                { value: 'all', label: 'All' }, { value: 'critical', label: 'Critical' }, { value: 'atrisk', label: 'At-Risk' }, { value: 'normal', label: 'Normal' },
              ]} />
            )}
            {day && (
              <button type="button" onClick={() => setDay(null)}
                className={cn('inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-[13px] font-semibold text-surface', focusRing)}>
                {format(dayDate(day), 'EEE, MMM d')}<X size={14} aria-label="Clear day" />
              </button>
            )}
          </div>
          <PillSelect label="Date range" value={days} onChange={(v) => { setDays(v); setDay(null); }} options={[
            { value: '7', label: 'Last 7 days' }, { value: '15', label: 'Last 15 days' }, { value: '30', label: 'Last 30 days' },
            { value: '90', label: 'Last 90 days' }, { value: 'all', label: 'All time' },
          ]} />
        </div>
        {view === 'readings' ? (
          <DataTable
            key="readings" data={rows} columns={staffReadingColumns} getRowId={(r) => r.id} minWidth={720} pageSize={15} noun="readings"
            initialSorting={[{ id: 'when', desc: true }]} resetKey={`${status}-${days}-${day}`}
            empty={<EmptyState title="No readings match" body="Try a longer date range or another status." />}
          />
        ) : (
          <DataTable
            key="days" data={dayRows} columns={dayColumns} getRowId={(r) => r.day} minWidth={760} pageSize={15} noun="days" resetKey={days}
            onRowClick={(r) => { setDay(r.day); setView('readings'); setStatus('all'); }}
            rowLabel={(r) => `Show the ${r.readings.length} readings from ${format(dayDate(r.day), 'MMMM d')}`}
            empty={<EmptyState title="No readings in this range" body="Try a longer date range." />}
          />
        )}
      </Card>
      {view === 'days' && (
        <Card padding="md" className="flex flex-col gap-3">
          <CardHeader title="Average by period" subtitle="Each day's readings are averaged first, then the days are averaged." />
          <PeriodAverages readings={readings} />
        </Card>
      )}
    </>
  );
}
