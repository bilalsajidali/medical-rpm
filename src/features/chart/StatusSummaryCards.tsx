import { focusRing } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/States';
import { STATUS_STYLE, statusLabel } from '@/components/ui/StatusPill';
import type { PatientSummary } from '@/data/api/patients';
import { cn } from '@/lib/cn';
import type { PatientStatus } from '@/lib/rules/status';

const CARDS: { status: PatientStatus; note: string }[] = [
  { status: 'critical', note: 'Reading outside critical range' },
  { status: 'atrisk', note: 'Reading outside at-risk range' },
  { status: 'normal', note: 'All readings in range' },
  { status: 'missed', note: 'No reading for 2+ days' },
];

/** Critical / At-Risk / Normal / Missed counts that double as filters. */
export function StatusSummaryCards({ rows, loading, active, onSelect }: {
  rows: PatientSummary[]; loading: boolean; active: PatientStatus | 'all'; onSelect: (s: PatientStatus) => void;
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-4">
      {CARDS.map(({ status, note }) => {
        const s = STATUS_STYLE[status];
        const count = rows.filter((r) => r.status === status).length;
        return (
          <button
            key={status}
            type="button"
            aria-pressed={active === status}
            onClick={() => onSelect(status)}
            className={cn(
              'flex items-center justify-between gap-3 rounded-card border bg-surface px-5 py-[18px] text-left text-ink transition-colors hover:bg-subtle', focusRing,
              active === status ? 'border-ink' : s.border,
            )}
          >
            <span className="flex flex-col gap-1.5">
              <span className={cn('inline-flex items-center gap-2 text-sm font-semibold', s.ink)}>
                <span aria-hidden="true" className={cn('size-2 rounded-full', s.dot)} />{statusLabel(status, 'staff')}
              </span>
              <span className="text-[13px] text-ink-muted">{note}</span>
            </span>
            {loading
              ? <Skeleton className="h-10 w-12" />
              : <span className="font-display text-4xl leading-10 font-medium tabular">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
