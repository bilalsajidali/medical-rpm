import { CircleAlert, Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-inner bg-muted-bg', className)} />;
}

/** Skeleton rows for tables and lists. */
export function SkeletonRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div role="status" aria-label="Loading" className={cn('flex flex-col gap-3 py-2', className)}>
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}
    </div>
  );
}

export function EmptyState({ title, body, action, icon, className }: {
  title: string; body?: ReactNode; action?: ReactNode; icon?: ReactNode; className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 px-4 py-10 text-center', className)}>
      <span aria-hidden="true" className="mb-1 inline-flex size-11 items-center justify-center rounded-full bg-muted-bg text-ink-muted">
        {icon ?? <Inbox size={20} strokeWidth={1.8} />}
      </span>
      <p className="m-0 font-display text-base font-semibold">{title}</p>
      {body && <p className="m-0 max-w-sm text-sm text-ink-muted">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, className }: { error?: unknown; onRetry?: () => void; className?: string }) {
  const message = error instanceof Error && error.message !== 'Forbidden'
    ? error.message
    : error instanceof Error ? 'You do not have access to this.' : 'Something went wrong while loading.';
  return (
    <div role="alert" className={cn('flex flex-col items-center justify-center gap-2 px-4 py-10 text-center', className)}>
      <span aria-hidden="true" className="mb-1 inline-flex size-11 items-center justify-center rounded-full bg-muted-bg text-ink">
        <CircleAlert size={20} strokeWidth={1.8} />
      </span>
      <p className="m-0 font-display text-base font-semibold">Couldn’t load this</p>
      <p className="m-0 max-w-sm text-sm text-ink-muted">{message}</p>
      {onRetry && <Button variant="secondary" size="sm" className="mt-2" onClick={onRetry}>Retry</Button>}
    </div>
  );
}

/** Renders loading / error / empty / content for a query in one place. */
export function QueryState<T>({ query, isEmpty, empty, skeleton, children }: {
  query: { data: T | undefined; isPending: boolean; isError: boolean; error: unknown; refetch: () => unknown };
  isEmpty?: (data: T) => boolean;
  empty?: ReactNode;
  skeleton?: ReactNode;
  children: (data: T) => ReactNode;
}) {
  if (query.isPending) return <>{skeleton ?? <SkeletonRows />}</>;
  if (query.isError || query.data === undefined) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (isEmpty?.(query.data)) return <>{empty ?? <EmptyState title="Nothing here yet" />}</>;
  return <>{children(query.data)}</>;
}
