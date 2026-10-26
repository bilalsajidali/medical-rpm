import { format, subDays } from 'date-fns';
import type { Reading, VitalKey } from '@/data/types';

/** One value at a point in time (a reading's vital, or a peek point). */
export interface TimedValue { at: string; value: number }

export interface DayAverage<T extends TimedValue = TimedValue> {
  /** local calendar day, 'yyyy-MM-dd' */
  day: string;
  /** mean of that day's values (unrounded) */
  avg: number;
  min: number;
  max: number;
  /** that day's values, oldest → newest */
  items: T[];
}

/** Local calendar day of an ISO timestamp. */
export const dayKey = (iso: string) => format(new Date(iso), 'yyyy-MM-dd');

/** Group values by local day and average each day. Days come back oldest → newest. */
export function dailyAverages<T extends TimedValue>(items: T[]): DayAverage<T>[] {
  const byDay = new Map<string, T[]>();
  for (const it of [...items].sort((a, b) => a.at.localeCompare(b.at))) {
    const k = dayKey(it.at);
    const list = byDay.get(k);
    if (list) list.push(it);
    else byDay.set(k, [it]);
  }
  return [...byDay.entries()].map(([day, list]) => {
    const vals = list.map((x) => x.value);
    return { day, avg: vals.reduce((a, b) => a + b, 0) / vals.length, min: Math.min(...vals), max: Math.max(...vals), items: list };
  });
}

/**
 * Clinical average: each day's readings are averaged first, then the days are averaged,
 * so a day with five readings weighs the same as a day with one.
 */
export function averageOfDays(days: { avg: number }[]): number | null {
  return days.length ? days.reduce((n, d) => n + d.avg, 0) / days.length : null;
}

export interface VitalValue extends TimedValue { reading: Reading }

/** One vital's values from readings that have it. */
export function vitalValues(readings: Reading[], key: VitalKey): VitalValue[] {
  return readings.flatMap((r) => (r[key] === undefined ? [] : [{ at: r.takenAt, value: r[key], reading: r }]));
}

/** Readings within the last `days` days (rolling window back from `now`). */
export function withinDays<T extends { takenAt: string }>(readings: T[], days: number, now = new Date()): T[] {
  const since = subDays(now, days).toISOString();
  return readings.filter((r) => r.takenAt >= since);
}

/** Day-weighted average of one vital over the last `days` days. */
export function periodAverage(readings: Reading[], key: VitalKey, days: number, now = new Date()): number | null {
  return averageOfDays(dailyAverages(vitalValues(withinDays(readings, days, now), key)));
}

/** Averages are shown whole, except SpO2 which moves in small steps. */
export function formatAvg(v: number | null, key?: VitalKey): string {
  if (v === null) return '—';
  return key === 'spo2' ? String(Math.round(v * 10) / 10) : String(Math.round(v));
}
