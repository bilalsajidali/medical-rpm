import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { useMemo, useState } from 'react';
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
import { ChartDialog } from '@/features/chart/ChartDialog';
import { greeting } from '@/features/patient/vitals';
import { AdherenceDialog } from './AdherenceDialog';
import { FeaturedPatient } from './FeaturedPatient';

/** Patient (A–Z) and Status (critical first) sort from their headers; the rest keep the server order. */
function reviewColumns(onReview: (patientId: string) => void): ColumnDef<NeedsReviewRow>[] {
  return [
    {
      id: 'patient', header: 'Patient',
      accessorFn: (r) => `${r.summary.patient.lastName} ${r.summary.patient.firstName}`,
      cell: ({ row: { original: r } }) => (
        <div className="flex flex-col">
          <span className="font-semibold">{patientName(r.summary.patient)}</span>
          <span className="text-xs text-ink-muted">{r.summary.patient.sex}, {ageOf(r.summary.patient.dob)} · {r.summary.patient.conditions[0]}</span>
        </div>
      ),
    },
    { id: 'reading', header: 'Last reading', enableSorting: false, cell: ({ row }) => <span>{row.original.reading ? flaggedSummary(row.original.reading) : '—'}</span> },
    {
      id: 'status', header: 'Status', sortDescFirst: true,
      accessorFn: (r) => (r.status === 'critical' ? 1 : 0),
      cell: ({ row }) => <StatusPill status={row.original.status} />,
    },
    { id: 'action', header: 'Nurse action', enableSorting: false, cell: ({ row }) => <span className="text-ink-muted">{row.original.nurseAction}</span> },
    { id: 'received', header: 'Received', enableSorting: false, cell: ({ row }) => <span className="text-ink-muted whitespace-nowrap">{formatWhen(row.original.receivedAt)}</span> },
    {
      id: 'review', header: 'Action', enableSorting: false, meta: { align: 'right' },
      cell: ({ row }) => <Button variant="secondary" size="sm" onClick={() => onReview(row.original.summary.patient.id)}>Review</Button>,
    },
  ];
}

export default function DoctorDashboardPage() {
  usePageTitle('Dashboard');
  const user = useCurrentUser();
  const navigate = useNavigate();
  const dash = useDoctorDashboard();
  const d = dash.data;
  const [chartId, setChartId] = useState<string | null>(null);
  const [adherenceOpen, setAdherenceOpen] = useState(false);
  const columns = useMemo(() => reviewColumns(setChartId), []);
  const subtitle = d
    ? `${d.criticalReadingsToday} critical reading${d.criticalReadingsToday === 1 ? '' : 's'} and ${d.pendingEscalations} escalation${d.pendingEscalations === 1 ? '' : 's'} need your review today.`
    : 'Loading today’s summary…';
  const kpi = useMemo(() => d && [
    { label: 'Active patients', value: d.activePatients, sub: `${d.enrolledThisMonth} enrolled this month`, onClick: () => navigate('/doctor/patients') },
    {
      label: 'Critical', value: d.criticalPatients, sub: 'Patients with an open critical alert', badge: <StatusPill status="critical" label="Act now" />,
      onClick: () => navigate('/doctor/patients?status=critical'),
    },
    {
      label: 'At-Risk', value: d.atRiskPatients, sub: 'Patients outside at-risk range', badge: <StatusPill status="atrisk" label="Watch" />,
      onClick: () => navigate('/doctor/patients?status=atrisk'),
    },
    { label: 'Reading adherence', value: `${d.adherence}%`, progress: d.adherence, onClick: () => setAdherenceOpen(true) },
  ], [d, navigate]);

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
          {d?.featuredPatientId ? <FeaturedPatient patientId={d.featuredPatientId} onOpenChart={setChartId} /> : !d && <Skeleton className="h-[420px] rounded-card" />}
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
      <AdherenceDialog open={adherenceOpen} onOpenChange={setAdherenceOpen} adherence={d?.adherence ?? 0}
        onOpenChart={(id) => { setAdherenceOpen(false); setChartId(id); }} />
      <ChartDialog patientId={chartId} onClose={() => setChartId(null)} />
    </>
  );
}
