import { FileText, Settings, User, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { focusRing } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { useAdminOverview, useMyClinic } from '@/data/queries/admin';
import { cn } from '@/lib/cn';
import { usePageTitle } from '@/lib/usePageTitle';

function formatMinutes(min: number | null): string {
  if (min === null) return '—';
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${min % 60} m`;
}

function QuickLink({ to, icon, title, body }: { to: string; icon: ReactNode; title: string; body: string }) {
  return (
    <Link to={to} className={cn('flex items-start gap-3 rounded-card border border-border bg-surface p-5 text-ink no-underline transition-colors hover:bg-subtle', focusRing)}>
      <span aria-hidden="true" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink">{icon}</span>
      <span className="flex flex-col gap-0.5">
        <span className="font-display text-base font-semibold">{title}</span>
        <span className="text-[13px] text-ink-muted">{body}</span>
      </span>
    </Link>
  );
}

export default function AdminOverviewPage() {
  usePageTitle('Clinic overview');
  const overview = useAdminOverview();
  const clinic = useMyClinic();
  const d = overview.data;
  return (
    <>
      <PageHeader title="Clinic overview" subtitle={clinic.data ? `${clinic.data.clinic.name} · ${clinic.data.clinic.city}, ${clinic.data.clinic.state}` : 'Your clinic at a glance'} />
      {overview.isError ? <Card><ErrorState error={overview.error} onRetry={() => void overview.refetch()} /></Card> : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          {!d ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[132px] rounded-card" />) : <>
            <KpiCard label="Active patients" value={d.activePatients} sub={`${d.missed} with missed readings`} />
            <KpiCard label="Alerts today" value={d.alertsToday} sub={`${d.openAlerts} still open in the nurse queue`} />
            <KpiCard label="Avg response time" value={formatMinutes(d.avgResponseMinutes)} sub="Alert received → closed, last 30 days" />
            <KpiCard label="Ready to bill" value={d.readyToBill} sub="Patients meeting device and time codes this month" />
          </>}
        </div>
      )}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
        <QuickLink to="/admin/team" icon={<Users size={18} strokeWidth={1.8} />} title="Team" body={d ? `${d.staff} active staff · invite doctors and nurses` : 'Invite doctors and nurses'} />
        <QuickLink to="/admin/patients" icon={<User size={18} strokeWidth={1.8} />} title="Patients" body="Enroll patients and export the list" />
        <QuickLink to="/admin/billing" icon={<FileText size={18} strokeWidth={1.8} />} title="Billing report" body="Monthly RPM code eligibility and CSV export" />
        <QuickLink to="/admin/settings" icon={<Settings size={18} strokeWidth={1.8} />} title="Clinic settings" body="Clinic name and default thresholds" />
      </div>
    </>
  );
}
