import type { ColumnDef } from '@tanstack/react-table';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusPill } from '@/components/ui/StatusPill';
import type { PatientSummary } from '@/data/api/patients';
import { ageOf, formatWhen, patientName, readingSummary } from '@/lib/format';

function MonthCounts({ s }: { s: PatientSummary }) {
  const chip = 'min-w-7 rounded-lg px-1.5 py-[3px] text-center';
  return (
    <div className="flex gap-1.5 text-xs font-semibold" aria-label={`${s.month.critical} critical, ${s.month.atrisk} at-risk, ${s.month.normal} normal`}>
      <span className={`${chip} bg-critical-bg text-critical-ink`}>{s.month.critical}</span>
      <span className={`${chip} bg-atrisk-bg text-atrisk-ink`}>{s.month.atrisk}</span>
      <span className={`${chip} bg-normal-bg text-normal-ink`}>{s.month.normal}</span>
    </div>
  );
}

export function patientColumns(): ColumnDef<PatientSummary>[] {
  return [
    {
      id: 'patient', header: 'Patient', enableSorting: false,
      cell: ({ row: { original: s } }) => (
        <div className="flex items-center gap-2.5">
          <Avatar firstName={s.patient.firstName} lastName={s.patient.lastName} />
          <div className="flex flex-col">
            <span className="font-semibold">{patientName(s.patient)}</span>
            <span className="text-xs text-ink-muted">{s.patient.sex}, {ageOf(s.patient.dob)} · MRN {s.patient.mrn}</span>
          </div>
        </div>
      ),
    },
    { id: 'condition', header: 'Condition', enableSorting: false, cell: ({ row }) => <span className="text-ink-muted">{row.original.patient.conditions[0] ?? '—'}</span> },
    {
      id: 'last', header: 'Last reading', enableSorting: false,
      cell: ({ row: { original: s } }) => s.latest ? (
        <div className="flex flex-col">
          <span className="font-medium">{readingSummary(s.latest)}</span>
          <span className="text-xs text-ink-muted">{s.missed && s.daysSinceLast !== null ? `${s.daysSinceLast} days ago` : formatWhen(s.latest.takenAt)}</span>
        </div>
      ) : <span className="text-ink-muted">No readings yet</span>,
    },
    { id: 'status', header: 'Status', enableSorting: false, cell: ({ row }) => <StatusPill status={row.original.status} /> },
    { id: 'month', header: 'This month (C / R / N)', enableSorting: false, cell: ({ row }) => <MonthCounts s={row.original} /> },
    {
      id: 'days', header: 'Reading days', enableSorting: false,
      cell: ({ row: { original: s } }) => (
        <div className="flex w-[110px] flex-col gap-1.5">
          <span className="text-[13px] font-medium">{s.month.readingDays} / {s.month.daysSoFar}</span>
          <ProgressBar height={6} value={(s.month.readingDays / s.month.daysSoFar) * 100} label={`Reading days for ${patientName(s.patient)}`} />
        </div>
      ),
    },
    { id: 'time', header: 'Staff time', enableSorting: false, cell: ({ row }) => `${row.original.month.minutes} min` },
    {
      id: 'billing', header: 'Billing', enableSorting: false,
      cell: ({ row }) => row.original.month.billing.result === 'ready' ? <Badge variant="accent">Ready</Badge> : <Badge variant="neutral">Not yet</Badge>,
    },
  ];
}
