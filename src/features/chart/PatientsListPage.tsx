import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useCurrentUser } from '@/auth/session';
import { Button, focusRing } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { PillSelect } from '@/components/ui/Select';
import { EmptyState, QueryState } from '@/components/ui/States';
import type { PatientSummary } from '@/data/api/patients';
import { usePatients } from '@/data/queries/patients';
import { cn } from '@/lib/cn';
import { downloadCsv } from '@/lib/csv';
import { patientName, readingSummary } from '@/lib/format';
import { BILLING_RESULT_LABEL } from '@/lib/rules/billing';
import { compareStatus, type PatientStatus } from '@/lib/rules/status';
import { CONDITIONS } from '@/lib/seed/constants';
import { usePageTitle } from '@/lib/usePageTitle';
import { AddPatientDialog } from '@/features/admin/AddPatientDialog';
import { ChartDialog } from './ChartDialog';
import { chartPath } from './paths';
import { patientColumns } from './patientColumns';
import { StatusSummaryCards } from './StatusSummaryCards';

type StatusFilter = 'all' | PatientStatus;
type SortKey = 'latest' | 'name' | 'status';

const RANK: Record<PatientStatus, number> = { critical: 3, atrisk: 2, missed: 1, normal: 0 };
const columns = patientColumns();

/** `?status=critical` etc. (dashboard KPI cards link here pre-filtered) */
function statusParam(v: string | null): StatusFilter {
  return v !== null && Object.hasOwn(RANK, v) ? (v as PatientStatus) : 'all';
}

function sortRows(rows: PatientSummary[], key: SortKey): PatientSummary[] {
  return [...rows].sort((a, b) => {
    if (key === 'name') return a.patient.lastName.localeCompare(b.patient.lastName) || a.patient.firstName.localeCompare(b.patient.firstName);
    if (key === 'status') return RANK[b.status] - RANK[a.status] || (a.status !== 'missed' && b.status !== 'missed' ? compareStatus(a.status, b.status) : 0);
    return (b.latest?.takenAt ?? '').localeCompare(a.latest?.takenAt ?? '');
  });
}

function exportCsv(rows: PatientSummary[]) {
  downloadCsv(`patients-${format(new Date(), 'yyyy-MM-dd')}.csv`, [
    ['Name', 'MRN', 'Sex', 'DOB', 'Conditions', 'Doctor', 'Nurse', 'Status', 'Last reading', 'Last reading at', 'Reading days this month', 'Staff minutes this month', 'Billing'],
    ...rows.map((s) => [
      patientName(s.patient), s.patient.mrn, s.patient.sex, s.patient.dob, s.patient.conditions.join('; '),
      s.doctor ? `${s.doctor.firstName} ${s.doctor.lastName}` : '', s.nurse ? `${s.nurse.firstName} ${s.nurse.lastName}` : '',
      s.status, s.latest ? readingSummary(s.latest) : '', s.latest?.takenAt ?? '', s.month.readingDays, s.month.minutes,
      BILLING_RESULT_LABEL[s.month.billing.result],
    ]),
  ]);
}

export default function PatientsListPage() {
  usePageTitle('Patients');
  const user = useCurrentUser();
  const isAdmin = user?.role === 'clinic_admin';
  const patients = usePatients();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [status, setStatus] = useState<StatusFilter>(() => statusParam(params.get('status')));
  const [condition, setCondition] = useState('all');
  const [billing, setBilling] = useState<'all' | 'ready' | 'not_yet'>('all');
  const [sort, setSort] = useState<SortKey>('latest');
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const canOpenChart = chartPath(user?.role, '') !== null;

  const all = useMemo(() => patients.data ?? [], [patients.data]);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return sortRows(all.filter((s) => {
      if (term && !patientName(s.patient).toLowerCase().includes(term) && !s.patient.mrn.includes(term)) return false;
      if (status !== 'all' && s.status !== status) return false;
      if (condition !== 'all' && !s.patient.conditions.includes(condition)) return false;
      if (billing === 'ready' && s.month.billing.result !== 'ready') return false;
      if (billing === 'not_yet' && s.month.billing.result === 'ready') return false;
      return true;
    }), sort);
  }, [all, q, status, condition, billing, sort]);

  const active = all.filter((s) => s.patient.rpmStatus === 'active').length;
  return (
    <>
      {user?.role === 'doctor' && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-ink-muted">
          <Link to="/doctor" className={cn('rounded text-ink-muted no-underline hover:text-ink', focusRing)}>Dashboard</Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-ink" aria-current="page">Patients</span>
        </nav>
      )}
      <PageHeader
        size={user?.role === 'doctor' ? 'display' : 'page'}
        title="Patients"
        subtitle={`${active} active patients · ${format(new Date(), 'MMMM yyyy')}`}
        actions={isAdmin && <>
          <Button variant="secondary" className="font-medium" onClick={() => exportCsv(filtered)} disabled={!patients.data}>Export CSV</Button>
          <Button icon={<Plus size={18} strokeWidth={2} />} onClick={() => setAdding(true)}>Add patient</Button>
        </>}
      />
      <StatusSummaryCards rows={all} loading={patients.isPending} active={status} onSelect={(s) => setStatus((cur) => (cur === s ? 'all' : s))} />
      <Card padding="md" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex w-full min-w-0 flex-wrap items-center gap-2.5 xl:w-auto">
            <SearchInput value={q} onChange={setQ} placeholder="Search by name or MRN" className="w-full sm:w-auto" inputClassName="sm:w-[200px]" />
            <SegmentedTabs aria-label="Status" value={status} onChange={setStatus} options={[
              { value: 'all', label: 'All' }, { value: 'critical', label: 'Critical' }, { value: 'atrisk', label: 'At-Risk' },
              { value: 'normal', label: 'Normal' }, { value: 'missed', label: 'Missed' },
            ]} />
          </div>
          <div className="flex flex-wrap gap-2">
            <PillSelect label="Condition" value={condition} onChange={setCondition}
              options={[{ value: 'all', label: 'All' }, ...CONDITIONS.map((c) => ({ value: c, label: c }))]} />
            <PillSelect label="Billing" value={billing} onChange={setBilling}
              options={[{ value: 'all', label: 'All' }, { value: 'ready', label: 'Ready' }, { value: 'not_yet', label: 'Not yet' }]} />
            <PillSelect label="Sort" value={sort} onChange={setSort}
              options={[{ value: 'latest', label: 'Latest reading' }, { value: 'name', label: 'Name' }, { value: 'status', label: 'Status' }]} />
          </div>
        </div>
        <QueryState query={patients} isEmpty={(d) => d.length === 0}
          empty={<EmptyState title="No patients yet" body={isAdmin ? 'Add your first patient to start monitoring.' : 'Patients assigned to you will show here.'} />}>
          {() => (
            <DataTable
              data={filtered} columns={columns} getRowId={(s) => s.patient.id} minWidth={1000} pageSize={10} noun="patients"
              onRowClick={canOpenChart ? (s) => setOpenId(s.patient.id) : undefined}
              rowLabel={(s) => `Open chart for ${patientName(s.patient)}`}
              resetKey={`${q}|${status}|${condition}|${billing}|${sort}`}
              empty={<EmptyState title="No patients match" body="Try another search or filter." />}
            />
          )}
        </QueryState>
      </Card>
      {canOpenChart && <ChartDialog patientId={openId} onClose={() => setOpenId(null)} />}
      {isAdmin && <AddPatientDialog open={adding} onOpenChange={setAdding} />}
    </>
  );
}
