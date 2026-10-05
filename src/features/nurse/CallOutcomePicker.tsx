import { focusRing } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Field';
import type { CallLog } from '@/data/types';
import { cn } from '@/lib/cn';

export const OUTCOMES: { value: CallLog['outcome']; label: string }[] = [
  { value: 'reached', label: 'Reached' },
  { value: 'voicemail', label: 'Left voicemail' },
  { value: 'no_answer', label: 'No answer' },
];

export function CallOutcomePicker({ outcome, onOutcome, live, onLive }: {
  outcome: CallLog['outcome'] | null; onOutcome: (o: CallLog['outcome'] | null) => void;
  live: boolean; onLive: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span id="outcome-label" className="text-[13px] font-semibold">Call outcome</span>
      <div role="group" aria-labelledby="outcome-label" className="flex flex-wrap gap-2">
        {OUTCOMES.map((o) => {
          const active = outcome === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              onClick={() => onOutcome(active ? null : o.value)}
              className={cn(
                'h-9 rounded-full border px-3.5 text-[13px] transition-colors', focusRing,
                active ? 'border-accent bg-accent/8 font-semibold text-accent' : 'border-border-strong bg-surface font-medium text-ink hover:bg-subtle',
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <Checkbox
        label="Live conversation (counts for billing)"
        checked={live && outcome === 'reached'}
        disabled={outcome !== 'reached'}
        onChange={(e) => onLive(e.target.checked)}
      />
    </div>
  );
}
