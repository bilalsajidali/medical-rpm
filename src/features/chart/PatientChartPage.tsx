import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useCurrentUser } from '@/auth/session';
import { focusRing } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { PillTabs } from '@/components/ui/TopNav';
import { useEscalations, useTimeline } from '@/data/queries/care';
import { useLogChartView, usePatient, useReadings } from '@/data/queries/patients';
import { cn } from '@/lib/cn';
import { patientName } from '@/lib/format';
import { usePageTitle } from '@/lib/usePageTitle';
import { LogCallDialog } from '@/features/nurse/LogCallDialog';
import { ChartHeader } from './ChartHeader';
import { ChartTimer } from './ChartTimer';
import { EscalationCard } from './EscalationCard';
import { HistoryTab } from './HistoryTab';
import { NotesTab } from './NotesTab';
import { OverviewTab } from './OverviewTab';
import { patientsBase } from './paths';
import { ReadingsTab } from './ReadingsTab';
import { ThresholdsTab } from './ThresholdsTab';
import { TimeLogTab } from './TimeLogTab';

type Tab = 'overview' | 'readings' | 'notes' | 'history' | 'thresholds' | 'time';
const TABS: { value: Tab; label: string }[] = [
  { value: 'overview', label: 'Overview' }, { value: 'readings', label: 'Readings' }, { value: 'notes', label: 'Notes & calls' },
  { value: 'history', label: 'Medical history' }, { value: 'thresholds', label: 'Thresholds' }, { value: 'time', label: 'Time log' },
];

/** Chart route (deep links). Lists and the dashboard open the same chart in a popup (ChartDialog). */
export default function PatientChartPage() {
  const { id } = useParams<{ id: string }>();
  const summary = usePatient(id);
  usePageTitle(summary.data ? patientName(summary.data.patient) : 'Patient chart');
  return <PatientChart patientId={id} />;
}

/** Shared patient chart (nurse + doctor). Doctors can edit thresholds/history and review escalations. */
export function PatientChart({ patientId: id, embedded }: { patientId: string | undefined; embedded?: boolean }) {
  const user = useCurrentUser();
  const isDoctor = user?.role === 'doctor';
  const isNurse = user?.role === 'nurse';
  const summary = usePatient(id);
  const readings = useReadings(id);
  const timeline = useTimeline(id);
  const pending = useEscalations('pending');
  const logView = useLogChartView();
  const [tab, setTab] = useState<Tab>('overview');
  const [calling, setCalling] = useState(false);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const logged = useRef<string | null>(null);

  const logViewMutate = logView.mutate;
  useEffect(() => {
    if (id && summary.data && logged.current !== id) {
      logged.current = id;
      logViewMutate(id);
    }
  }, [id, summary.data, logViewMutate]);

  const base = patientsBase(user?.role);
  if (summary.isPending) {
    return <div className="flex flex-col gap-4" role="status" aria-label="Loading chart"><Skeleton className="h-44 rounded-card" /><Skeleton className="h-12 w-2/3 rounded-full" /><Skeleton className="h-96 rounded-card" /></div>;
  }
  if (summary.isError || !summary.data) {
    return <Card><ErrorState error={summary.error} onRetry={() => void summary.refetch()} /></Card>;
  }

  const s = summary.data;
  const escalation = pending.data?.find((e) => e.patient.id === s.patient.id) ?? null;
  const goNote = () => { setTab('notes'); setTimeout(() => noteRef.current?.focus(), 50); };

  return (
    <>
      {!embedded && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-ink-muted">
          {isDoctor && <>
            <Link to="/doctor" className={cn('rounded text-ink-muted no-underline hover:text-ink', focusRing)}>Dashboard</Link>
            <span aria-hidden="true">/</span>
          </>}
          <Link to={base} className={cn('rounded text-ink-muted no-underline hover:text-ink', focusRing)}>Patients</Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-ink" aria-current="page">{patientName(s.patient)}</span>
        </nav>
      )}
      <ChartHeader summary={s} isDoctor={isDoctor} onEditThresholds={() => setTab('thresholds')} onAddNote={goNote}
        onCall={isNurse ? () => setCalling(true) : undefined} />
      {isNurse && <ChartTimer patientId={s.patient.id} />}
      {escalation && <EscalationCard row={escalation} canReview={isDoctor && escalation.escalation.toDoctorId === user?.id} />}
      <PillTabs aria-label="Chart sections" items={TABS} value={tab} onChange={setTab} className="self-start" />

      {tab === 'overview' && (
        readings.isPending ? <Skeleton className="h-96 rounded-card" />
          : readings.isError ? <Card><ErrorState error={readings.error} onRetry={() => void readings.refetch()} /></Card>
          : <OverviewTab summary={s} readings={readings.data ?? []} timeline={timeline.data} timelineLoading={timeline.isPending}
              onTab={setTab} canEditThresholds={isDoctor} />
      )}
      {tab === 'readings' && (readings.data ? <ReadingsTab readings={readings.data} /> : <Skeleton className="h-96 rounded-card" />)}
      {tab === 'notes' && (
        <NotesTab ref={noteRef} patientId={s.patient.id} items={timeline.data} loading={timeline.isPending} error={timeline.error}
          onRetry={() => void timeline.refetch()} canWrite={isDoctor || isNurse} />
      )}
      {tab === 'history' && <HistoryTab key={s.patient.id} patient={s.patient} canEdit={isDoctor} />}
      {tab === 'thresholds' && <ThresholdsTab key={JSON.stringify(s.patient.thresholds)} patient={s.patient} canEdit={isDoctor} />}
      {tab === 'time' && <TimeLogTab patientId={s.patient.id} canAdd={isDoctor || isNurse} />}

      {isNurse && <LogCallDialog patient={calling ? s.patient : null} open={calling} onOpenChange={setCalling} />}
    </>
  );
}
