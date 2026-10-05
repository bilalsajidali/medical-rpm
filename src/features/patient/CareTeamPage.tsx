import { Phone } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { useMyClinic } from '@/data/queries/admin';
import { useMyPatient } from '@/data/queries/patients';
import { usePageTitle } from '@/lib/usePageTitle';
import { CareTeamCard } from './CareTeamCard';

export default function CareTeamPage() {
  usePageTitle('Care team');
  const me = useMyPatient();
  const clinic = useMyClinic();
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="m-0 font-display text-[28px] leading-9 font-semibold sm:text-[32px] sm:leading-10">Care team</h1>
        <p className="m-0 text-base text-ink-muted">The people who look after your readings{clinic.data ? ` at ${clinic.data.clinic.name}` : ''}.</p>
      </div>
      {me.isPending ? (
        <Skeleton className="h-56 max-w-xl rounded-card" />
      ) : me.isError || !me.data ? (
        <Card><ErrorState error={me.error} onRetry={() => void me.refetch()} /></Card>
      ) : (
        <div className="grid max-w-4xl gap-4 md:grid-cols-2">
          <CareTeamCard patientId={me.data.patient.id} doctor={me.data.doctor} nurse={me.data.nurse} specialty={clinic.data?.clinic.specialty} />
          <Card padding="none" className="flex flex-col gap-3 p-[22px]">
            <CardHeader title="When to call" />
            <p className="m-0 text-base leading-6">Messages are read on weekdays, 8 AM–5 PM. If a reading is far out of your range, your nurse will call you.</p>
            <div className="flex items-start gap-2.5 rounded-inner bg-bg px-4 py-3">
              <Phone size={20} strokeWidth={1.8} aria-hidden="true" className="mt-0.5 shrink-0" />
              <span className="text-base leading-6">For chest pain, trouble breathing or other emergencies, call <strong>911</strong>.</span>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
