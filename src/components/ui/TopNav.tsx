import { NavLink } from 'react-router';
import { cn } from '@/lib/cn';
import { focusRing } from './Button';

export interface NavItem {
  to: string;
  label: string;
  /** match the route exactly (home routes) */
  end?: boolean;
}

export interface TopNavProps {
  items: NavItem[];
  'aria-label': string;
  size?: 'md' | 'lg';
  className?: string;
}

/** Pill navigation: white container, active item black. */
export function TopNav({ items, size = 'md', className, ...rest }: TopNavProps) {
  return (
    <nav
      aria-label={rest['aria-label']}
      className={cn('flex max-w-full gap-1 overflow-x-auto rounded-full border border-border bg-surface p-1', className)}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => cn(
            'shrink-0 rounded-full whitespace-nowrap no-underline transition-colors', focusRing,
            size === 'lg' ? 'px-5 py-[11px] text-[15px]' : 'px-[18px] py-2.5 text-sm',
            isActive ? 'bg-ink font-semibold text-surface' : 'font-medium text-ink hover:bg-bg',
          )}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

/** Same look as TopNav, driven by local state (chart tabs). */
export function PillTabs<T extends string>({ items, value, onChange, className, ...rest }: {
  items: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  'aria-label': string;
  className?: string;
}) {
  return (
    <div role="tablist" aria-label={rest['aria-label']} className={cn('flex max-w-full gap-1 overflow-x-auto rounded-full border border-border bg-surface p-1', className)}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              'shrink-0 rounded-full px-[18px] py-2.5 text-sm whitespace-nowrap transition-colors', focusRing,
              active ? 'bg-ink font-semibold text-surface' : 'font-medium text-ink hover:bg-bg',
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
