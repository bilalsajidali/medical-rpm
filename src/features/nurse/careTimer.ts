import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { useAddTimeEntry } from '@/data/queries/care';
import { timerMinutes } from '@/lib/rules/time';

interface TimerState {
  patientId: string | null;
  startedAt: number | null;
  start: (patientId: string) => void;
  /** stops and returns what ran (without saving) */
  take: () => { patientId: string; startedAt: number; ms: number } | null;
}

/** One running billable timer per nurse session (not persisted). */
export const useTimerStore = create<TimerState>()((set, get) => ({
  patientId: null,
  startedAt: null,
  start: (patientId) => set({ patientId, startedAt: Date.now() }),
  take: () => {
    const { patientId, startedAt } = get();
    set({ patientId: null, startedAt: null });
    return patientId && startedAt ? { patientId, startedAt, ms: Date.now() - startedAt } : null;
  },
}));

/** Ignore sub-2-second runs (StrictMode remounts, quick clicks). */
const MIN_SAVE_MS = 2000;

/**
 * Auto-starts the timer while a patient's alert or chart is open.
 * Leaving (or switching patient) saves the run as a TimeEntry.
 */
export function useCareTimer(patientId: string | null, enabled: boolean) {
  const addTime = useAddTimeEntry();
  const running = useTimerStore((s) => (s.patientId === patientId ? s.startedAt : null));
  const [now, setNow] = useState(() => Date.now());
  const save = addTime.mutate;

  useEffect(() => {
    if (!enabled || !patientId) return;
    useTimerStore.getState().start(patientId);
    return () => {
      const run = useTimerStore.getState().patientId === patientId ? useTimerStore.getState().take() : null;
      if (run && run.ms >= MIN_SAVE_MS) {
        save({ patientId: run.patientId, minutes: timerMinutes(run.ms), activity: 'review', source: 'timer', start: new Date(run.startedAt).toISOString() });
      }
    };
  }, [patientId, enabled, save]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  return {
    running: running !== null,
    elapsedMs: running ? Math.max(0, now - running) : 0,
    startedAt: running,
    /** Stop and save as a TimeEntry. */
    stop: async (activity: 'review' | 'call' | 'care_coordination' = 'review') => {
      const run = useTimerStore.getState().take();
      if (!run) return null;
      const minutes = timerMinutes(run.ms);
      await addTime.mutateAsync({ patientId: run.patientId, minutes, activity, source: 'timer', start: new Date(run.startedAt).toISOString() });
      return minutes;
    },
    /** Stop and hand back the minutes (caller saves them, e.g. Save and close alert). */
    take: () => {
      const run = useTimerStore.getState().take();
      return run ? { minutes: timerMinutes(run.ms), startedAt: new Date(run.startedAt).toISOString() } : null;
    },
    restart: () => patientId && useTimerStore.getState().start(patientId),
    isSaving: addTime.isPending,
  };
}
