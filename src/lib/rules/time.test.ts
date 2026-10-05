import { describe, expect, it } from 'vitest';
import { timerMinutes, todaySlots } from './time';

describe('timerMinutes', () => {
  it('rounds up to whole minutes with a minimum of 1', () => {
    expect(timerMinutes(0)).toBe(1);
    expect(timerMinutes(5_000)).toBe(1);
    expect(timerMinutes(60_000)).toBe(1);
    expect(timerMinutes(60_001)).toBe(2);
    expect(timerMinutes(14 * 60_000 + 32_000)).toBe(15);
  });
});

describe('todaySlots', () => {
  const at = (h: number, m = 0) => new Date(2026, 9, 5, h, m);

  it('morning done, evening due in the evening window', () => {
    const s = todaySlots([at(8, 2)], at(18, 42));
    expect(s.morning.state).toBe('done');
    expect(s.evening.state).toBe('due');
  });
  it('evening done after an afternoon reading', () => {
    expect(todaySlots([at(8, 2), at(18, 50)], at(19)).evening.state).toBe('done');
  });
  it('a second reading after the morning one counts as the evening reading', () => {
    expect(todaySlots([at(8, 2), at(11, 30)], at(12)).evening.state).toBe('done');
  });
  it('upcoming before the window, late after it', () => {
    expect(todaySlots([], at(5)).morning.state).toBe('upcoming');
    expect(todaySlots([], at(12)).morning.state).toBe('late');
    expect(todaySlots([at(8)], at(15)).evening.state).toBe('upcoming');
    expect(todaySlots([at(8)], at(22)).evening.state).toBe('late');
  });
  it('ignores readings from other days', () => {
    expect(todaySlots([new Date(2026, 9, 4, 8)], at(9)).morning.state).toBe('due');
  });
});
