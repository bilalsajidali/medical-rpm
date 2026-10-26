import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { focusRing } from './Button';
import { ProgressBar } from './ProgressBar';

export interface KpiCardProps {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  /** 0–100 progress bar under the number */
  progress?: number;
  /** right side of the label row (e.g. a StatusPill) */
  badge?: ReactNode;
  size?: 'md' | 'lg';
  /** makes the whole card a button */
  onClick?: () => void;
  className?: string;
}

/** Label, big number (vital-lg), then sub-text, progress bar or pill. */
export function KpiCard({ label, value, sub, progress, badge, size = 'lg', onClick, className }: KpiCardProps) {
  const Root = onClick ? 'button' : 'div';
  return (
    <Root
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={cn(
        'flex flex-col rounded-card border border-border bg-surface', size === 'lg' ? 'gap-2 p-5' : 'gap-1.5 p-[18px]',
        onClick && cn('cursor-pointer text-left text-ink transition-colors hover:bg-subtle', focusRing),
        className,
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className={cn('text-sm text-ink-muted', size === 'lg' && 'font-medium')}>{label}</span>
        {badge}
      </span>
      <span className={cn('font-display font-medium tabular', size === 'lg' ? 'text-[40px] leading-[44px]' : 'text-[32px] leading-10')}>{value}</span>
      {progress !== undefined && <ProgressBar value={progress} label={typeof label === 'string' ? label : 'Progress'} />}
      {sub && <span className="text-[13px] text-ink-muted">{sub}</span>}
    </Root>
  );
}
