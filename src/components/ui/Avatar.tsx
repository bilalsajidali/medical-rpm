import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';

export interface AvatarProps {
  firstName: string;
  lastName: string;
  size?: 36 | 40 | 44 | 64;
  /** patients = neutral; staff = accent-soft; platform = black (super admin) */
  tone?: 'patient' | 'staff' | 'platform';
  className?: string;
}

const SIZE = {
  36: 'size-9 text-xs', 40: 'size-10 text-sm', 44: 'size-11 text-sm', 64: 'size-16 font-display text-xl',
};
const TONE = {
  patient: 'bg-muted-bg text-ink',
  staff: 'bg-accent-soft text-accent-ink',
  platform: 'bg-ink text-surface',
};

export function Avatar({ firstName, lastName, size = 36, tone = 'patient', className }: AvatarProps) {
  return (
    <span aria-hidden="true" className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-bold', SIZE[size], TONE[tone], className)}>
      {initials(firstName, lastName)}
    </span>
  );
}
