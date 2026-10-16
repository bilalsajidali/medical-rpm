import { subDays } from 'date-fns';
import type { ChartVital } from '@/components/charts/VitalTrendChart';
import type { PeekPoint } from '@/components/charts/VitalPeek';
import type { Reading, Status, VitalKey } from '@/data/types';
import { worstStatus } from '@/lib/rules/status';

export interface PatientVital {
  key: ChartVital;
  label: string;
  /** tab label for the chart */
  tab: string;
  unit: string;
  vitals: VitalKey[];
  value: (r: Reading) => string;
  main: VitalKey;
}

/** Patient wording: Blood pressure, Pulse, Oxygen, Sugar. */
export const PATIENT_VITALS: PatientVital[] = [
  { key: 'bp', label: 'Blood pressure', tab: 'Blood pressure', unit: 'mmHg', vitals: ['systolic', 'diastolic'], main: 'systolic', value: (r) => `${r.systolic}/${r.diastolic ?? '—'}` },
  { key: 'pulse', label: 'Pulse', tab: 'Pulse', unit: 'bpm', vitals: ['pulse'], main: 'pulse', value: (r) => `${r.pulse}` },
  { key: 'spo2', label: 'Oxygen', tab: 'Oxygen', unit: '%', vitals: ['spo2'], main: 'spo2', value: (r) => `${r.spo2}` },
  { key: 'glucose', label: 'Sugar', tab: 'Sugar', unit: 'mg/dL', vitals: ['glucose'], main: 'glucose', value: (r) => `${r.glucose}` },
];

export function hasVital(r: Reading, v: PatientVital): boolean {
  return r[v.main] !== undefined;
}

/** Status of just these vitals in a reading, plus the direction of the worst flag. */
export function vitalStatusOf(r: Reading, v: PatientVital): { status: Status; direction?: 'above' | 'below' } {
  const flags = r.flags.filter((f) => v.vitals.includes(f.vital));
  const status = worstStatus(flags.map((f) => f.status));
  return { status, direction: flags.find((f) => f.status === status)?.direction };
}

/** Direction of a whole reading's worst flag (for "Above range" / "Below range"). */
export function readingDirection(r: Reading): 'above' | 'below' | undefined {
  return r.flags.find((f) => f.status === r.status)?.direction;
}

/** `readings` newest first → latest reading that has this vital. */
export function latestWith(readings: Reading[], v: PatientVital): Reading | null {
  return readings.find((r) => hasVital(r, v)) ?? null;
}

/** Main-vital values from the last `days` days, oldest → newest. */
export function sparkValues(readings: Reading[], v: PatientVital, days = 7, now = new Date()): number[] {
  const since = subDays(now, days).toISOString();
  return readings
    .filter((r) => r.takenAt >= since && hasVital(r, v))
    .map((r) => r[v.main] as number)
    .reverse();
}

/** Readings of this vital from the last `days` days for the card peek, oldest → newest. */
export function historyPoints(readings: Reading[], v: PatientVital, days = 30, now = new Date()): PeekPoint[] {
  const since = subDays(now, days).toISOString();
  return readings
    .filter((r) => r.takenAt >= since && hasVital(r, v))
    .map((r) => ({ at: r.takenAt, value: r[v.main] as number, display: v.value(r) }))
    .reverse();
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export const RANGE_OPTIONS = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '3 months' },
] as const;
export type RangeValue = (typeof RANGE_OPTIONS)[number]['value'];

export const MEAL_TEXT = { before: 'before meal', after: 'after meal' } as const;
