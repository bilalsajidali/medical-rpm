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
import { averageOfDays, dailyAverages, formatAvg, periodAverage, vitalValues, withinDays } from '@/lib/rules/averages';
import { BillingCard, MedicalSummary, ThresholdSummary, TimelineCard } from './OverviewSide';
import { StaffTrendCard } from './StaffTrendCard';
import { staffReadingColumns } from './staffReadingColumns';

const RANGES = [{ value: '7', label: '7D' }, { value: '15', label: '15D' }, { value: '30', label: '30D' }, { value: '90', label: '90D' }] as const;
type Range = (typeof RANGES)[number]['value'];
const RANGE_TEXT: Record<Range, string> = { '7': 'last 7 days', '15': 'last 15 days', '30': 'last 30 days', '90': 'last 90 days' };
/** always shown in the card peek, whatever range is picked */
const PERIODS = [7, 15, 30];

/** Min / max over every reading; average = mean of daily averages (see rules/averages). */
function stats(shown: Reading[], all: Reading[], key: VitalKey, rangeDays: number) {
  const values = vitalValues(shown, key);
  const days = dailyAverages(values);
  const withV = values.map((v) => v.reading);
  const statusOf = (r: Reading) => r.flags.find((f) => f.vital === key)?.status ?? 'normal';
  return {
    min: values.length ? Math.min(...values.map((v) => v.value)) : null,
    max: values.length ? Math.max(...values.map((v) => v.value)) : null,
    avg: formatAvg(averageOfDays(days), key),
    peek: { vital: key, days, rangeDays, periods: PERIODS.map((d) => ({ label: `${d} days`, avg: periodAverage(all, key, d) })) },
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
  const shown = withinDays(readings, Number(range));
  const statKeys: VitalKey[] = ['systolic', 'diastolic', 'pulse', summary.patient.devices.includes('glucose') ? 'glucose' : 'spo2'];

  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="flex min-w-0 flex-[2_1_640px] flex-col gap-4">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
          {statKeys.map((k) => <MinMaxAvgCard key={k} label={VITAL_LABEL[k]} unit={VITAL_UNIT[k]} {...stats(shown, readings, k, Number(range))} />)}
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
