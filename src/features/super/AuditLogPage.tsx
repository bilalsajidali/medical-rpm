import type { ColumnDef } from '@tanstack/react-table';
import { format, startOfDay, subDays } from 'date-fns';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { PillSelect } from '@/components/ui/Select';
import { EmptyState, QueryState } from '@/components/ui/States';
import { AUDIT_ACTION_LABEL, type AuditFilters, type AuditRow } from '@/data/api/audit';
import { useAudit, useClinics } from '@/data/queries/admin';
import type { AuditEvent } from '@/data/types';
import { usePageTitle } from '@/lib/usePageTitle';

const columns: ColumnDef<AuditRow>[] = [
  { id: 'when', header: 'When', accessorFn: (r) => r.event.at, cell: ({ row }) => <span className="font-medium whitespace-nowrap">{format(new Date(row.original.event.at), 'MMM d, yyyy · h:mm a')}</span> },
  { id: 'who', header: 'Who', enableSorting: false, cell: ({ row }) => <span className="font-semibold">{row.original.actor}</span> },
  { id: 'action', header: 'Action', enableSorting: false, cell: ({ row }) => <Badge variant="tag" className="font-semibold">{AUDIT_ACTION_LABEL[row.original.event.action]}</Badge> },
  { id: 'what', header: 'Details', enableSorting: false, cell: ({ row }) => row.original.event.summary },
  { id: 'clinic', header: 'Clinic', enableSorting: false, cell: ({ row }) => <span className="text-ink-muted">{row.original.clinic}</span> },
];

type DateRange = 'all' | 'today' | '7' | '30';

export default function AuditLogPage() {
  usePageTitle('Audit log');
  const clinics = useClinics();
  const [clinicId, setClinicId] = useState('all');
  const [action, setAction] = useState<'all' | AuditEvent['action']>('all');
  const [range, setRange] = useState<DateRange>('all');
  const filters = useMemo<AuditFilters>(() => ({
    clinicId: clinicId === 'all' ? undefined : clinicId,
    action: action === 'all' ? undefined : action,
    from: range === 'all' ? undefined : (range === 'today' ? startOfDay(new Date()) : subDays(new Date(), Number(range))).toISOString(),
  }), [clinicId, action, range]);
  const audit = useAudit(filters);

  return (
    <>
      <PageHeader title="Audit log" subtitle="Every chart view and every change, newest first" />
      <Card padding="md" className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <PillSelect label="Clinic" value={clinicId} onChange={setClinicId}
            options={[{ value: 'all', label: 'All' }, ...(clinics.data ?? []).map((c) => ({ value: c.clinic.id, label: c.clinic.name }))]} />
          <PillSelect label="Action" value={action} onChange={setAction}
            options={[{ value: 'all', label: 'All' }, ...Object.entries(AUDIT_ACTION_LABEL).map(([value, label]) => ({ value: value as AuditEvent['action'], label }))]} />
          <PillSelect label="Date" value={range} onChange={setRange}
            options={[{ value: 'all', label: 'All time' }, { value: 'today', label: 'Today' }, { value: '7', label: 'Last 7 days' }, { value: '30', label: 'Last 30 days' }]} />
        </div>
        <QueryState query={audit} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No events match" body="Try a different clinic, action or date." />}>
          {(data) => <DataTable data={data} columns={columns} getRowId={(r) => r.event.id} minWidth={860} pageSize={20} noun="events" initialSorting={[{ id: 'when', desc: true }]} />}
        </QueryState>
      </Card>
    </>
  );
}
