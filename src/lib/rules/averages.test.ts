import { describe, expect, it } from 'vitest';
import type { Reading } from '@/data/types';
import { averageOfDays, dailyAverages, formatAvg, periodAverage, vitalValues } from './averages';

const at = (d: number, h: number) => new Date(2026, 9, d, h, 0).toISOString();
const reading = (takenAt: string, systolic?: number, glucose?: number): Reading => ({
  id: takenAt, patientId: 'p', takenAt, source: 'device', systolic, diastolic: systolic && 80, glucose, status: 'normal', flags: [],
});

describe('dailyAverages', () => {
  it('averages each day separately, oldest day first', () => {
    const days = dailyAverages([{ at: at(2, 9), value: 150 }, { at: at(1, 8), value: 120 }, { at: at(1, 20), value: 140 }]);
    expect(days.map((d) => [d.day, d.avg, d.items.length])).toEqual([['2026-10-01', 130, 2], ['2026-10-02', 150, 1]]);
    expect(days[0]).toMatchObject({ min: 120, max: 140 });
  });
});

describe('averageOfDays', () => {
  it('weighs every day equally, not every reading', () => {
    // day 1: 5 readings of 120, day 2: 1 reading of 160 → (120 + 160) / 2, not 760 / 6
    const values = [...Array.from({ length: 5 }, (_, i) => ({ at: at(1, 8 + i), value: 120 })), { at: at(2, 8), value: 160 }];
    expect(averageOfDays(dailyAverages(values))).toBe(140);
  });
  it('is null with no days', () => {
    expect(averageOfDays([])).toBeNull();
  });
});

describe('vitalValues / periodAverage', () => {
  const readings = [reading(at(20, 8), 130), reading(at(20, 9), undefined, 110), reading(at(24, 8), 150), reading(at(24, 20), 170), reading(at(5, 8), 200)];
  const now = new Date(2026, 9, 26, 12, 0);

  it('skips readings without the vital', () => {
    expect(vitalValues(readings, 'systolic')).toHaveLength(4);
    expect(vitalValues(readings, 'glucose')).toHaveLength(1);
  });
  it('averages days inside the window only', () => {
    // 7 days: Oct 20 (130) and Oct 24 (avg 160) → 145; the Oct 5 reading is outside
    expect(periodAverage(readings, 'systolic', 7, now)).toBe(145);
    expect(periodAverage(readings, 'systolic', 30, now)).toBe((130 + 160 + 200) / 3);
  });
});

describe('formatAvg', () => {
  it('rounds to whole numbers, SpO2 to one decimal', () => {
    expect(formatAvg(128.6, 'systolic')).toBe('129');
    expect(formatAvg(96.25, 'spo2')).toBe('96.3');
    expect(formatAvg(null)).toBe('—');
  });
});
