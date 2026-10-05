import { forwardRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { TextArea } from '@/components/ui/Field';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/States';
import { Timeline } from '@/components/ui/Timeline';
import { toast } from '@/components/ui/Toaster';
import type { TimelineItem, TimelineKind } from '@/data/api/notes';
import { useAddNote } from '@/data/queries/care';

type Filter = 'all' | 'notes' | 'calls' | 'readings';
const MATCH: Record<Filter, (k: TimelineKind) => boolean> = {
  all: () => true,
  notes: (k) => k === 'note' || k === 'message' || k === 'call_request' || k === 'escalation' || k === 'escalation_reviewed',
  calls: (k) => k === 'call',
  readings: (k) => k === 'reading',
};

/** Timeline of notes, calls, flagged readings and escalations, plus an add-note form. */
export const NotesTab = forwardRef<HTMLTextAreaElement, {
  patientId: string; items: TimelineItem[] | undefined; loading: boolean; error: unknown; onRetry: () => void; canWrite: boolean;
}>(function NotesTab({ patientId, items, loading, error, onRetry, canWrite }, ref) {
  const addNote = useAddNote();
  const [body, setBody] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const save = async () => {
    if (!body.trim()) return;
    await addNote.mutateAsync({ patientId, body });
    setBody('');
    toast('Note added to the chart.');
  };
  const shown = (items ?? []).filter((i) => MATCH[filter](i.kind));
  return (
    <div className="flex flex-wrap items-start gap-4">
      <Card padding="lg" className="flex min-w-0 flex-[2_1_560px] flex-col gap-4">
        <CardHeader title="Notes & calls" right={<SegmentedTabs aria-label="Show" size="sm" value={filter} onChange={setFilter} options={[
          { value: 'all', label: 'All' }, { value: 'notes', label: 'Notes' }, { value: 'calls', label: 'Calls' }, { value: 'readings', label: 'Readings' },
        ]} />} />
        {loading ? <SkeletonRows rows={6} />
          : error ? <ErrorState error={error} onRetry={onRetry} />
          : shown.length === 0 ? <EmptyState title="Nothing here yet" body="Notes, calls and flagged readings show up here." />
          : <Timeline items={shown} />}
      </Card>
      {canWrite && (
        <Card padding="lg" className="flex min-w-0 flex-[1_1_320px] flex-col gap-3">
          <CardHeader title="Add note" size="sm" />
          <TextArea ref={ref} label="Note" labelClassName="sr-only" rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a note for the care team…" />
          <Button className="self-start" onClick={() => void save()} disabled={!body.trim()} loading={addNote.isPending}>Save note</Button>
        </Card>
      )}
    </div>
  );
});
