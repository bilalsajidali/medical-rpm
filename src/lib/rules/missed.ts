import type { Patient } from '@/data/types';

export const MISSED_AFTER_HOURS = 48;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Active patient whose latest reading is older than 48 hours (or who has none) = missed. */
export function isMissed(
  patient: Pick<Patient, 'rpmStatus'>,
  latestReadingAt: string | null,
  now: Date = new Date(),
): boolean {
  if (patient.rpmStatus !== 'active') return false;
  if (!latestReadingAt) return true;
  return now.getTime() - new Date(latestReadingAt).getTime() > MISSED_AFTER_HOURS * 60 * 60 * 1000;
}

/** Whole days since the latest reading (null when there is none). */
export function daysSinceReading(latestReadingAt: string | null, now: Date = new Date()): number | null {
  if (!latestReadingAt) return null;
  return Math.floor((now.getTime() - new Date(latestReadingAt).getTime()) / DAY_MS);
}
