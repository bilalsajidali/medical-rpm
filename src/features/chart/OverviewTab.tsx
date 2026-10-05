import { subDays } from 'date-fns';
import { useState } from 'react';
import { focusRing } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { MinMaxAvgCard } from '@/components/ui/MinMaxAvgCard';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import type { TimelineItem } from '@/data/api/notes';
import type { PatientSummary } from '@/data/api/patients';
import type { Reading, VitalKey } from '@/data/types';
import { cn } from '@/lib/cn';
import { VITAL_LABEL, VITAL_UNIT } from '@/lib/format';
import { BillingCard, MedicalSummary, ThresholdSummary, TimelineCard } from './OverviewSide';
import { StaffTrendCard } from './StaffTrendCard';
import { staffReadingColumns } from './staffReadingColumns';

const RANGES = [{ value: '7', label: '7D' }, { value: '30', label: '30D' }, { value: '90', label: '90D' }] as const;
type Range = (typeof RANGES)[number]['value'];
const RANGE_TEXT: Record<Range, string> = { '7': 'last 7 days', '30': 'last 30 days', '90': 'last 90 days' };

function stats(readings: Reading[], key: VitalKey) {
  const withV = readings.filter((r) => r[key] !== undefined);
  const vals = withV.map((r) => r[key] as number);
  const statusOf = (r: Reading) => r.flags.find((f) => f.vital === key)?.status ?? 'normal';
  return {
    min: vals.length ? Math.min(...vals) : null,
    max: vals.length ? Math.max(...vals) : null,
    avg: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null,
    counts: {
      critical: withV.filter((r) => statusOf(r) === 'critical').length,
      atrisk: withV.filter((r) => statusOf(r) === 'atrisk').length,
      normal: withV.filter((r) => statusOf(r) === 'normal').length,
    },
  };
}

export function OverviewTab({ summary, readings, timeline, timelineLoading, onTab, canEditThresholds }: {
  summary: PatientSummary; readings: Reading[]; timeline: TimelineItem[] | undefined; timelineLoading: boolean;
  onTab: (tab: 'readings' | 'notes' | 'thresholds') => void; canEditThresholds: boolean;
}) {
  const [range, setRange] = useState<Range>('30');
  const since = subDays(new Date(), Number(range)).toISOString();
  const shown = readings.filter((r) => r.takenAt >= since);
  const statKeys: VitalKey[] = ['systolic', 'diastolic', 'pulse', summary.patient.devices.includes('glucose') ? 'glucose' : 'spo2'];

  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="flex min-w-0 flex-[2_1_640px] flex-col gap-4">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
          {statKeys.map((k) => <MinMaxAvgCard key={k} label={VITAL_LABEL[k]} unit={VITAL_UNIT[k]} {...stats(shown, k)} />)}
        </div>
        <StaffTrendCard
          readings={shown} thresholds={summary.patient.thresholds} rangeLabel={RANGE_TEXT[range]}
          rangeControl={<SegmentedTabs aria-label="Range" size="sm" variant="range" value={range} onChange={setRange} options={[...RANGES]} />}
        />
        <Card padding="lg" className="flex flex-col gap-3">
          <CardHeader title="Recent readings" right={
            <button type="button" onClick={() => onTab('readings')} className={cn('rounded-full text-sm font-semibold text-accent', focusRing)}>All readings</button>
          } />
          <DataTable data={readings.slice(0, 5)} columns={staffReadingColumns} getRowId={(r) => r.id} minWidth={620}
            empty={<p className="py-6 text-center text-sm text-ink-muted">No readings yet.</p>} />
        </Card>
      </div>
      <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-4">
        <BillingCard summary={summary} />
        <ThresholdSummary thresholds={summary.patient.thresholds} onEdit={canEditThresholds ? () => onTab('thresholds') : undefined} />
        <MedicalSummary summary={summary} />
        <TimelineCard items={timeline} loading={timelineLoading} onSeeAll={() => onTab('notes')} />
      </div>
    </div>
  );
}
