import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { TextField } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { toast } from '@/components/ui/Toaster';
import { useMyClinic, useUpdateClinicSettings } from '@/data/queries/admin';
import type { Clinic, Thresholds } from '@/data/types';
import { usePageTitle } from '@/lib/usePageTitle';
import { fromDraft, ThresholdsEditor, toDraft } from '@/features/chart/ThresholdsEditor';

function SettingsForm({ clinic, thresholds }: { clinic: Clinic; thresholds: Thresholds }) {
  const update = useUpdateClinicSettings();
  const [name, setName] = useState(clinic.name);
  const [draft, setDraft] = useState(() => toDraft(thresholds));
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!name.trim()) return setError('Clinic name is required.');
    const result = fromDraft(draft);
    if ('error' in result) return setError(result.error);
    setError(null);
    await update.mutateAsync({ name, defaultThresholds: result.thresholds });
    toast('Clinic settings saved. New patients get these thresholds.');
  };

  return (
    <>
      <Card padding="lg" className="flex max-w-xl flex-col gap-4">
        <CardHeader title="Clinic details" />
        <TextField label="Clinic name" value={name} onChange={(e) => setName(e.target.value)} />
        <p className="m-0 text-sm text-ink-muted">{clinic.city}, {clinic.state} · {clinic.specialty}</p>
      </Card>
      <Card padding="lg" className="flex flex-col gap-4">
        <CardHeader title="Default thresholds" subtitle="Applied to patients you add from now on. Existing patients keep their own thresholds." />
        <ThresholdsEditor draft={draft} onChange={setDraft} />
      </Card>
      {error && <p role="alert" className="m-0 text-[13px] font-medium text-critical-ink">{error}</p>}
      <Button className="self-start" onClick={() => void save()} loading={update.isPending}>Save settings</Button>
    </>
  );
}

export default function SettingsPage() {
  usePageTitle('Clinic settings');
  const clinic = useMyClinic();
  return (
    <>
      <PageHeader title="Clinic settings" subtitle="Clinic name and the default thresholds for new patients" />
      {clinic.isPending ? <Skeleton className="h-80 rounded-card" />
        : clinic.isError || !clinic.data ? <Card><ErrorState error={clinic.error} onRetry={() => void clinic.refetch()} /></Card>
        : <SettingsForm clinic={clinic.data.clinic} thresholds={clinic.data.defaultThresholds} />}
    </>
  );
}
