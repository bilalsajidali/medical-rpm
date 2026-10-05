import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { cn } from '@/lib/cn';
import { formatTime } from '@/lib/format';
import { READING_WINDOWS, type SlotKey, type SlotStatus } from '@/lib/rules/time';
import { medicationDoses } from './schedule';

function SlotRow({ slot, status }: { slot: SlotKey; status: SlotStatus }) {
  const w = READING_WINDOWS[slot];
  const sub = {
    done: `Done at ${status.doneAt ? formatTime(status.doneAt) : ''}`,
    due: `Due by ${w.dueBy}`,
    upcoming: `From ${w.from}`,
    late: `Was due by ${w.dueBy}`,
  }[status.state];
  const due = status.state === 'due' || status.state === 'late';
  return (
    <li className={cn('flex items-center justify-between gap-3 rounded-inner px-3.5 py-3', due ? 'border border-ink' : 'bg-bg')}>
      <div className="flex flex-col">
        <span className="text-base font-semibold">{w.label}</span>
        <span className="text-sm text-ink-muted">{sub}</span>
      </div>
      {status.state === 'done' && <StatusPill status="normal" label="Done" size="md" className="px-3 py-1 text-sm" />}
      {status.state === 'due' && <Badge variant="dark" size="md">Due now</Badge>}
      {status.state === 'late' && <Badge variant="dark" size="md">Late</Badge>}
      {status.state === 'upcoming' && <span className="text-sm font-medium text-ink-muted">Upcoming</span>}
    </li>
  );
}

export function ScheduleCard({ slots, medications, now = new Date() }: {
  slots: Record<SlotKey, SlotStatus>; medications: string[]; now?: Date;
}) {
  const doses = medicationDoses(medications);
  return (
    <Card padding="none" className="p-[22px]">
      <div className="flex flex-col gap-3">
        <CardHeader title="Today’s schedule" />
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          <SlotRow slot="morning" status={slots.morning} />
          <SlotRow slot="evening" status={slots.evening} />
          {doses.map((d) => (
            <li key={`${d.name}-${d.time}`} className="flex items-center justify-between gap-3 rounded-inner bg-bg px-3.5 py-3">
              <div className="flex flex-col">
                <span className="text-base font-semibold">{d.name}</span>
                <span className="text-sm text-ink-muted">Take at {d.time}</span>
              </div>
              <span className="text-sm font-medium text-ink-muted">{d.hour > now.getHours() ? 'Upcoming' : 'Earlier today'}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
