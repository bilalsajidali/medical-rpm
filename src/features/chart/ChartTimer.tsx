import { toast } from '@/components/ui/Toaster';
import { useMonthMinutes } from '@/data/queries/care';
import { TimerBox } from '@/features/nurse/TimerBox';
import { useCareTimer } from '@/features/nurse/careTimer';

/** Nurse chart: the billable timer auto-starts on open and saves when stopped or when leaving. */
export function ChartTimer({ patientId }: { patientId: string }) {
  const timer = useCareTimer(patientId, true);
  const minutes = useMonthMinutes(patientId);
  return (
    <div className="max-w-md">
      <TimerBox
        savedMinutes={minutes.data ?? 0} elapsedMs={timer.elapsedMs} running={timer.running} saving={timer.isSaving}
        onStop={() => void timer.stop('review').then((m) => m && toast(`${m} min saved to the time log.`))}
        onStart={() => timer.restart()}
      />
    </div>
  );
}
