import * as RD from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { IconButton } from './IconButton';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const WIDTH = { sm: 'max-w-[420px]', md: 'max-w-[520px]', lg: 'max-w-[680px]' };

/** Centered modal (shadcn-style wrapper over Radix Dialog, restyled to our tokens). */
export function Dialog({ open, onOpenChange, title, description, children, footer, size = 'md' }: DialogProps) {
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        <RD.Overlay className="fixed inset-0 z-50 bg-ink/40" />
        <RD.Content
          className={cn(
            'fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-32px)] w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col',
            'rounded-card border border-border bg-surface outline-none', WIDTH[size],
          )}
        >
          <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4">
            <div className="flex flex-col gap-1">
              <RD.Title className="m-0 font-display text-xl font-semibold">{title}</RD.Title>
              {description
                ? <RD.Description className="m-0 text-sm text-ink-muted">{description}</RD.Description>
                : <RD.Description className="sr-only">{title}</RD.Description>}
            </div>
            <RD.Close asChild>
              <IconButton aria-label="Close" size={36} icon={<X size={16} />} />
            </RD.Close>
          </div>
          <div className="overflow-y-auto px-6 pb-2">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2.5 px-6 pt-4 pb-6">{footer}</div>}
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}

/** Side drawer (shadcn "Sheet"): Radix Dialog anchored right (or left for mobile nav). */
export function Sheet({ open, onOpenChange, title, description, children, footer, side = 'right' }: Omit<DialogProps, 'size'> & { side?: 'left' | 'right' }) {
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        <RD.Overlay className="fixed inset-0 z-50 bg-ink/40" />
        <RD.Content
          className={cn(
            'fixed top-0 z-50 flex h-dvh w-full max-w-[420px] flex-col border-border bg-surface outline-none',
            side === 'right' ? 'right-0 border-l' : 'left-0 max-w-[300px] border-r',
          )}
        >
          <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4">
            <div className="flex flex-col gap-1">
              <RD.Title className="m-0 font-display text-xl font-semibold">{title}</RD.Title>
              {description
                ? <RD.Description className="m-0 text-sm text-ink-muted">{description}</RD.Description>
                : <RD.Description className="sr-only">{title}</RD.Description>}
            </div>
            <RD.Close asChild>
              <IconButton aria-label="Close" size={36} icon={<X size={16} />} />
            </RD.Close>
          </div>
          <div className="grow overflow-y-auto px-6 pb-4">{children}</div>
          {footer && <div className="flex flex-wrap gap-2.5 border-t border-divider px-6 py-4">{footer}</div>}
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}
