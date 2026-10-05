import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatClock } from '@/lib/format';

/** "Time this month" counter: saved minutes plus the running timer. */
export function TimerBox({ savedMinutes, elapsedMs, running, onStop, onStart, saving }: {
  savedMinutes: number; elapsedMs: number; running: boolean;
  onStop: () => void; onStart: () => void; saving?: boolean;
}) {
  const total = savedMinutes * 60 + Math.floor(elapsedMs / 1000);
  return (
    <div className="flex items-center justify-between gap-3 rounded-inner bg-bg px-3.5 py-3">
      <div className="flex items-center gap-2.5">
        <Clock size={20} strokeWidth={1.8} aria-hidden="true" className="text-ink-muted" />
        <div className="flex flex-col">
          <span className="text-xs text-ink-muted">Time this month{running ? ' · timer running' : ''}</span>
          <span className="font-display text-xl font-semibold tabular" aria-live="off">{formatClock(total)}</span>
        </div>
      </div>
      {running
        ? <Button size="sm" className="h-10" onClick={onStop} loading={saving}>Stop timer</Button>
        : <Button size="sm" variant="secondary" className="h-10" onClick={onStart}>Start timer</Button>}
    </div>
  );
}
