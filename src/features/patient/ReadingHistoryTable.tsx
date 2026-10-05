import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import type { Reading } from '@/data/types';
import { formatDay, formatTime } from '@/lib/format';
import { readingDirection } from './vitals';

const columns: ColumnDef<Reading>[] = [
  { id: 'date', header: 'Date', accessorFn: (r) => r.takenAt, cell: ({ row }) => <span className="font-medium">{formatDay(row.original.takenAt)}</span> },
  { id: 'time', header: 'Time', enableSorting: false, cell: ({ row }) => <span className="text-ink-muted">{formatTime(row.original.takenAt)}</span> },
  { id: 'bp', header: 'Blood pressure', enableSorting: false, cell: ({ row }) => (row.original.systolic !== undefined ? `${row.original.systolic}/${row.original.diastolic}` : '—') },
  { id: 'pulse', header: 'Pulse', enableSorting: false, cell: ({ row }) => (row.original.pulse !== undefined ? `${row.original.pulse} bpm` : '—') },
  { id: 'spo2', header: 'Oxygen', enableSorting: false, cell: ({ row }) => (row.original.spo2 !== undefined ? `${row.original.spo2}%` : '—') },
  { id: 'sugar', header: 'Sugar', enableSorting: false, cell: ({ row }) => (row.original.glucose !== undefined ? `${row.original.glucose} mg/dL` : '—') },
  {
    id: 'result', header: 'Result', enableSorting: false,
    cell: ({ row }) => <StatusPill status={row.original.status} audience="patient" direction={readingDirection(row.original)} size="md" className="px-3 py-1 text-sm" />,
  },
];

/** Patient reading history (patient wording, 16px). Pass readings newest first. */
export function ReadingHistoryTable({ readings, pageSize }: { readings: Reading[]; pageSize?: number }) {
  return (
    <DataTable
      data={readings} columns={columns} getRowId={(r) => r.id} density="patient" minWidth={760}
      pageSize={pageSize} noun="readings"
      initialSorting={[{ id: 'date', desc: true }]}
    />
  );
}
