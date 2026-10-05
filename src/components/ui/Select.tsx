import { ChevronDown } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface SelectOption<T extends string> { value: T; label: string }

export interface PillSelectProps<T extends string> {
  /** shown before the value, e.g. "Condition" → "Condition: All" */
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  icon?: ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

/** Pill dropdown (native <select> for accessibility, styled as a pill with a chevron). */
export function PillSelect<T extends string>({ label, value, options, onChange, icon, size = 'sm', className }: PillSelectProps<T>) {
  const id = useId();
  const current = options.find((o) => o.value === value)?.label ?? '';
  return (
    <div
      className={cn(
        'relative inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-surface px-3.5 font-medium text-ink',
        'focus-within:ring-2 focus-within:ring-accent hover:bg-subtle',
        size === 'sm' ? 'h-10 text-[13px]' : 'h-11 px-[18px] text-sm',
        className,
      )}
    >
      {icon && <span aria-hidden="true" className="inline-flex">{icon}</span>}
      <label htmlFor={id} className="whitespace-nowrap">{label ? `${label}: ` : ''}{current}</label>
      <ChevronDown size={16} strokeWidth={1.8} aria-hidden="true" />
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
