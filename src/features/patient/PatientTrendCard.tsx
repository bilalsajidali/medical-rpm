import { Info } from 'lucide-react';
import { useState } from 'react';
import { ChartLegend, VitalTrendChart } from '@/components/charts/VitalTrendChart';
import { Card } from '@/components/ui/Card';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import type { Reading, Thresholds } from '@/data/types';
import { formatDay } from '@/lib/format';
import { subDays } from 'date-fns';
import { PATIENT_VITALS, RANGE_OPTIONS, hasVital, vitalStatusOf, type PatientVital, type RangeValue } from './vitals';

function average(readings: Reading[], v: PatientVital): string {
  if (readings.length === 0) return '—';
  const avg = (k: 'systolic' | 'diastolic' | 'pulse' | 'spo2' | 'glucose') => {
    const vals = readings.map((r) => r[k]).filter((x): x is number => x !== undefined);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  };
  if (v.key === 'bp') return `${avg('systolic')}/${avg('diastolic')}`;
  return `${avg(v.main)}`;
}

/** Plain-English summary of out-of-range readings in the shown range. */
function plainNote(readings: Reading[], v: PatientVital, rangeLabel: string): string | null {
  const out = readings.filter((r) => vitalStatusOf(r, v).status !== 'normal'); // newest first
  if (out.length === 0) return null;
  const last = out[0];
  const dir = vitalStatusOf(last, v).direction === 'below' ? 'below' : 'above';
  const when = formatDay(last.takenAt);
  const value = `${v.value(last)}${v.key === 'spo2' ? '%' : ''}`;
  const lead = out.length === 1
    ? `One reading was ${dir} your range on ${when} (${value}).`
    : `${out.length} readings were outside your range in the last ${rangeLabel}. The most recent was ${dir} your range on ${when} (${value}).`;
  const backInRange = readings[0] && readings[0].id !== last.id && vitalStatusOf(readings[0], v).status === 'normal';
  return `${lead} Your care team sees every reading.${backInRange ? ' Everything since then is back in range.' : ''}`;
}

export function PatientTrendCard({ readings, thresholds, className }: { readings: Reading[]; thresholds: Thresholds; className?: string }) {
  const [vitalKey, setVitalKey] = useState<PatientVital['key']>('bp');
  const [range, setRange] = useState<RangeValue>('30');
  const v = PATIENT_VITALS.find((x) => x.key === vitalKey)!;
  const since = subDays(new Date(), Number(range)).toISOString();
  const shown = readings.filter((r) => r.takenAt >= since && hasVital(r, v)); // newest first
  const rangeLabel = RANGE_OPTIONS.find((o) => o.value === range)!.label;
  const note = plainNote(shown, v, rangeLabel);
  const avgLabel = range === '90' ? '3-month' : `${range}-day`;
  const isBp = v.key === 'bp';

  return (
    <Card padding="lg" className={className}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedTabs aria-label="Vital" size="lg" value={vitalKey} onChange={setVitalKey}
            options={PATIENT_VITALS.map((x) => ({ value: x.key, label: x.tab }))} />
          <SegmentedTabs aria-label="Time range" size="lg" variant="range" value={range} onChange={setRange}
            options={RANGE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} />
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-base text-ink-muted">Your {avgLabel} average</span>
            <span className="font-display text-[44px] leading-[48px] font-medium tabular">
              {average(shown, v)} <span className="text-[17px] text-ink-muted">{v.unit}</span>
            </span>
          </div>
          <ChartLegend size="md" items={[
            { label: isBp ? 'Top number' : v.label, kind: 'line' },
            ...(isBp ? [{ label: 'Bottom number', kind: 'second' as const }] : []),
            { label: 'Your healthy range', kind: 'band' },
          ]} />
        </div>
        <VitalTrendChart
          readings={shown} vital={v.key} thresholds={thresholds} variant="patient" height={260}
          ariaLabel={`${v.label} over the last ${rangeLabel}${note ? `. ${note}` : ', all inside your healthy range.'}`}
        />
        {note && (
          <div className="flex items-start gap-2.5 rounded-inner bg-atrisk-bg px-4 py-3.5 text-atrisk-ink">
            <Info size={20} strokeWidth={1.8} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span className="text-[15px] leading-[22px]">{note}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
