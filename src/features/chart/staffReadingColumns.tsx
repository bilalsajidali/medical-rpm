import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { StatusPill } from '@/components/ui/StatusPill';
import type { Reading } from '@/data/types';

export const staffReadingColumns: ColumnDef<Reading>[] = [
  { id: 'when', header: 'Date & time', accessorFn: (r) => r.takenAt, cell: ({ row }) => <span className="font-medium whitespace-nowrap">{format(new Date(row.original.takenAt), 'MMM d · h:mm a')}</span> },
  { id: 'bp', header: 'BP', accessorFn: (r) => r.systolic ?? -1, cell: ({ row }) => (row.original.systolic !== undefined ? `${row.original.systolic}/${row.original.diastolic}` : '—') },
  { id: 'pulse', header: 'Pulse', accessorFn: (r) => r.pulse ?? -1, cell: ({ row }) => row.original.pulse ?? '—' },
  { id: 'spo2', header: 'SpO2', accessorFn: (r) => r.spo2 ?? -1, cell: ({ row }) => (row.original.spo2 !== undefined ? `${row.original.spo2}%` : '—') },
  { id: 'glucose', header: 'Glucose', accessorFn: (r) => r.glucose ?? -1, cell: ({ row }) => row.original.glucose ?? '—' },
  { id: 'source', header: 'Source', enableSorting: false, cell: ({ row }) => <span className="text-ink-muted">{row.original.source === 'device' ? 'Device' : 'Manual'}</span> },
  { id: 'status', header: 'Status', enableSorting: false, cell: ({ row }) => <StatusPill status={row.original.status} /> },
];
