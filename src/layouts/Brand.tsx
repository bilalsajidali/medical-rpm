import { Activity } from 'lucide-react';
import { Link } from 'react-router';
import { focusRing } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

/** Logo mark + wordmark. */
export function Brand({ to, size = 'md', inverse }: { to?: string; size?: 'md' | 'lg'; inverse?: boolean }) {
  const content = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          'flex items-center justify-center rounded-[12px]',
          size === 'lg' ? 'size-10' : 'size-9',
          inverse ? 'bg-surface text-ink' : 'bg-ink text-surface',
        )}
      >
        <Activity size={size === 'lg' ? 22 : 20} strokeWidth={2} />
      </span>
      <span className={cn('font-display font-bold', size === 'lg' ? 'text-xl' : 'text-lg')}>RPM Platform</span>
    </>
  );
  return to ? (
    <Link to={to} className={cn('flex items-center gap-2.5 rounded-inner text-inherit no-underline', focusRing)}>{content}</Link>
  ) : (
    <span className="flex items-center gap-2.5">{content}</span>
  );
}
