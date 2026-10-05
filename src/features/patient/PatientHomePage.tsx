import { format } from 'date-fns';
import { Bell, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { VitalTrendChart } from '@/components/charts/VitalTrendChart';
import { Button, focusRing } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { VitalCard } from '@/components/ui/VitalCard';
import { useMyClinic } from '@/data/queries/admin';
import { useMyPatient, useReadings } from '@/data/queries/patients';
import type { PatientSummary } from '@/data/api/patients';
import type { Reading } from '@/data/types';
import { cn } from '@/lib/cn';
import { formatWhen } from '@/lib/format';
import { usePageTitle } from '@/lib/usePageTitle';
import { CareTeamCard } from './CareTeamCard';
import { PatientTrendCard } from './PatientTrendCard';
import { ReadingHistoryTable } from './ReadingHistoryTable';
import { ScheduleCard } from './ScheduleCard';
import { dueBanner, todayStatus } from './schedule';
import { greeting, latestWith, MEAL_TEXT, PATIENT_VITALS, sparkValues, vitalStatusOf } from './vitals';

function latestCards(readings: Reading[]) {
  return PATIENT_VITALS.map((v) => {
    const r = latestWith(readings, v);
    const st = r ? vitalStatusOf(r, v) : null;
    const meal = v.key === 'glucose' && r?.mealTiming ? `, ${MEAL_TEXT[r.mealTiming]}` : '';
    return {
      v, value: r ? v.value(r) : '—', status: st?.status ?? null, direction: st?.direction,
      timestamp: r ? `${formatWhen(r.takenAt)}${meal}` : 'No reading yet', spark: sparkValues(readings, v),
    };
  });
}

function MonthCard({ summary }: { summary: PatientSummary }) {
  const { readingDays, daysSoFar } = summary.month;
  const pct = daysSoFar ? (readingDays / daysSoFar) * 100 : 0;
  const message = pct >= 80
    ? 'Great job. Keep taking a reading every morning and evening.'
    : 'Try to take a reading every day. It helps your care team look after you.';
  return (
    <Card padding="none" className="p-[22px]">
      <div className="flex flex-col gap-3.5">
        <CardHeader title="This month" />
        <div className="flex items-baseline gap-2">
          <span className="font-display text-4xl font-medium tabular">{readingDays}</span>
          <span className="text-base text-ink-muted">of {daysSoFar} days with readings</span>
        </div>
        <ProgressBar value={pct} height={10} label="Days with readings this month" />
        <span className="text-[15px] text-ink-muted">{message}</span>
      </div>
    </Card>
  );
}

function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading your readings">
      <Skeleton className="h-28 rounded-card" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-card" />)}</div>
      <Skeleton className="h-96 rounded-card" />
    </div>
  );
}

