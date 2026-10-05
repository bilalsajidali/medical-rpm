import { subDays } from 'date-fns';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { PillSelect } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/States';
import type { Reading, Status } from '@/data/types';
import { staffReadingColumns } from './staffReadingColumns';

type DaysFilter = '7' | '30' | '90' | 'all';

export function ReadingsTab({ readings }: { readings: Reading[] }) {
  const [status, setStatus] = useState<'all' | Status>('all');
  const [days, setDays] = useState<DaysFilter>('30');
  const since = days === 'all' ? '' : subDays(new Date(), Number(days)).toISOString();
  const rows = readings.filter((r) => r.takenAt >= since && (status === 'all' || r.status === status));
  return (
    <Card padding="md" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedTabs aria-label="Status" value={status} onChange={setStatus} options={[
          { value: 'all', label: 'All' }, { value: 'critical', label: 'Critical' }, { value: 'atrisk', label: 'At-Risk' }, { value: 'normal', label: 'Normal' },
        ]} />
        <PillSelect label="Date range" value={days} onChange={setDays} options={[
          { value: '7', label: 'Last 7 days' }, { value: '30', label: 'Last 30 days' }, { value: '90', label: 'Last 90 days' }, { value: 'all', label: 'All time' },
        ]} />
      </div>
      <DataTable
        data={rows} columns={staffReadingColumns} getRowId={(r) => r.id} minWidth={720} pageSize={15} noun="readings"
        initialSorting={[{ id: 'when', desc: true }]} resetKey={`${status}-${days}`}
        empty={<EmptyState title="No readings match" body="Try a longer date range or another status." />}
      />
    </Card>
  );
}
