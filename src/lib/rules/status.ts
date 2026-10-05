import type { Range, Reading, Status, Thresholds, VitalKey } from '@/data/types';

export const VITAL_KEYS: VitalKey[] = ['systolic', 'diastolic', 'pulse', 'spo2', 'glucose'];

const RANK: Record<Status, number> = { normal: 0, atrisk: 1, critical: 2 };

export type ReadingValues = Partial<Record<VitalKey, number>>;
export type Flag = Reading['flags'][number];

/** Worst of several statuses (critical > atrisk > normal). */
export function worstStatus(statuses: Status[]): Status {
  return statuses.reduce<Status>((worst, s) => (RANK[s] > RANK[worst] ? s : worst), 'normal');
}

/** Sort comparator: most severe first. */
export function compareStatus(a: Status, b: Status): number {
  return RANK[b] - RANK[a];
}

/** Status of one value against one range, plus the limit it crossed (null = normal). */
export function evaluateVital(value: number, range: Range): Omit<Flag, 'vital'> | null {
  if (value < range.minCritical) return { status: 'critical', limit: range.minCritical, direction: 'below' };
  if (value > range.maxCritical) return { status: 'critical', limit: range.maxCritical, direction: 'above' };
  if (value < range.minAtRisk) return { status: 'atrisk', limit: range.minAtRisk, direction: 'below' };
  if (value > range.maxAtRisk) return { status: 'atrisk', limit: range.maxAtRisk, direction: 'above' };
  return null;
}

export function vitalStatus(value: number, range: Range): Status {
  return evaluateVital(value, range)?.status ?? 'normal';
}

/** Reading status = worst of its vitals; every non-normal vital is recorded in flags. */
export function computeReadingStatus(values: ReadingValues, thresholds: Thresholds): { status: Status; flags: Flag[] } {
  const flags: Flag[] = [];
  for (const vital of VITAL_KEYS) {
    const value = values[vital];
    if (value === undefined || Number.isNaN(value)) continue;
    const result = evaluateVital(value, thresholds[vital]);
    if (result) flags.push({ vital, ...result });
  }
  return { status: worstStatus(flags.map((f) => f.status)), flags };
}

export type PatientStatus = Status | 'missed';

/** A patient's status in lists: missed wins, otherwise the latest reading's status. */
export function patientStatus(latest: Pick<Reading, 'status'> | null, missed: boolean): PatientStatus {
  if (missed || !latest) return 'missed';
  return latest.status;
}
