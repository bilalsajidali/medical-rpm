import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant = 'neutral' | 'accent' | 'success' | 'faint' | 'dark' | 'tag';

const VARIANT: Record<BadgeVariant, string> = {
  neutral: 'bg-muted-bg text-missed-ink',
  accent: 'bg-accent-soft text-accent-ink',
  success: 'bg-normal-bg text-normal-ink',
  faint: 'bg-bg text-ink-muted',
  dark: 'bg-ink text-surface',
  /** condition / role chips */
  tag: 'bg-bg text-ink',
};

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  children: ReactNode;
  className?: string;
}

/** Pill for non-reading states (Active / Invited / Ready / RPM Active …). */
export function Badge({ variant = 'neutral', size = 'sm', children, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex shrink-0 items-center rounded-full font-semibold whitespace-nowrap',
      size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1 text-sm',
      variant === 'tag' && 'font-normal',
      VARIANT[variant], className,
    )}>
      {children}
    </span>
  );
}
