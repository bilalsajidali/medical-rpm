import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Link } from 'react-router';
import { Badge } from '@/components/ui/Badge';
import { focusRing } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { KpiCard } from '@/components/ui/KpiCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, QueryState } from '@/components/ui/States';
import type { TimeRow } from '@/data/api/time';
import { useTimeEntries } from '@/data/queries/care';
import { cn } from '@/lib/cn';
import { ACTIVITY_LABEL, formatWhen, patientName } from '@/lib/format';
import { usePageTitle } from '@/lib/usePageTitle';

const columns: ColumnDef<TimeRow>[] = [
  { id: 'when', header: 'Started', accessorFn: (r) => r.entry.start, cell: ({ row }) => <span className="font-medium whitespace-nowrap">{formatWhen(row.original.entry.start)}</span> },
  {
    id: 'patient', header: 'Patient', accessorFn: (r) => r.patient.lastName,
    cell: ({ row: { original: r } }) => <Link to={`/nurse/patients/${r.patient.id}`} className={cn('rounded font-semibold text-ink no-underline hover:underline', focusRing)}>{patientName(r.patient)}</Link>,
  },
  { id: 'activity', header: 'Activity', enableSorting: false, cell: ({ row }) => ACTIVITY_LABEL[row.original.entry.activity] },
  { id: 'source', header: 'Source', enableSorting: false, cell: ({ row }) => <Badge variant={row.original.entry.source === 'timer' ? 'accent' : 'neutral'}>{row.original.entry.source === 'timer' ? 'Timer' : 'Manual'}</Badge> },
  { id: 'minutes', header: 'Minutes', accessorFn: (r) => r.entry.minutes, meta: { align: 'right' }, cell: ({ row }) => <span className="font-semibold">{row.original.entry.minutes} min</span> },
];

export default function TimeTrackerPage() {
  usePageTitle('Time tracker');
  const time = useTimeEntries({ mine: true });
  const rows = time.data ?? [];
  const total = rows.reduce((n, r) => n + r.entry.minutes, 0);
  const patients = new Set(rows.map((r) => r.patient.id)).size;
  const today = rows.filter((r) => new Date(r.entry.start).toDateString() === new Date().toDateString()).reduce((n, r) => n + r.entry.minutes, 0);

  return (
    <>
      <PageHeader title="Time tracker" subtitle={`My billable time · ${format(new Date(), 'MMMM yyyy')}. The timer starts when you open an alert or a chart.`} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <KpiCard size="md" label="Minutes this month" value={time.isPending ? '…' : total} />
        <KpiCard size="md" label="Minutes today" value={time.isPending ? '…' : today} />
        <KpiCard size="md" label="Patients" value={time.isPending ? '…' : patients} sub="with time this month" />
      </div>
      <Card padding="md" className="flex flex-col gap-4">
        <QueryState query={time} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No time logged this month" body="Open an alert or a chart and the timer starts on its own." />}>
          {(data) => <DataTable data={data} columns={columns} getRowId={(r) => r.entry.id} minWidth={680} pageSize={15} noun="entries" initialSorting={[{ id: 'when', desc: true }]} />}
        </QueryState>
      </Card>
    </>
  );
}
