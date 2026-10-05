import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { focusRing } from './Button';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  'aria-label': string;
  icon: ReactNode;
  /** 36 = table/pagination, 44 = staff, 48 = patient */
  size?: 36 | 44 | 48;
  badge?: number;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, size = 44, badge, className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-surface text-ink transition-colors hover:bg-subtle',
        'disabled:cursor-not-allowed disabled:opacity-50',
        size === 36 && 'size-9 border-border-strong', size === 44 && 'size-11', size === 48 && 'size-12',
        focusRing, className,
      )}
      {...rest}
    >
      <span aria-hidden="true" className="inline-flex">{icon}</span>
      {badge ? (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] rounded-full bg-ink px-1 text-center text-[11px] leading-[18px] font-bold text-surface tabular">
          {badge}
        </span>
      ) : null}
    </button>
  );
});
