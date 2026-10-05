import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { toast } from '@/components/ui/Toaster';
import type { Patient } from '@/data/types';
import { useUpdateThresholds } from '@/data/queries/patients';
import { fromDraft, ThresholdsEditor, toDraft } from './ThresholdsEditor';

/** Patient thresholds. Doctors edit; saving applies to future readings only. */
export function ThresholdsTab({ patient, canEdit }: { patient: Patient; canEdit: boolean }) {
  const update = useUpdateThresholds();
  const [draft, setDraft] = useState(() => toDraft(patient.thresholds));
  const [error, setError] = useState<string | null>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(toDraft(patient.thresholds));

  const save = async () => {
    const result = fromDraft(draft);
    if ('error' in result) return setError(result.error);
    setError(null);
    await update.mutateAsync({ id: patient.id, thresholds: result.thresholds });
    toast('Thresholds saved. New readings will use them.');
  };

  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <CardHeader
        title="Thresholds"
        subtitle={canEdit ? 'Changes apply to new readings only. Past readings keep their status.' : 'Only the doctor can change thresholds.'}
        right={canEdit && <>
          <Button variant="secondary" disabled={!dirty} onClick={() => { setDraft(toDraft(patient.thresholds)); setError(null); }}>Reset</Button>
          <Button onClick={() => void save()} disabled={!dirty} loading={update.isPending}>Save thresholds</Button>
        </>}
      />
      <ThresholdsEditor draft={draft} onChange={canEdit ? setDraft : undefined} />
      {error && <p role="alert" className="m-0 text-[13px] font-medium text-critical-ink">{error}</p>}
    </Card>
  );
}
