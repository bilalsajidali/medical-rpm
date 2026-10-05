import { useState } from 'react';
import { Button, buttonClasses } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { NumberField } from '@/components/ui/Field';
import { toast } from '@/components/ui/Toaster';
import { useLogCall } from '@/data/queries/care';
import type { CallLog, Patient } from '@/data/types';
import { patientName } from '@/lib/format';
import { CallOutcomePicker } from './CallOutcomePicker';

/** Log a call for a patient (missed readings, chart header). */
export function LogCallDialog({ patient, open, onOpenChange }: { patient: Patient | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const logCall = useLogCall();
  const [outcome, setOutcome] = useState<CallLog['outcome'] | null>(null);
  const [live, setLive] = useState(false);
  const [minutes, setMinutes] = useState('5');
  const [error, setError] = useState<string | null>(null);

  const reset = () => { setOutcome(null); setLive(false); setMinutes('5'); setError(null); };
  const submit = async () => {
    const m = Number(minutes);
    if (!outcome) return setError('Choose a call outcome.');
    if (!Number.isInteger(m) || m < 1 || m > 120) return setError('Minutes should be between 1 and 120.');
    await logCall.mutateAsync({ patientId: patient!.id, outcome, liveConversation: live, minutes: m });
    toast(`Call logged for ${patientName(patient!)}.`);
    reset();
    onOpenChange(false);
  };

  if (!patient) return null;
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}
      title={`Call ${patientName(patient)}`}
      description={`${patient.phone}. The call and its minutes are saved to the call log and time log.`}
      footer={<>
        <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button onClick={() => void submit()} loading={logCall.isPending}>Log call</Button>
      </>}
    >
      <div className="flex flex-col gap-5">
        <a href={`tel:${patient.phone.replace(/[^\d+]/g, '')}`} className={buttonClasses('secondary', 'md', 'w-fit')}>Dial {patient.phone}</a>
        <CallOutcomePicker outcome={outcome} onOutcome={(o) => { setOutcome(o); setError(null); }} live={live} onLive={setLive} />
        <NumberField label="Minutes on the call" value={minutes} onChange={(e) => setMinutes(e.target.value)} className="max-w-[200px]" />
        {error && <p role="alert" className="m-0 text-[13px] font-medium text-critical-ink">{error}</p>}
      </div>
    </Dialog>
  );
}
