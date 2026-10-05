import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Padding = 'none' | 'sm' | 'md' | 'lg';
const PAD: Record<Padding, string> = { none: 'p-0', sm: 'p-4', md: 'p-5', lg: 'p-6' };

export interface CardProps extends HTMLAttributes<HTMLElement> {
  padding?: Padding;
  as?: 'section' | 'div' | 'article';
}

/** White card: 1px border, 20px radius, no shadow. */
export function Card({ padding = 'md', as: Tag = 'section', className, ...rest }: CardProps) {
  return <Tag className={cn('rounded-card border border-border bg-surface', PAD[padding], className)} {...rest} />;
}

export interface CardHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  /** heading level for the title */
  level?: 'h2' | 'h3';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TITLE_SIZE = { sm: 'text-[17px]', md: 'text-lg', lg: 'text-xl' };

export function CardHeader({ title, subtitle, right, level: H = 'h2', size = 'md', className }: CardHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <H className={cn('m-0 font-display font-semibold', TITLE_SIZE[size])}>{title}</H>
        {subtitle && <span className="text-[13px] text-ink-muted">{subtitle}</span>}
      </div>
      {right && <div className="flex flex-wrap items-center gap-2.5">{right}</div>}
    </div>
  );
}
