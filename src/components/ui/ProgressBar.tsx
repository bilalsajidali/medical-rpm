import { cn } from '@/lib/cn';

export interface ProgressBarProps {
  value: number; // 0–100
  label: string;
  height?: 6 | 8 | 10;
  className?: string;
}

export function ProgressBar({ value, label, height = 8, className }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={cn('w-full overflow-hidden rounded-full bg-muted-bg', height === 6 ? 'h-1.5' : height === 8 ? 'h-2' : 'h-2.5', className)}
    >
      <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
    </div>
  );
}
