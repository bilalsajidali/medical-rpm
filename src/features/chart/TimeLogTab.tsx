import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { NumberField, SelectField } from '@/components/ui/Field';
import { EmptyState, QueryState } from '@/components/ui/States';
import { toast } from '@/components/ui/Toaster';
import type { TimeRow } from '@/data/api/time';
import { useAddTimeEntry, useTimeEntries } from '@/data/queries/care';
import type { TimeEntry } from '@/data/types';
import { ACTIVITY_LABEL, formatWhen } from '@/lib/format';

const columns: ColumnDef<TimeRow>[] = [
  { id: 'when', header: 'Started', accessorFn: (r) => r.entry.start, cell: ({ row }) => <span className="font-medium">{formatWhen(row.original.entry.start)}</span> },
  { id: 'activity', header: 'Activity', enableSorting: false, cell: ({ row }) => ACTIVITY_LABEL[row.original.entry.activity] },
  { id: 'source', header: 'Source', enableSorting: false, cell: ({ row }) => <Badge variant={row.original.entry.source === 'timer' ? 'accent' : 'neutral'}>{row.original.entry.source === 'timer' ? 'Timer' : 'Manual'}</Badge> },
  { id: 'minutes', header: 'Minutes', accessorFn: (r) => r.entry.minutes, meta: { align: 'right' }, cell: ({ row }) => <span className="font-semibold">{row.original.entry.minutes} min</span> },
];

export function TimeLogTab({ patientId, canAdd }: { patientId: string; canAdd: boolean }) {
  const time = useTimeEntries({ patientId });
  const add = useAddTimeEntry();
  const [minutes, setMinutes] = useState('5');
  const [activity, setActivity] = useState<TimeEntry['activity']>('review');
  const [error, setError] = useState<string | null>(null);
  const total = (time.data ?? []).reduce((n, r) => n + r.entry.minutes, 0);

  const save = async () => {
    const m = Number(minutes);
    if (!Number.isInteger(m) || m < 1 || m > 240) return setError('Minutes should be a whole number from 1 to 240.');
    setError(null);
    await add.mutateAsync({ patientId, minutes: m, activity, source: 'manual' });
    toast(`${m} min added to the time log.`);
  };

  return (
    <div className="flex flex-wrap items-start gap-4">
      <Card padding="lg" className="flex min-w-0 flex-[2_1_560px] flex-col gap-3">
        <CardHeader title={`Time log · ${format(new Date(), 'MMMM yyyy')}`} subtitle={`${total} min this month`} />
        <QueryState query={time} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No time logged this month" />}>
          {(data) => <DataTable data={data} columns={columns} getRowId={(r) => r.entry.id} minWidth={520} pageSize={10} noun="entries" initialSorting={[{ id: 'when', desc: true }]} />}
        </QueryState>
      </Card>
      {canAdd && (
        <Card padding="lg" className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
          <CardHeader title="Add time" size="sm" subtitle="For work done off the timer." />
          <NumberField label="Minutes" value={minutes} onChange={(e) => setMinutes(e.target.value)} error={error ?? undefined} />
          <SelectField label="Activity" value={activity} onChange={(e) => setActivity(e.target.value as TimeEntry['activity'])}
            options={Object.entries(ACTIVITY_LABEL).map(([value, label]) => ({ value, label }))} />
          <Button className="self-start" onClick={() => void save()} loading={add.isPending}>Add time</Button>
        </Card>
      )}
    </div>
  );
}
