import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { Link } from 'react-router';
import { Badge } from '@/components/ui/Badge';
import { buttonClasses } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { EmptyState, QueryState } from '@/components/ui/States';
import { StatusPill } from '@/components/ui/StatusPill';
import type { EscalationRow } from '@/data/api/escalations';
import { useEscalations } from '@/data/queries/care';
import type { Escalation } from '@/data/types';
import { ageOf, displayName, flaggedSummary, formatWait, formatWhen, patientName } from '@/lib/format';
import { usePageTitle } from '@/lib/usePageTitle';
import { useNow } from '@/lib/useNow';

function useColumns(now: Date): ColumnDef<EscalationRow>[] {
  return [
    {
      id: 'patient', header: 'Patient', accessorFn: (r) => r.patient.lastName,
      cell: ({ row: { original: r } }) => (
        <div className="flex flex-col"><span className="font-semibold">{patientName(r.patient)}</span><span className="text-xs text-ink-muted">{r.patient.sex}, {ageOf(r.patient.dob)} · MRN {r.patient.mrn}</span></div>
      ),
    },
    {
      id: 'reading', header: 'Reading', enableSorting: false,
      cell: ({ row: { original: r } }) => r.reading ? <div className="flex flex-col items-start gap-1"><span className="font-medium">{flaggedSummary(r.reading)}</span><StatusPill status={r.reading.status} /></div> : '—',
    },
    { id: 'reason', header: 'Reason', enableSorting: false, meta: { className: 'max-w-[320px]' }, cell: ({ row }) => <span className="line-clamp-2">{row.original.escalation.reason}</span> },
    { id: 'from', header: 'From', enableSorting: false, cell: ({ row }) => <span className="text-ink-muted whitespace-nowrap">{row.original.from ? displayName(row.original.from) : '—'}</span> },
    {
      id: 'waiting', header: 'Waiting', accessorFn: (r) => r.escalation.at,
      cell: ({ row: { original: r } }) => r.escalation.state === 'pending'
        ? <span className="font-semibold whitespace-nowrap">{formatWait(r.escalation.at, now)}</span>
        : <span className="text-ink-muted whitespace-nowrap">Reviewed {r.escalation.reviewedAt ? formatWhen(r.escalation.reviewedAt) : ''}</span>,
    },
    { id: 'state', header: 'State', enableSorting: false, cell: ({ row }) => <Badge variant={row.original.escalation.state === 'pending' ? 'accent' : 'success'}>{row.original.escalation.state === 'pending' ? 'Pending' : 'Reviewed'}</Badge> },
    {
      id: 'action', header: 'Action', enableSorting: false, meta: { align: 'right' },
      cell: ({ row }) => <Link to={`/doctor/patients/${row.original.patient.id}`} className={buttonClasses('secondary', 'sm')}>{row.original.escalation.state === 'pending' ? 'Review' : 'Open chart'}</Link>,
    },
  ];
}

export default function EscalationsPage() {
  usePageTitle('Escalations');
  const [state, setState] = useState<Escalation['state']>('pending');
  const escalations = useEscalations(state);
  const columns = useColumns(useNow(30_000));
  return (
    <>
      <PageHeader size="display" title="Escalations" subtitle="Readings your nurses escalated for a doctor’s review" />
      <Card padding="md" className="flex flex-col gap-4">
        <SegmentedTabs aria-label="State" value={state} onChange={setState} options={[{ value: 'pending', label: 'Pending' }, { value: 'reviewed', label: 'Reviewed' }]} />
        <QueryState query={escalations} isEmpty={(d) => d.length === 0}
          empty={<EmptyState title={state === 'pending' ? 'No pending escalations' : 'No reviewed escalations yet'} body={state === 'pending' ? 'You are all caught up.' : undefined} />}>
          {(data) => <DataTable data={data} columns={columns} getRowId={(r) => r.escalation.id} minWidth={980} pageSize={10} noun="escalations" resetKey={state} />}
        </QueryState>
      </Card>
    </>
  );
}
