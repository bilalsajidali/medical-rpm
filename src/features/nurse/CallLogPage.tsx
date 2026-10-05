import type { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Badge } from '@/components/ui/Badge';
import { focusRing } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { EmptyState, QueryState } from '@/components/ui/States';
import type { CallRow } from '@/data/api/calls';
import { useCalls } from '@/data/queries/care';
import { cn } from '@/lib/cn';
import { formatWhen, nameWithCredential, patientName } from '@/lib/format';
import { usePageTitle } from '@/lib/usePageTitle';
import { OUTCOMES } from './CallOutcomePicker';

const OUTCOME_LABEL = Object.fromEntries(OUTCOMES.map((o) => [o.value, o.label])) as Record<CallRow['call']['outcome'], string>;

const columns: ColumnDef<CallRow>[] = [
  { id: 'when', header: 'When', accessorFn: (r) => r.call.at, cell: ({ row }) => <span className="font-medium whitespace-nowrap">{formatWhen(row.original.call.at)}</span> },
  {
    id: 'patient', header: 'Patient', accessorFn: (r) => r.patient.lastName,
    cell: ({ row: { original: r } }) => (
      <div className="flex flex-col">
        <Link to={`/nurse/patients/${r.patient.id}`} className={cn('rounded font-semibold text-ink no-underline hover:underline', focusRing)}>{patientName(r.patient)}</Link>
        <span className="text-xs text-ink-muted tabular">{r.patient.phone}</span>
      </div>
    ),
  },
  { id: 'outcome', header: 'Outcome', enableSorting: false, cell: ({ row }) => <Badge variant={row.original.call.outcome === 'reached' ? 'success' : 'neutral'}>{OUTCOME_LABEL[row.original.call.outcome]}</Badge> },
  { id: 'live', header: 'Live conversation', enableSorting: false, cell: ({ row }) => <span className={row.original.call.liveConversation ? 'font-medium text-normal-ink' : 'text-ink-muted'}>{row.original.call.liveConversation ? 'Yes' : 'No'}</span> },
  { id: 'minutes', header: 'Minutes', accessorFn: (r) => r.call.minutes, cell: ({ row }) => `${row.original.call.minutes} min` },
  { id: 'staff', header: 'By', enableSorting: false, cell: ({ row }) => <span className="text-ink-muted">{row.original.staff ? nameWithCredential(row.original.staff) : '—'}</span> },
];

export default function CallLogPage() {
  usePageTitle('Call log');
  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const calls = useCalls(scope === 'mine');
  const [q, setQ] = useState('');
  const filter = useMemo(() => (rows: CallRow[]) => {
    const t = q.trim().toLowerCase();
    return t ? rows.filter((r) => patientName(r.patient).toLowerCase().includes(t)) : rows;
  }, [q]);

  return (
    <>
      <PageHeader title="Call log" subtitle="Every call to a patient, newest first" />
      <Card padding="md" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedTabs aria-label="Whose calls" value={scope} onChange={setScope} options={[{ value: 'mine', label: 'My calls' }, { value: 'all', label: 'Whole clinic' }]} />
          <SearchInput value={q} onChange={setQ} placeholder="Search by patient" className="w-full sm:w-auto" inputClassName="sm:w-[180px]" />
        </div>
        <QueryState query={calls} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No calls yet" body="Calls you log from the alert queue or missed readings show here." />}>
          {(data) => (
            <DataTable data={filter(data)} columns={columns} getRowId={(r) => r.call.id} minWidth={820} pageSize={15} noun="calls"
              resetKey={`${scope}-${q}`} initialSorting={[{ id: 'when', desc: true }]} />
          )}
        </QueryState>
      </Card>
    </>
  );
}
