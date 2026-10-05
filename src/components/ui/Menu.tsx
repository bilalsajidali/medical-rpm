import * as DM from '@radix-ui/react-dropdown-menu';
import * as TT from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface MenuItem { label: string; onSelect: () => void; icon?: ReactNode }

/** Dropdown menu (shadcn-style wrapper over Radix DropdownMenu). */
export function Menu({ trigger, header, items, align = 'end', side = 'bottom' }: {
  trigger: ReactNode; header?: ReactNode; items: MenuItem[]; align?: 'start' | 'end'; side?: 'top' | 'bottom';
}) {
  return (
    <DM.Root>
      <DM.Trigger asChild>{trigger}</DM.Trigger>
      <DM.Portal>
        <DM.Content
          align={align}
          side={side}
          sideOffset={8}
          className="z-50 min-w-[220px] rounded-inner border border-border bg-surface p-1.5"
        >
          {header && <div className="px-3 pt-2 pb-2.5">{header}</div>}
          {header && <DM.Separator className="mx-1 mb-1 h-px bg-divider" />}
          {items.map((item) => (
            <DM.Item
              key={item.label}
              onSelect={item.onSelect}
              className={cn('flex h-10 cursor-pointer items-center gap-2.5 rounded-full px-3 text-sm font-medium text-ink outline-none select-none', 'data-[highlighted]:bg-bg')}
            >
              {item.icon && <span aria-hidden="true" className="inline-flex text-ink-muted">{item.icon}</span>}
              {item.label}
            </DM.Item>
          ))}
        </DM.Content>
      </DM.Portal>
    </DM.Root>
  );
}

export function Tooltip({ content, children }: { content: ReactNode; children: ReactNode }) {
  return (
    <TT.Root>
      <TT.Trigger asChild>{children}</TT.Trigger>
      <TT.Portal>
        <TT.Content sideOffset={6} className="z-50 rounded-inner bg-ink px-3 py-2 text-xs font-medium text-surface">
          {content}
        </TT.Content>
      </TT.Portal>
    </TT.Root>
  );
}

export const TooltipProvider = TT.Provider;
