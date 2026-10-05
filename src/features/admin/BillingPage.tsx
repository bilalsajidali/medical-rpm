import type { ColumnDef } from '@tanstack/react-table';
import { Calendar } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { KpiCard } from '@/components/ui/KpiCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { PillSelect } from '@/components/ui/Select';
import { EmptyState, QueryState } from '@/components/ui/States';
import { toast } from '@/components/ui/Toaster';
import { billingMonths, type BillingReportRow } from '@/data/api/billing';
import { useBillingReport, useRecordBillingExport } from '@/data/queries/admin';
import type { BillingRow } from '@/data/types';
import { downloadCsv } from '@/lib/csv';
import { doctorShort, monthLabel, patientName } from '@/lib/format';
import { BILLING_DISCLAIMER, BILLING_RESULT_LABEL, formatTimeCodes } from '@/lib/rules/billing';
import { usePageTitle } from '@/lib/usePageTitle';

type Filter = 'all' | 'ready' | 'needs_action' | 'not_eligible';
const RESULT_BADGE: Record<BillingRow['result'], BadgeVariant> = { ready: 'accent', needs_live_call: 'neutral', device_only: 'neutral', not_eligible: 'faint' };
const needsAction = (r: BillingRow) => r.result === 'needs_live_call' || r.result === 'device_only';

function columns(daysInMonth: number): ColumnDef<BillingReportRow>[] {
  return [
    { id: 'patient', header: 'Patient', accessorFn: (r) => r.patient.lastName, cell: ({ row: { original: r } }) => <div className="flex flex-col"><span className="font-semibold">{patientName(r.patient)}</span><span className="text-xs text-ink-muted">MRN {r.patient.mrn}</span></div> },
    { id: 'doctor', header: 'Doctor', enableSorting: false, cell: ({ row }) => <span className="text-ink-muted">{row.original.doctor ? doctorShort(row.original.doctor) : '—'}</span> },
    { id: 'days', header: 'Reading days', accessorFn: (r) => r.row.readingDays, cell: ({ row }) => `${row.original.row.readingDays} / ${daysInMonth}` },
    { id: 'dcode', header: 'Device code', enableSorting: false, cell: ({ row }) => <span className="font-semibold">{row.original.row.deviceCode ?? '—'}</span> },
    { id: 'mins', header: 'Staff time', accessorFn: (r) => r.row.minutes, cell: ({ row }) => `${row.original.row.minutes} min` },
    { id: 'live', header: 'Live call', enableSorting: false, cell: ({ row }) => <span className={row.original.row.liveCall ? 'font-medium text-normal-ink' : 'font-medium text-ink-muted'}>{row.original.row.liveCall ? 'Yes' : 'No'}</span> },
    { id: 'tcode', header: 'Time code', enableSorting: false, cell: ({ row }) => <span className="font-semibold whitespace-nowrap">{formatTimeCodes(row.original.row.timeCodes)}</span> },
    { id: 'result', header: 'Result', enableSorting: false, cell: ({ row }) => <Badge variant={RESULT_BADGE[row.original.row.result]}>{BILLING_RESULT_LABEL[row.original.row.result]}</Badge> },
  ];
}

