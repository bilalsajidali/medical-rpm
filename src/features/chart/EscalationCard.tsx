import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/Field';
import { StatusPill } from '@/components/ui/StatusPill';
import { toast } from '@/components/ui/Toaster';
import type { EscalationRow } from '@/data/api/escalations';
import { useReviewEscalation } from '@/data/queries/care';
import { displayName, flaggedSummary, formatWhen } from '@/lib/format';

/** Highlighted "Escalation from …" card at the top of the chart. */
export function EscalationCard({ row, canReview }: { row: EscalationRow; canReview: boolean }) {
  const review = useReviewEscalation();
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const from = row.from ? displayName(row.from) : 'the care team';

  const submit = async () => {
    if (response.trim().length < 2) return setError('Write a short response for the care team.');
    try {
      await review.mutateAsync({ id: row.escalation.id, response });
      toast('Escalation marked reviewed. The care team can see your response.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    }
  };

  return (
    <section aria-label="Pending escalation" className="flex flex-col gap-4 rounded-card border border-accent bg-accent-soft/40 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="m-0 font-display text-lg font-semibold">Escalation from {from}</h2>
          <span className="text-[13px] text-ink-muted">{formatWhen(row.escalation.at)} · {row.nurseAction}</span>
        </div>
        {row.reading && (
          <span className="flex items-center gap-2 text-sm font-medium">
            {flaggedSummary(row.reading)} <StatusPill status={row.reading.status} />
          </span>
        )}
      </div>
      <p className="m-0 rounded-inner bg-surface px-4 py-3 text-sm leading-[21px]">{row.escalation.reason}</p>
      {canReview ? (
        <div className="flex flex-col gap-3">
          <TextArea label="Your response" labelClassName="text-[13px]" rows={3} value={response}
            onChange={(e) => { setResponse(e.target.value); setError(null); }}
            placeholder="e.g. Increase Lisinopril to 20 mg daily. Recheck in 1 week." error={error ?? undefined} />
          <Button className="self-start" onClick={() => void submit()} loading={review.isPending}>Mark reviewed</Button>
        </div>
      ) : (
        <span className="text-[13px] text-ink-muted">Waiting for the doctor’s review.</span>
      )}
    </section>
  );
}
