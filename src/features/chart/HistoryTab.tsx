import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Checkbox, TextArea } from '@/components/ui/Field';
import { toast } from '@/components/ui/Toaster';
import type { Patient } from '@/data/types';
import { useUpdateMedicalHistory } from '@/data/queries/patients';
import { CONDITIONS } from '@/lib/seed/constants';

const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);

/** Conditions, medications and allergies. Doctors can edit. */
export function HistoryTab({ patient, canEdit }: { patient: Patient; canEdit: boolean }) {
  const update = useUpdateMedicalHistory();
  const [editing, setEditing] = useState(false);
  const [conditions, setConditions] = useState(patient.conditions);
  const [meds, setMeds] = useState(patient.medications.join('\n'));
  const [allergies, setAllergies] = useState(patient.allergies.join('\n'));

  const start = () => {
    setConditions(patient.conditions); setMeds(patient.medications.join('\n')); setAllergies(patient.allergies.join('\n'));
    setEditing(true);
  };
  const save = async () => {
    await update.mutateAsync({ id: patient.id, data: { conditions, medications: lines(meds), allergies: lines(allergies) } });
    toast('Medical history saved.');
    setEditing(false);
  };

  if (editing) {
    return (
      <Card padding="lg" className="flex max-w-3xl flex-col gap-5">
        <CardHeader title="Edit medical history" />
        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-2 text-sm font-semibold">Conditions</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2.5">
            {Array.from(new Set([...CONDITIONS, ...patient.conditions])).map((c) => (
              <Checkbox key={c} label={c} checked={conditions.includes(c)}
                onChange={(e) => setConditions(e.target.checked ? [...conditions, c] : conditions.filter((x) => x !== c))} />
            ))}
          </div>
        </fieldset>
        <TextArea label="Medications (one per line)" rows={4} value={meds} onChange={(e) => setMeds(e.target.value)} />
        <TextArea label="Allergies (one per line)" rows={2} value={allergies} onChange={(e) => setAllergies(e.target.value)} />
        <div className="flex gap-2.5">
          <Button onClick={() => void save()} loading={update.isPending}>Save</Button>
          <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </Card>
    );
  }

  const section = (title: string, items: string[], empty: string) => (
    <div className="flex flex-col gap-2">
      <h3 className="m-0 text-sm font-semibold">{title}</h3>
      {items.length ? (
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {items.map((i) => <li key={i} className="rounded-inner bg-bg px-3.5 py-2.5 text-sm">{i}</li>)}
        </ul>
      ) : <span className="text-sm text-ink-muted">{empty}</span>}
    </div>
  );
  return (
    <Card padding="lg" className="flex max-w-3xl flex-col gap-5">
      <CardHeader title="Medical history" subtitle={canEdit ? undefined : 'Only the doctor can edit medical history.'}
        right={canEdit && <Button variant="secondary" onClick={start}>Edit</Button>} />
      <div className="flex flex-col gap-2">
        <h3 className="m-0 text-sm font-semibold">Conditions</h3>
        <div className="flex flex-wrap gap-1.5">{patient.conditions.map((c) => <Badge key={c} variant="tag" className="text-[13px]">{c}</Badge>)}</div>
      </div>
      {section('Medications', patient.medications, 'None recorded')}
      {section('Allergies', patient.allergies, 'No known allergies')}
    </Card>
  );
}
