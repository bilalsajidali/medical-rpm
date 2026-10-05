import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** display = 36px dashboard greeting (top-nav layouts); page = 30px sidebar page title */
  size?: 'display' | 'page';
  className?: string;
}

export function PageHeader({ title, subtitle, actions, size = 'page', className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className={cn(
          'm-0 font-display font-semibold',
          size === 'display' ? 'text-[28px] leading-9 tracking-[-0.02em] sm:text-4xl sm:leading-[44px]' : 'text-[26px] leading-[34px] tracking-[-0.01em] sm:text-[30px] sm:leading-[38px]',
        )}>
          {title}
        </h1>
        {subtitle && <p className={cn('m-0 text-ink-muted', size === 'display' ? 'text-[15px]' : 'text-sm')}>{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}
