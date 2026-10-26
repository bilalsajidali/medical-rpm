import { useMemo } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { focusRing } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState, QueryState } from '@/components/ui/States';
import { StatusPill } from '@/components/ui/StatusPill';
import type { PatientSummary } from '@/data/api/patients';
import { usePatients } from '@/data/queries/patients';
import { cn } from '@/lib/cn';
import { patientName } from '@/lib/format';

const pctOf = (s: PatientSummary) => (s.month.daysSoFar ? (s.month.readingDays / s.month.daysSoFar) * 100 : 0);

/** Per-patient reading adherence this month, lowest first. Clicking a patient opens their chart. */
export function AdherenceDialog({ open, onOpenChange, adherence, onOpenChart }: {
  open: boolean; onOpenChange: (open: boolean) => void; adherence: number; onOpenChart: (patientId: string) => void;
}) {
  const patients = usePatients();
  const rows = useMemo(
    () => (patients.data ?? []).filter((s) => s.patient.rpmStatus === 'active').sort((a, b) => pctOf(a) - pctOf(b)),
    [patients.data],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Reading adherence" size="lg"
      description="Days with at least one reading this month, lowest first.">
      <div className="flex flex-col gap-4 pb-4">
        <div className="flex flex-col gap-2 rounded-inner bg-subtle p-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium text-ink-muted">All active patients</span>
            <span className="font-display text-[32px] leading-10 font-medium tabular">{adherence}%</span>
          </div>
          <ProgressBar value={adherence} label="Overall reading adherence" />
        </div>
        <QueryState query={patients} isEmpty={() => rows.length === 0} empty={<EmptyState title="No active patients" body="Patients assigned to you will show here." />}>
          {() => (
            <ul className="m-0 flex list-none flex-col p-0">
              {rows.map((s) => {
                const pct = Math.round(pctOf(s));
                return (
                  <li key={s.patient.id} className="border-b border-divider last:border-b-0">
                    <button
                      type="button"
                      onClick={() => onOpenChart(s.patient.id)}
                      aria-label={`Open chart for ${patientName(s.patient)}, ${pct}% adherence`}
                      className={cn('flex w-full items-center gap-3 rounded-inner px-2 py-3 text-left text-ink hover:bg-subtle', focusRing)}
                    >
                      <Avatar firstName={s.patient.firstName} lastName={s.patient.lastName} />
                      <span className="flex min-w-0 grow flex-col">
                        <span className="truncate font-semibold">{patientName(s.patient)}</span>
                        <span className="text-xs text-ink-muted tabular">{s.month.readingDays} / {s.month.daysSoFar} days</span>
                      </span>
                      <span className="hidden w-[140px] shrink-0 items-center gap-2 sm:flex">
                        <ProgressBar height={6} value={pct} label={`Adherence for ${patientName(s.patient)}`} />
                        <span className="w-10 text-right text-[13px] font-medium tabular">{pct}%</span>
                      </span>
                      <StatusPill status={s.status} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </QueryState>
      </div>
    </Dialog>
  );
}
