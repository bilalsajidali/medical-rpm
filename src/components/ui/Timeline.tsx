import { cn } from '@/lib/cn';

export type TimelineTone = 'accent' | 'critical' | 'atrisk' | 'normal' | 'neutral';

const DOT: Record<TimelineTone, string> = {
  accent: 'bg-accent', critical: 'bg-critical', atrisk: 'bg-atrisk', normal: 'bg-normal', neutral: 'bg-missed',
};

export interface TimelineEntry { id: string; title: string; body?: string; meta: string; tone: TimelineTone }

/** Dot (color by event type) + title + body + meta. */
export function Timeline({ items, className }: { items: TimelineEntry[]; className?: string }) {
  return (
    <ol className={cn('m-0 flex list-none flex-col gap-3.5 p-0', className)}>
      {items.map((t) => (
        <li key={t.id} className="flex gap-3">
          <span aria-hidden="true" className={cn('mt-[5px] size-2.5 shrink-0 rounded-full', DOT[t.tone])} />
          <div className="flex min-w-0 flex-col gap-[3px]">
            <span className="text-sm font-semibold">{t.title}</span>
            {t.body && <span className="text-[13px] leading-[19px] break-words">{t.body}</span>}
            <span className="text-xs text-ink-muted">{t.meta}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
