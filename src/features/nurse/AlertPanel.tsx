import { Phone } from 'lucide-react';
import { useState } from 'react';
import { Button, buttonClasses } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextArea } from '@/components/ui/Field';
import { StatusPill } from '@/components/ui/StatusPill';
import { toast } from '@/components/ui/Toaster';
import type { QueueRow } from '@/data/api/alerts';
import { useResolveAlert } from '@/data/queries/care';
import type { CallLog } from '@/data/types';
import { ageOf, formatWhen, nameWithCredential, patientName, PREFERRED_CONTACT } from '@/lib/format';
import { flaggedDetail } from './alertText';
import { CallOutcomePicker } from './CallOutcomePicker';
import { useCareTimer } from './careTimer';
import { EscalateDialog } from './EscalateDialog';
import { TimerBox } from './TimerBox';

/** Side panel for one alert: call, outcome, note, timer, escalate or close. */
export function AlertPanel({ row, onDone }: { row: QueueRow; onDone: () => void }) {
  const { alert, reading, patient, doctor } = row;
  const escalated = alert.state === 'escalated';
  const timer = useCareTimer(patient.id, !escalated);
  const resolve = useResolveAlert();
  const [outcome, setOutcome] = useState<CallLog['outcome'] | null>(null);
  const [live, setLive] = useState(false);
  const [note, setNote] = useState('');
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [callStartedAt, setCallStartedAt] = useState<number | null>(null);
  const detail = flaggedDetail(reading, patient.thresholds);
  const doctorName = doctor ? nameWithCredential(doctor) : 'the doctor';

  const save = async (action: 'close' | 'escalate', reason?: string) => {
    const run = timer.take();
    const callMinutes = callStartedAt ? Math.max(1, Math.ceil((Date.now() - callStartedAt) / 60000)) : undefined;
    try {
      await resolve.mutateAsync({
        alertId: alert.id, outcome, liveConversation: live, callMinutes, note,
        timerMinutes: run?.minutes ?? null, timerStartedAt: run?.startedAt ?? null, action, reason,
      });
      toast(action === 'escalate' ? `Escalated to ${doctorName}.` : `Alert closed for ${patientName(patient)}.`);
      setEscalateOpen(false);
      onDone();
    } catch (e) {
      timer.restart();
      toast(e instanceof Error ? e.message : 'Could not save.');
    }
  };

  return (
    <Card as="section" padding="lg" aria-label={`Alert for ${patientName(patient)}`} className="flex flex-col gap-[18px]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="m-0 font-display text-xl font-semibold">{patientName(patient)}</h2>
          <span className="text-[13px] text-ink-muted">
            {patient.sex}, {ageOf(patient.dob)} · {patient.conditions[0]} · {doctor ? nameWithCredential(doctor) : '—'}
          </span>
          <span className="text-[13px] text-ink-muted tabular">Mobile {patient.phone} · Prefers {patient.preferredContact === 'sms' ? 'SMS' : PREFERRED_CONTACT[patient.preferredContact].toLowerCase()}</span>
        </div>
        <StatusPill status={alert.status} size="lg" />
      </div>

      <div className="flex flex-col gap-1.5 rounded-inner border border-divider bg-subtle p-4">
        <span className="text-[13px] font-medium text-ink-muted">{detail.label} · {formatWhen(reading.takenAt)}</span>
        <span className="font-display text-[44px] leading-[48px] font-medium tabular">
          {detail.value} <span className="text-base text-ink-muted">{detail.unit}</span>
        </span>
        <span className={alert.status === 'critical' ? 'text-[13px] font-medium text-critical-ink' : 'text-[13px] font-medium text-atrisk-ink'}>{detail.text}</span>
      </div>

      {escalated ? (
        <p className="m-0 rounded-inner bg-accent-soft px-4 py-3 text-sm text-accent-ink">
          Escalated to {doctorName}. Waiting for the doctor’s review. It closes when the doctor marks it reviewed.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2.5">
            <a
              href={`tel:${patient.phone.replace(/[^\d+]/g, '')}`}
              onClick={() => { setCallStartedAt(Date.now()); toast(`Calling ${patient.firstName} at ${patient.phone}…`); }}
              className={buttonClasses('primary', 'md', 'flex-1 gap-2')}
            >
              <Phone size={16} strokeWidth={1.8} aria-hidden="true" />{callStartedAt ? 'Call started' : 'Call patient'}
            </a>
            <Button variant="secondary" className="flex-1" onClick={() => setEscalateOpen(true)}>Escalate to doctor</Button>
          </div>
          <CallOutcomePicker outcome={outcome} onOutcome={setOutcome} live={live} onLive={setLive} />
          <TextArea label="Note" labelClassName="text-[13px]" rows={3} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="What happened on the call?" />
          <TimerBox
            savedMinutes={row.monthMinutes} elapsedMs={timer.elapsedMs} running={timer.running} saving={timer.isSaving}
            onStop={() => void timer.stop(outcome ? 'call' : 'review').then((m) => m && toast(`${m} min saved to time log.`))}
            onStart={() => timer.restart()}
          />
          <Button variant="accent" block onClick={() => void save('close')} loading={resolve.isPending && !escalateOpen}>Save and close alert</Button>
        </>
      )}
      <EscalateDialog open={escalateOpen} onOpenChange={setEscalateOpen} doctorName={doctorName}
        saving={resolve.isPending} onConfirm={(reason) => save('escalate', reason)} />
    </Card>
  );
}
