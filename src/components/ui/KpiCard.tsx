import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
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
  className?: string;
}

/** Label, big number (vital-lg), then sub-text, progress bar or pill. */
export function KpiCard({ label, value, sub, progress, badge, size = 'lg', className }: KpiCardProps) {
  return (
    <div className={cn('flex flex-col rounded-card border border-border bg-surface', size === 'lg' ? 'gap-2 p-5' : 'gap-1.5 p-[18px]', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className={cn('text-sm text-ink-muted', size === 'lg' && 'font-medium')}>{label}</span>
        {badge}
      </div>
      <span className={cn('font-display font-medium tabular', size === 'lg' ? 'text-[40px] leading-[44px]' : 'text-[32px] leading-10')}>{value}</span>
      {progress !== undefined && <ProgressBar value={progress} label={typeof label === 'string' ? label : 'Progress'} />}
      {sub && <span className="text-[13px] text-ink-muted">{sub}</span>}
    </div>
  );
}
