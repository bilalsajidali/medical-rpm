import { cn } from '@/lib/cn';
import { focusRing } from './Button';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export interface SegmentedTabsProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  'aria-label': string;
  /** filters = black active item; range = white active item with a tiny shadow */
  variant?: 'filter' | 'range';
  size?: 'sm' | 'md' | 'lg';
  /** white container with border (nurse queue) instead of bg-bg */
  onSurface?: boolean;
  block?: boolean;
  className?: string;
}

const SIZE = {
  sm: 'h-[34px] px-3.5 text-[13px]',
  md: 'h-9 px-3.5 text-[13px]',
  lg: 'h-10 px-4 text-[15px]',
};

export function SegmentedTabs<T extends string>({
  options, value, onChange, variant = 'filter', size = 'md', onSurface, block, className, ...rest
}: SegmentedTabsProps<T>) {
  return (
    <div
      role="group"
      aria-label={rest['aria-label']}
      className={cn(
        'flex max-w-full gap-1 overflow-x-auto rounded-full p-1',
        onSurface ? 'border border-border bg-surface' : 'bg-bg',
        block ? 'w-full' : 'w-fit', className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'shrink-0 rounded-full whitespace-nowrap transition-colors tabular', focusRing, SIZE[size], block && 'flex-1',
              active
                ? variant === 'filter'
                  ? 'bg-ink font-semibold text-surface'
                  : 'bg-surface font-semibold text-ink shadow-[0_1px_2px_rgba(15,23,42,0.08)]'
                : 'bg-transparent font-medium text-ink hover:bg-surface/60',
            )}
          >
            {o.label}{o.count !== undefined ? ` ${o.count}` : ''}
          </button>
        );
      })}
    </div>
  );
}
