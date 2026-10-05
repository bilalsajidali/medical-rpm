import { READING_WINDOWS, todaySlots, type SlotKey, type SlotStatus } from '@/lib/rules/time';
import { formatTime } from '@/lib/format';

export interface DueBanner { title: string; body: string; dueSlot: SlotKey | null }

/** Copy for the "next reading" banner, from today's slot states. */
export function dueBanner(slots: Record<SlotKey, SlotStatus>): DueBanner {
  const { morning, evening } = slots;
  if (morning.state === 'due') return { title: 'Morning reading is due', body: `Please take it before ${READING_WINDOWS.morning.dueBy}`, dueSlot: 'morning' };
  if (evening.state === 'due') return { title: 'Evening reading is due', body: `Please take it before ${READING_WINDOWS.evening.dueBy}`, dueSlot: 'evening' };
  if (morning.state === 'upcoming') return { title: 'Next: morning reading', body: `Your morning reading opens at ${READING_WINDOWS.morning.from}`, dueSlot: null };
  if (evening.state === 'done' && morning.state === 'done') return { title: 'All done for today', body: 'Great job. Your next reading is tomorrow morning.', dueSlot: null };
  if (evening.state === 'upcoming') {
    return {
      title: morning.state === 'done' ? `Morning reading done at ${formatTime(morning.doneAt!)}` : 'Morning reading was missed',
      body: `Your evening reading opens at ${READING_WINDOWS.evening.from}`,
      dueSlot: null,
    };
  }
  return { title: 'Evening reading is late', body: 'You can still add it now.', dueSlot: 'evening' };
}

export function todayStatus(readingTimes: string[], now = new Date()) {
  return todaySlots(readingTimes.map((t) => new Date(t)), now);
}

export interface MedDose { name: string; time: string; hour: number }

/** "Metformin 500 mg twice daily" → 8:00 AM and 8:00 PM doses. */
export function medicationDoses(medications: string[]): MedDose[] {
  const doses: MedDose[] = [];
  for (const med of medications) {
    const name = med.replace(/\s+(twice daily|daily|nightly|every evening)$/i, '');
    if (/twice daily/i.test(med)) {
      doses.push({ name, time: '8:00 AM', hour: 8 }, { name, time: '8:00 PM', hour: 20 });
    } else if (/nightly|evening/i.test(med)) {
      doses.push({ name, time: '9:00 PM', hour: 21 });
    } else {
      doses.push({ name, time: '9:00 AM', hour: 9 });
    }
  }
  return doses.sort((a, b) => a.hour - b.hour);
}
