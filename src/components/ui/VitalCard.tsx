import { Sparkline } from '@/components/charts/Sparkline';
import { VitalPeek, type PeekPoint } from '@/components/charts/VitalPeek';
import { cn } from '@/lib/cn';
import type { PatientStatus } from '@/lib/rules/status';
import { StatusPill, type Audience } from './StatusPill';
import { usePeek } from './usePeek';

export interface VitalCardProps {
  label: string;
  value: string;
  unit: string;
  status: PatientStatus | null;
  audience?: Audience;
  direction?: 'above' | 'below';
  timestamp?: string;
  spark?: number[];
  /** 30-day readings, oldest → newest; hovering / focusing the card expands it to show them */
  history?: PeekPoint[];
  /** days covered by `history` (default 30) */
  historyDays?: number;
  /** unit shown in the peek when the card itself shows none (staff grid) */
  historyUnit?: string;
  /** desktop patient (38px), staff (36px), compact grid (28–30px) */
  size?: 'lg' | 'md' | 'sm';
  /** pill under the value instead of next to the label (mobile + doctor grid) */
  pillBelow?: boolean;
  className?: string;
}

const VALUE = {
  lg: 'text-[38px] leading-[42px]',
  md: 'text-4xl leading-10',
  sm: 'text-[28px] leading-8',
};

export function VitalCard({
  label, value, unit, status, audience = 'staff', direction, timestamp, spark, history, historyDays = 30, historyUnit, size = 'md', pillBelow, className,
}: VitalCardProps) {
  const { ref: peekRef, ...peek } = usePeek(!!history && history.length > 1);
  const patient = audience === 'patient';
  const pill = status && (
    <StatusPill status={status} audience={audience} direction={direction} size={patient ? 'md' : 'sm'} className={cn(patient && size === 'lg' && 'px-3 py-1 text-sm')} />
  );
  const wrapped = peek.enabled && !!history;
  const card = (
    <div className={cn(
      'flex flex-col rounded-card border border-border bg-surface', size === 'sm' ? 'gap-1.5 p-4' : 'gap-2.5 p-5',
      // inside the peek wrapper: fill it, and sink back a little while the peek is up
      wrapped && cn('h-full transition-[scale,opacity] duration-500 ease-[var(--ease-spring)] motion-reduce:transition-none', peek.open && 'scale-[0.97] opacity-60'),
      className,
    )}>
      <div className="flex items-center justify-between gap-2">
        <span className={cn('font-medium text-ink-muted', patient && size === 'lg' ? 'text-base' : 'text-sm')}>{label}</span>
        {!pillBelow && pill}
      </div>
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
        <span className={cn('font-display font-medium whitespace-nowrap tabular', VALUE[size])}>
          {value}{' '}
          <span className={cn('text-ink-muted', patient && size === 'lg' ? 'text-base' : 'text-sm')}>{unit}</span>
        </span>
        {spark && spark.length > 1 && <Sparkline values={spark} width={size === 'lg' ? 100 : 120} />}
      </div>
      {pillBelow && pill && <div>{pill}</div>}
      {timestamp && <span className={cn(patient ? 'text-[15px]' : 'text-xs font-medium', 'text-ink-muted')}>{timestamp}</span>}
    </div>
  );
  if (!wrapped) return card;
  return (
    <div
      className={cn('relative rounded-card outline-none focus-visible:ring-2 focus-visible:ring-accent', peek.open && 'z-30')}
      tabIndex={0}
      aria-label={`${label}: ${value} ${historyUnit ?? unit}. Show last ${historyDays} days`}
      aria-expanded={peek.open}
      ref={peekRef}
      {...peek.handlers}
    >
      {card}
      <VitalPeek open={peek.open} label={label} unit={historyUnit ?? unit} points={history} days={historyDays} anchor={peek.anchor} />
    </div>
  );
}
