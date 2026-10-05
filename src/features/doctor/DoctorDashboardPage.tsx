import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { useCurrentUser } from '@/auth/session';
import { Button, buttonClasses, focusRing } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { KpiCard } from '@/components/ui/KpiCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, Skeleton, SkeletonRows } from '@/components/ui/States';
import { StatusPill } from '@/components/ui/StatusPill';
import type { NeedsReviewRow } from '@/data/api/dashboards';
import { useDoctorDashboard } from '@/data/queries/admin';
import { cn } from '@/lib/cn';
import { ageOf, flaggedSummary, formatWhen, patientName } from '@/lib/format';
import { usePageTitle } from '@/lib/usePageTitle';
import { greeting } from '@/features/patient/vitals';
import { FeaturedPatient } from './FeaturedPatient';

const columns: ColumnDef<NeedsReviewRow>[] = [
  {
    id: 'patient', header: 'Patient',
    cell: ({ row: { original: r } }) => (
      <div className="flex flex-col">
        <span className="font-semibold">{patientName(r.summary.patient)}</span>
        <span className="text-xs text-ink-muted">{r.summary.patient.sex}, {ageOf(r.summary.patient.dob)} · {r.summary.patient.conditions[0]}</span>
      </div>
    ),
  },
  { id: 'reading', header: 'Last reading', cell: ({ row }) => <span>{row.original.reading ? flaggedSummary(row.original.reading) : '—'}</span> },
  { id: 'status', header: 'Status', cell: ({ row }) => <StatusPill status={row.original.status} /> },
  { id: 'action', header: 'Nurse action', cell: ({ row }) => <span className="text-ink-muted">{row.original.nurseAction}</span> },
  { id: 'received', header: 'Received', cell: ({ row }) => <span className="text-ink-muted whitespace-nowrap">{formatWhen(row.original.receivedAt)}</span> },
  {
    id: 'review', header: 'Action', meta: { align: 'right' },
    cell: ({ row }) => <Link to={`/doctor/patients/${row.original.summary.patient.id}`} className={buttonClasses('secondary', 'sm')}>Review</Link>,
  },
];

export default function DoctorDashboardPage() {
  usePageTitle('Dashboard');
  const user = useCurrentUser();
  const navigate = useNavigate();
  const dash = useDoctorDashboard();
  const d = dash.data;
  const subtitle = d
    ? `${d.criticalReadingsToday} critical reading${d.criticalReadingsToday === 1 ? '' : 's'} and ${d.pendingEscalations} escalation${d.pendingEscalations === 1 ? '' : 's'} need your review today.`
    : 'Loading today’s summary…';
  const kpi = useMemo(() => d && [
    { label: 'Active patients', value: d.activePatients, sub: `${d.enrolledThisMonth} enrolled this month` },
    { label: 'Critical', value: d.criticalPatients, sub: 'Patients with an open critical alert', badge: <StatusPill status="critical" label="Act now" /> },
    { label: 'At-Risk', value: d.atRiskPatients, sub: 'Patients outside at-risk range', badge: <StatusPill status="atrisk" label="Watch" /> },
    { label: 'Reading adherence', value: `${d.adherence}%`, progress: d.adherence },
  ], [d]);

  return (
    <>
      <PageHeader
        size="display"
        title={`${greeting()}, Dr. ${user?.lastName ?? ''}`}
        subtitle={subtitle}
        actions={<>
          <span className={cn(buttonClasses('secondary', 'md', 'cursor-default font-medium hover:bg-surface'))}>
            <Calendar size={16} strokeWidth={1.8} aria-hidden="true" />{format(new Date(), 'MMMM yyyy')}
          </span>
          <Button onClick={() => navigate('/doctor/escalations')}>Review escalations</Button>
        </>}
      />
      {dash.isError ? <Card><ErrorState error={dash.error} onRetry={() => void dash.refetch()} /></Card> : (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-4">
            {kpi ? kpi.map((k) => <KpiCard key={k.label} {...k} />) : [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[132px] rounded-card" />)}
          </div>
          {d?.featuredPatientId ? <FeaturedPatient patientId={d.featuredPatientId} /> : !d && <Skeleton className="h-[420px] rounded-card" />}
          <Card padding="lg" className="flex flex-col gap-3">
            <CardHeader title="Needs review" right={
              <Link to="/doctor/patients" className={cn('rounded-full text-sm font-semibold text-accent no-underline', focusRing)}>View all patients</Link>
            } />
            {!d ? <SkeletonRows rows={5} /> : (
              <DataTable data={d.needsReview} columns={columns} getRowId={(r) => r.key} minWidth={760}
                empty={<EmptyState title="All caught up" body="No pending escalations or open critical alerts for your patients." />} />
            )}
          </Card>
        </>
      )}
    </>
  );
}
