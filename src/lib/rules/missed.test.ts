import { describe, expect, it } from 'vitest';
import { daysSinceReading, isMissed } from './missed';

const now = new Date(2026, 9, 5, 12, 0);
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000).toISOString();

describe('isMissed', () => {
  const active = { rpmStatus: 'active' as const };

  it('is not missed at exactly 48 hours', () => {
    expect(isMissed(active, hoursAgo(48), now)).toBe(false);
  });
  it('is missed just after 48 hours', () => {
    expect(isMissed(active, hoursAgo(48.01), now)).toBe(true);
  });
  it('is not missed with a recent reading', () => {
    expect(isMissed(active, hoursAgo(3), now)).toBe(false);
  });
  it('is missed with no reading at all', () => {
    expect(isMissed(active, null, now)).toBe(true);
  });
  it('is never missed for paused or discharged patients', () => {
    expect(isMissed({ rpmStatus: 'paused' }, hoursAgo(100), now)).toBe(false);
    expect(isMissed({ rpmStatus: 'discharged' }, null, now)).toBe(false);
  });
});

describe('daysSinceReading', () => {
  it('counts whole days', () => {
    expect(daysSinceReading(null, now)).toBeNull();
    expect(daysSinceReading(hoursAgo(5), now)).toBe(0);
    expect(daysSinceReading(hoursAgo(73), now)).toBe(3);
  });
});
