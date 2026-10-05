import type { ColumnDef } from '@tanstack/react-table';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/States';
import { StatusPill } from '@/components/ui/StatusPill';
import type { QueueRow } from '@/data/api/alerts';
import { useOpenAlert, useQueue } from '@/data/queries/care';
import { cn } from '@/lib/cn';
import { ageOf, flaggedSummary, formatTime, formatWait, patientName, shortName } from '@/lib/format';
import { usePageTitle } from '@/lib/usePageTitle';
import { useNow } from '@/lib/useNow';
import { AlertPanel } from './AlertPanel';

type Filter = 'all' | 'critical' | 'atrisk';
const actionable = (r: QueueRow) => r.alert.state === 'open' || r.alert.state === 'in_progress';

function useColumns(now: Date): ColumnDef<QueueRow>[] {
  return useMemo(() => [
    { id: 'status', header: 'Status', enableSorting: false, cell: ({ row }) => <StatusPill status={row.original.alert.status} /> },
    {
      id: 'patient', header: 'Patient', enableSorting: false,
      cell: ({ row: { original: r } }) => (
        <div className="flex flex-col"><span className="font-semibold">{patientName(r.patient)}</span><span className="text-xs text-ink-muted">{r.patient.sex}, {ageOf(r.patient.dob)}</span></div>
      ),
    },
    { id: 'reading', header: 'Reading', enableSorting: false, cell: ({ row }) => <span className="font-medium">{flaggedSummary(row.original.reading)}</span> },
    { id: 'received', header: 'Received', enableSorting: false, cell: ({ row }) => <span className="text-ink-muted">{formatTime(row.original.alert.createdAt)}</span> },
    {
      id: 'waiting', header: 'Waiting', enableSorting: false,
      cell: ({ row: { original: r } }) => (
        <span className={cn('font-semibold whitespace-nowrap', r.alert.status === 'critical' && actionable(r) ? 'text-critical-ink' : 'text-ink-muted')}>
          {actionable(r) ? formatWait(r.alert.createdAt, now) : '—'}
        </span>
      ),
    },
    {
      id: 'assigned', header: 'Assigned', enableSorting: false,
      cell: ({ row: { original: r } }) => r.alert.state === 'escalated'
        ? <Badge variant="accent">Escalated</Badge>
        : <span className="text-ink-muted">{r.assignedTo ? shortName(r.assignedTo) : 'Unassigned'}</span>,
    },
  ], [now]);
}

export default function AlertQueuePage() {
  usePageTitle('Alert queue');
  const queue = useQueue();
  const open = useOpenAlert();
  const now = useNow(10_000);
  const columns = useColumns(now);
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => queue.data ?? [], [queue.data]);
  const visible = rows.filter((r) => {
    if (filter !== 'all' && (r.alert.status !== filter || !actionable(r))) return false;
    const term = q.trim().toLowerCase();
    return !term || patientName(r.patient).toLowerCase().includes(term) || r.patient.mrn.includes(term);
  });
  const selected = rows.find((r) => r.alert.id === selectedId) ?? null;
  const act = rows.filter(actionable);

  // Close the panel when the selected alert leaves the queue (closed elsewhere).
  useEffect(() => {
    if (selectedId && queue.data && !queue.data.some((r) => r.alert.id === selectedId)) setSelectedId(null);
  }, [queue.data, selectedId]);

  const select = (r: QueueRow) => {
    setSelectedId(r.alert.id);
    if (actionable(r)) open.mutate(r.alert.id);
    if (window.innerWidth < 1024) setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  return (
    <>
      <PageHeader
        title="Alert queue"
        subtitle="Oldest critical first · Updates live"
        actions={<>
          <SegmentedTabs aria-label="Filter alerts" onSurface value={filter} onChange={setFilter} options={[
            { value: 'all', label: 'All', count: rows.length },
            { value: 'critical', label: 'Critical', count: act.filter((r) => r.alert.status === 'critical').length },
            { value: 'atrisk', label: 'At-Risk', count: act.filter((r) => r.alert.status === 'atrisk').length },
          ]} />
          <SearchInput value={q} onChange={setQ} placeholder="Search queue" tone="plain" className="w-full sm:w-auto" inputClassName="sm:w-[150px]" />
        </>}
      />
      <div className="flex flex-wrap items-start gap-4">
        <Card padding="none" className="min-w-0 flex-[2_1_520px] px-2 pt-2 pb-3">
          {queue.isPending ? <SkeletonRows rows={8} className="p-3" />
            : queue.isError ? <ErrorState error={queue.error} onRetry={() => void queue.refetch()} />
            : (
              <DataTable
                data={visible} columns={columns} getRowId={(r) => r.alert.id} minWidth={600}
                onRowClick={select} selectedId={selectedId}
                rowLabel={(r) => `Open alert for ${patientName(r.patient)}, ${flaggedSummary(r.reading)}`}
                rowClassName={(r) => (actionable(r) ? undefined : 'opacity-70')}
                empty={<EmptyState title={rows.length ? 'No alerts match' : 'Queue is clear'} body={rows.length ? 'Try another filter or search.' : 'New out-of-range readings will appear here automatically.'} />}
              />
            )}
        </Card>
        <div ref={panelRef} className="min-w-0 flex-[1_1_320px] scroll-mt-4">
          {selected ? (
            <AlertPanel key={selected.alert.id} row={selected} onDone={() => setSelectedId(null)} />
          ) : (
            <Card padding="lg"><EmptyState title="Select an alert" body="Click a row to call the patient, log the outcome and save a note. The timer starts when you open an alert." /></Card>
          )}
        </div>
      </div>
    </>
  );
}
