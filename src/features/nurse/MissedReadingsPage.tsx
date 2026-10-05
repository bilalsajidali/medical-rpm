import type { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Avatar } from '@/components/ui/Avatar';
import { Button, focusRing } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, QueryState } from '@/components/ui/States';
import { StatusPill } from '@/components/ui/StatusPill';
import type { PatientSummary } from '@/data/api/patients';
import { usePatients } from '@/data/queries/patients';
import type { Patient } from '@/data/types';
import { cn } from '@/lib/cn';
import { ageOf, formatWhen, patientName, shortName } from '@/lib/format';
import { usePageTitle } from '@/lib/usePageTitle';
import { LogCallDialog } from './LogCallDialog';

function lastReadingText(s: PatientSummary): string {
  if (s.daysSinceLast === null) return 'No readings yet';
  if (s.daysSinceLast === 0) return 'Last reading today';
  return `Last reading ${s.daysSinceLast} day${s.daysSinceLast === 1 ? '' : 's'} ago`;
}

export default function MissedReadingsPage() {
  usePageTitle('Missed readings');
  const patients = usePatients();
  const [calling, setCalling] = useState<Patient | null>(null);

  const columns = useMemo<ColumnDef<PatientSummary>[]>(() => [
    {
      id: 'patient', header: 'Patient', accessorFn: (s) => s.patient.lastName,
      cell: ({ row: { original: s } }) => (
        <div className="flex items-center gap-2.5">
          <Avatar firstName={s.patient.firstName} lastName={s.patient.lastName} />
          <div className="flex flex-col">
            <Link to={`/nurse/patients/${s.patient.id}`} className={cn('rounded font-semibold text-ink no-underline hover:underline', focusRing)}>{patientName(s.patient)}</Link>
            <span className="text-xs text-ink-muted">{s.patient.sex}, {ageOf(s.patient.dob)} · MRN {s.patient.mrn}</span>
          </div>
        </div>
      ),
    },
    { id: 'condition', header: 'Condition', enableSorting: false, cell: ({ row }) => <span className="text-ink-muted">{row.original.patient.conditions[0]}</span> },
    {
      id: 'last', header: 'Last reading', accessorFn: (s) => s.daysSinceLast ?? 999,
      cell: ({ row: { original: s } }) => (
        <div className="flex flex-col gap-1">
          <StatusPill status="missed" label={lastReadingText(s)} />
          {s.latest && <span className="text-xs text-ink-muted">{formatWhen(s.latest.takenAt)}</span>}
        </div>
      ),
    },
    { id: 'phone', header: 'Phone', enableSorting: false, cell: ({ row }) => <span className="tabular">{row.original.patient.phone}</span> },
    { id: 'nurse', header: 'Nurse', enableSorting: false, cell: ({ row }) => <span className="text-ink-muted">{row.original.nurse ? shortName(row.original.nurse) : '—'}</span> },
    {
      id: 'action', header: 'Action', enableSorting: false, meta: { align: 'right' },
      cell: ({ row }) => <Button variant="secondary" size="sm" onClick={() => setCalling(row.original.patient)}>Call</Button>,
    },
  ], []);

  return (
    <>
      <PageHeader title="Missed readings" subtitle="Active patients with no reading for more than 2 days" />
      <Card padding="md" className="flex flex-col gap-4">
        <QueryState
          query={patients}
          isEmpty={(d) => !d.some((s) => s.missed)}
          empty={<EmptyState title="No missed readings" body="Every active patient sent a reading in the last 2 days." />}
        >
          {(data) => (
            <DataTable
              data={data.filter((s) => s.missed)} columns={columns} getRowId={(s) => s.patient.id}
              minWidth={860} pageSize={10} noun="patients" initialSorting={[{ id: 'last', desc: true }]}
            />
          )}
        </QueryState>
      </Card>
      <LogCallDialog patient={calling} open={!!calling} onOpenChange={(o) => !o && setCalling(null)} />
    </>
  );
}
