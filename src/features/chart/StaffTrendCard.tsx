import type { ReactNode } from 'react';
import { useState } from 'react';
import { ChartLegend, VitalTrendChart, type ChartVital } from '@/components/charts/VitalTrendChart';
import { Card } from '@/components/ui/Card';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import type { Reading, Thresholds } from '@/data/types';

const TABS: { value: ChartVital; label: string; title: string }[] = [
  { value: 'bp', label: 'BP', title: 'Blood pressure' },
  { value: 'pulse', label: 'Pulse', title: 'Pulse' },
  { value: 'spo2', label: 'SpO2', title: 'SpO2' },
  { value: 'glucose', label: 'Glucose', title: 'Glucose' },
];

/** Staff trend chart with vital tabs and a dashed at-risk limit. `readings` = the range to show. */
export function StaffTrendCard({ readings, thresholds, rangeLabel, rangeControl }: {
  readings: Reading[]; thresholds: Thresholds; rangeLabel: string; rangeControl?: ReactNode;
}) {
  const [vital, setVital] = useState<ChartVital>('bp');
  const tab = TABS.find((t) => t.value === vital)!;
  const limitValue = vital === 'bp' ? thresholds.systolic.maxAtRisk
    : vital === 'spo2' ? thresholds.spo2.minAtRisk : thresholds[vital].maxAtRisk;
  return (
    <Card padding="lg" className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 font-display text-lg font-semibold">{tab.title} · {rangeLabel}</h2>
        <div className="flex flex-wrap gap-2">
          {rangeControl}
          <SegmentedTabs aria-label="Vital" size="sm" value={vital} onChange={setVital} options={TABS.map(({ value, label }) => ({ value, label }))} />
        </div>
      </div>
      <ChartLegend items={[
        { label: vital === 'bp' ? 'Systolic' : tab.title, kind: 'line' },
        ...(vital === 'bp' ? [{ label: 'Diastolic', kind: 'second' as const }] : []),
        { label: `At-risk limit ${limitValue}`, kind: 'dashed' },
      ]} />
      <VitalTrendChart readings={readings} vital={vital} thresholds={thresholds} height={200} ariaLabel={`${tab.title} trend, ${rangeLabel}`} />
    </Card>
  );
}
