/** Timer duration → billable minutes: rounded up to whole minutes, minimum 1. */
export function timerMinutes(elapsedMs: number): number {
  return Math.max(1, Math.ceil(elapsedMs / 60000));
}

/** Reading schedule (local hours): morning due 6–11 AM, evening due 5–9 PM. */
export const READING_WINDOWS = {
  morning: { start: 6, end: 11, label: 'Morning reading', from: '6:00 AM', dueBy: '11:00 AM' },
  evening: { start: 17, end: 21, label: 'Evening reading', from: '5:00 PM', dueBy: '9:00 PM' },
} as const;

/** Readings before this hour count as the morning reading, after it as the evening one. */
const SPLIT_HOUR = 14;

export type SlotKey = keyof typeof READING_WINDOWS;
export type SlotState = 'done' | 'due' | 'upcoming' | 'late';
export interface SlotStatus { state: SlotState; doneAt: Date | null }

/**
 * Today's morning/evening reading status.
 * Morning is done by any reading today before 2 PM. Evening is done by a reading today after 2 PM,
 * or by a second reading taken after the morning one.
 */
export function todaySlots(readingTimes: Date[], now: Date): Record<SlotKey, SlotStatus> {
  const today = readingTimes
    .filter((t) => t.toDateString() === now.toDateString() && t.getTime() <= now.getTime())
    .sort((a, b) => a.getTime() - b.getTime());
  const morningAt = today.find((t) => t.getHours() < SPLIT_HOUR) ?? null;
  const eveningAt = today.find((t) => t.getHours() >= SPLIT_HOUR)
    ?? (morningAt ? today.find((t) => t.getTime() > morningAt.getTime()) ?? null : null);

  const stateOf = (slot: SlotKey, doneAt: Date | null): SlotStatus => {
    if (doneAt) return { state: 'done', doneAt };
    const h = now.getHours();
    const w = READING_WINDOWS[slot];
    if (h < w.start) return { state: 'upcoming', doneAt: null };
    if (h < w.end) return { state: 'due', doneAt: null };
    return { state: 'late', doneAt: null };
  };
  return { morning: stateOf('morning', morningAt), evening: stateOf('evening', eveningAt) };
}
