import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { cn } from '@/lib/cn';
import { focusRing } from './Button';

export interface SidebarItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
  count?: number;
  /** red badge is reserved for the critical/open-alert count */
  countTone?: 'critical' | 'neutral';
}

export function SidebarNav({ items, onNavigate, ...rest }: { items: SidebarItem[]; 'aria-label': string; onNavigate?: () => void }) {
  return (
    <nav aria-label={rest['aria-label']} className="flex flex-col gap-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) => cn(
            'flex h-11 items-center gap-3 rounded-full px-3.5 text-sm no-underline transition-colors', focusRing,
            isActive ? 'bg-ink font-semibold text-surface' : 'font-medium text-ink hover:bg-bg',
          )}
        >
          <span aria-hidden="true" className="inline-flex shrink-0">{item.icon}</span>
          <span className="grow">{item.label}</span>
          {item.count !== undefined && item.count > 0 && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-bold tabular',
                item.countTone === 'critical' ? 'bg-critical text-surface' : 'bg-muted-bg text-missed-ink',
              )}
            >
              <span className="sr-only">{item.countTone === 'critical' ? 'Open alerts: ' : 'Count: '}</span>
              {item.count}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