export default function BillingPage() {
  usePageTitle('Billing report');
  const months = billingMonths();
  const [month, setMonth] = useState(months[0]);
  const [filter, setFilter] = useState<Filter>('all');
  const [doctor, setDoctor] = useState('all');
  const report = useBillingReport(month);
  const recordExport = useRecordBillingExport();
  const rows = useMemo(() => report.data?.rows ?? [], [report.data]);
  const doctors = Array.from(new Map(rows.filter((r) => r.doctor).map((r) => [r.doctor!.id, r.doctor!])).values());
  const visible = rows.filter((r) => (doctor === 'all' || r.doctor?.id === doctor) && (
    filter === 'all' || (filter === 'ready' && r.row.result === 'ready') || (filter === 'needs_action' && needsAction(r.row)) || (filter === 'not_eligible' && r.row.result === 'not_eligible')));
  const withReadings = rows.filter((r) => r.row.readingDays > 0).length;
  const count = (f: (r: BillingRow) => boolean) => rows.filter((r) => f(r.row)).length;
  const label = monthLabel(month);

  const exportCsv = async () => {
    downloadCsv(`billing-${month}.csv`, [
      ['Month', 'Patient', 'MRN', 'Doctor', 'Reading days', 'Device code', 'Staff minutes', 'Live call', 'Time codes', 'Result'],
      ...rows.map((r) => [month, patientName(r.patient), r.patient.mrn, r.doctor ? doctorShort(r.doctor) : '', r.row.readingDays,
        r.row.deviceCode ?? '', r.row.minutes, r.row.liveCall ? 'Yes' : 'No', r.row.timeCodes.join(' + '), BILLING_RESULT_LABEL[r.row.result]]),
      [], [BILLING_DISCLAIMER],
    ]);
    await recordExport.mutateAsync(month);
    toast(`${label} billing report exported.`);
  };

  return (
    <>
      <PageHeader title="Monthly billing report" subtitle="Which patients qualify for RPM codes this month. Report only, no claims are sent."
        actions={<>
          <PillSelect label="" size="md" icon={<Calendar size={16} strokeWidth={1.8} />} value={month} onChange={(m) => { setMonth(m); setFilter('all'); }}
            options={months.map((m) => ({ value: m, label: monthLabel(m) }))} />
          <Button onClick={() => void exportCsv()} disabled={!report.data} loading={recordExport.isPending}>Export CSV</Button>
        </>} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <KpiCard size="md" label="Patients with readings" value={report.data ? withReadings : '…'} sub={`of ${report.data?.activePatients ?? '…'} active`} />
        <KpiCard size="md" label={<span className="inline-flex items-center gap-2 font-semibold text-accent-ink"><span aria-hidden="true" className="size-2 rounded-full bg-accent" />Ready to bill</span>}
          value={report.data ? count((r) => r.result === 'ready') : '…'} sub="Device and time codes met" />
        <KpiCard size="md" label={<span className="inline-flex items-center gap-2 font-semibold text-missed-ink"><span aria-hidden="true" className="size-2 rounded-full bg-ink-muted" />Needs action</span>}
          value={report.data ? count(needsAction) : '…'} sub="Missing live call or minutes" />
        <KpiCard size="md" label="Days left in month" value={report.data?.daysLeft ?? '…'} sub={report.data ? `Period closes ${label.split(' ')[0].slice(0, 3)} ${report.data.daysInMonth}` : undefined} />
      </div>
      <Card padding="md" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedTabs aria-label="Result" value={filter} onChange={setFilter} options={[
            { value: 'all', label: 'All', count: rows.length }, { value: 'ready', label: 'Ready', count: count((r) => r.result === 'ready') },
            { value: 'needs_action', label: 'Needs action', count: count(needsAction) }, { value: 'not_eligible', label: 'Not eligible', count: count((r) => r.result === 'not_eligible') },
          ]} />
          <PillSelect label="Doctor" value={doctor} onChange={setDoctor} options={[{ value: 'all', label: 'All' }, ...doctors.map((d) => ({ value: d.id, label: doctorShort(d) }))]} />
        </div>
        <QueryState query={report} isEmpty={(d) => d.rows.length === 0} empty={<EmptyState title="No patients this month" />}>
          {(d) => <DataTable data={visible} columns={columns(d.daysInMonth)} getRowId={(r) => r.patient.id} minWidth={980} pageSize={15} noun="patients"
            resetKey={`${month}-${filter}-${doctor}`} empty={<EmptyState title="No patients match" />} />}
        </QueryState>
        <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-inner bg-subtle px-4 py-3.5 text-[13px] leading-[19px] text-ink-muted">
          <span><strong className="text-ink">99454</strong> 16–30 reading days</span>
          <span><strong className="text-ink">99445</strong> 2–15 reading days</span>
          <span><strong className="text-ink">99457</strong> first 20 min staff time</span>
          <span><strong className="text-ink">99458</strong> each extra 20 min</span>
          <span><strong className="text-ink">99470</strong> 10–19 min staff time</span>
          <span>Time codes need at least one live conversation in the month.</span>
        </div>
        <p className="m-0 text-xs text-ink-muted">{BILLING_DISCLAIMER}</p>
      </Card>
    </>
  );
}