export default function PatientHomePage() {
  usePageTitle('Home');
  const navigate = useNavigate();
  const me = useMyPatient();
  const readings = useReadings(me.data?.patient.id, 90);
  const clinic = useMyClinic();

  if (me.isPending || (me.data && readings.isPending)) return <HomeSkeleton />;
  if (me.isError || readings.isError || !me.data || !readings.data) {
    return <Card><ErrorState error={me.error ?? readings.error} onRetry={() => { void me.refetch(); void readings.refetch(); }} /></Card>;
  }

  const summary = me.data;
  const list = readings.data; // newest first
  const now = new Date();
  const slots = todayStatus(list.map((r) => r.takenAt), now);
  const banner = dueBanner(slots);
  const cards = latestCards(list);
  const hello = `${greeting(now)}, ${summary.patient.firstName}`;
  const bpSeven = list.filter((r) => r.systolic !== undefined && new Date(r.takenAt) > new Date(now.getTime() - 7 * 864e5));
  const addReading = () => navigate('/patient/add-reading');

  return (
    <>
      {/* ---------- Mobile (< 768px): Patient.dc layout ---------- */}
      <div className="flex flex-col gap-4 md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-base text-ink-muted">{format(now, 'EEEE, MMM d')}</span>
            <h1 className="m-0 font-display text-[26px] leading-8 font-semibold">{hello}</h1>
          </div>
          <IconButton aria-label="Notifications" size={48} icon={<Bell size={22} strokeWidth={1.8} />} />
        </div>
        <Card padding="md" className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1">
            <span className="font-display text-[19px] font-semibold">{banner.title}</span>
            <span className="text-base text-ink-muted">{banner.body}</span>
          </div>
          <Button size="lg" block icon={<Plus size={20} strokeWidth={2} />} onClick={addReading}>Add reading</Button>
        </Card>
        <h2 className="m-0 font-display text-[17px] font-semibold">Latest readings</h2>
        <div className="grid grid-cols-2 gap-3">
          {cards.map((c) => (
            <VitalCard key={c.v.key} label={c.v.label} value={c.value} unit={c.v.unit} status={c.status}
              direction={c.direction} audience="patient" size="sm" pillBelow />
          ))}
        </div>
        <Card padding="sm" className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-base font-semibold">Blood pressure · 7 days</span>
            <Link to="/patient/readings" className={cn('rounded-full text-[15px] font-semibold text-accent no-underline', focusRing)}>History</Link>
          </div>
          <VitalTrendChart readings={bpSeven} vital="bp" thresholds={summary.patient.thresholds} variant="patient" height={150}
            ariaLabel="Blood pressure over the last 7 days" />
        </Card>
      </div>

      {/* ---------- Tablet / desktop (≥ 768px): PatientDesktop.dc layout ---------- */}
      <div className="hidden flex-col gap-6 md:flex">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-card bg-ink px-7 py-6 text-surface">
          <div className="flex flex-col gap-1.5">
            <h1 className="m-0 font-display text-[32px] leading-10 font-semibold tracking-[-0.01em]">{hello}</h1>
            <p className="m-0 text-[17px] text-surface/75">{banner.title}. {banner.body}.</p>
          </div>
          <Button variant="inverse" size="lg" className="px-[26px]" icon={<Plus size={20} strokeWidth={2} />} onClick={addReading}>Add reading</Button>
        </div>

        <section className="flex flex-col gap-3" aria-labelledby="latest-h">
          <h2 id="latest-h" className="m-0 font-display text-xl font-semibold">Your latest readings</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
            {cards.map((c) => (
              <VitalCard key={c.v.key} label={c.v.label} value={c.value} unit={c.v.unit} status={c.status} direction={c.direction}
                audience="patient" size="lg" timestamp={c.timestamp} spark={c.spark} />
            ))}
          </div>
        </section>

        <div className="flex flex-wrap gap-4">
          <PatientTrendCard readings={list} thresholds={summary.patient.thresholds} className="min-w-0 flex-[2_1_600px]" />
          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
            <MonthCard summary={summary} />
            <ScheduleCard slots={slots} medications={summary.patient.medications} now={now} />
            <CareTeamCard patientId={summary.patient.id} doctor={summary.doctor} nurse={summary.nurse} specialty={clinic.data?.clinic.specialty} />
          </div>
        </div>

        <ReadingHistoryCard summary={summary} readings={list} />
      </div>
    </>
  );
}

function ReadingHistoryCard({ summary, readings }: { summary: PatientSummary; readings: Reading[] }) {
  const print = () => window.print();
  return (
    <Card padding="lg" className="print-area flex flex-col gap-3">
      <div className="print-only mb-2">
        <p className="m-0 font-display text-xl font-semibold">Reading history · {summary.patient.firstName} {summary.patient.lastName}</p>
        <p className="m-0 text-sm text-ink-muted">MRN {summary.patient.mrn} · Printed {format(new Date(), 'MMM d, yyyy h:mm a')}</p>
      </div>
      <CardHeader
        title="Reading history" size="lg"
        right={<div className="print-hide flex items-center gap-2.5">
          <Button variant="secondary" className="text-[15px] font-medium" onClick={print}>Download PDF</Button>
          <Link to="/patient/readings" className={cn('rounded-full text-[15px] font-semibold text-accent no-underline', focusRing)}>See all</Link>
        </div>}
      />
      <ReadingHistoryTable readings={readings.slice(0, 6)} />
    </Card>
  );
}
