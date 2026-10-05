import { cn } from '@/lib/cn';
import type { PatientStatus } from '@/lib/rules/status';

export type Audience = 'staff' | 'patient';

export const STATUS_STYLE: Record<PatientStatus, { bg: string; ink: string; dot: string; border: string }> = {
  critical: { bg: 'bg-critical-bg', ink: 'text-critical-ink', dot: 'bg-critical', border: 'border-critical/30' },
  atrisk: { bg: 'bg-atrisk-bg', ink: 'text-atrisk-ink', dot: 'bg-atrisk', border: 'border-atrisk/40' },
  normal: { bg: 'bg-normal-bg', ink: 'text-normal-ink', dot: 'bg-normal', border: 'border-border' },
  missed: { bg: 'bg-missed-bg', ink: 'text-missed-ink', dot: 'bg-missed', border: 'border-border' },
};

const STAFF_LABEL: Record<PatientStatus, string> = { critical: 'Critical', atrisk: 'At-Risk', normal: 'Normal', missed: 'Missed' };

/**
 * Staff see Normal / At-Risk / Critical. Patients see In range / Above range / Below range
 * (direction decides above vs below for at-risk and critical).
 */
export function statusLabel(status: PatientStatus, audience: Audience, direction?: 'above' | 'below'): string {
  if (audience === 'staff') return STAFF_LABEL[status];
  if (status === 'normal') return 'In range';
  if (status === 'missed') return 'No reading';
  return direction === 'below' ? 'Below range' : 'Above range';
}

export interface StatusPillProps {
  status: PatientStatus;
  audience?: Audience;
  size?: 'sm' | 'md' | 'lg';
  direction?: 'above' | 'below';
  /** override the label (e.g. "No reading 2 days", "Act now") */
  label?: string;
  /** white pill on a tinted background */
  onTint?: boolean;
  className?: string;
}

const SIZE = {
  sm: 'gap-1.5 px-2.5 py-1 text-xs',
  md: 'gap-1.5 px-2.5 py-[3px] text-[13px]',
  lg: 'gap-2 px-3 py-1.5 text-[13px]',
};
const DOT = { sm: 'size-1.5', md: 'size-[7px]', lg: 'size-2' };

/** Status = dot + word, never color alone. Only for patient reading status. */
export function StatusPill({ status, audience = 'staff', size = 'sm', direction, label, onTint, className }: StatusPillProps) {
  const s = STATUS_STYLE[status];
  return (
    <span className={cn('inline-flex shrink-0 items-center rounded-full font-semibold whitespace-nowrap', SIZE[size], onTint ? 'bg-surface' : s.bg, s.ink, className)}>
      <span aria-hidden="true" className={cn('rounded-full', DOT[size], s.dot)} />
      {label ?? statusLabel(status, audience, direction)}
    </span>
  );
}
