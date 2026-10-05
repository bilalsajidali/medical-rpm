import { ChevronDown } from 'lucide-react';
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Density = 'staff' | 'patient';

const INPUT_BASE = 'w-full min-w-0 border border-border-strong bg-surface text-ink outline-none transition-shadow placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-accent disabled:bg-subtle aria-[invalid=true]:border-critical';

function FieldShell({ id, label, hint, error, children, className, labelClassName }: {
  id: string; label: ReactNode; hint?: ReactNode; error?: string; children: ReactNode; className?: string; labelClassName?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className={cn('text-sm font-semibold text-ink', labelClassName)}>{label}</label>
      {children}
      {hint && !error && <span id={`${id}-hint`} className="text-xs text-ink-muted">{hint}</span>}
      {error && <span id={`${id}-error`} role="alert" className="text-[13px] font-medium text-critical-ink">{error}</span>}
    </div>
  );
}

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  density?: Density;
  labelClassName?: string;
  suffix?: ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, density = 'staff', className, labelClassName, suffix, id: idProp, ...rest }, ref,
) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className} labelClassName={labelClassName}>
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(INPUT_BASE, 'rounded-full px-[18px]', density === 'patient' ? 'h-[52px] text-base' : 'h-11 text-[15px]')}
          {...rest}
        />
        {suffix && <span className="shrink-0 text-[15px] text-ink-muted">{suffix}</span>}
      </div>
    </FieldShell>
  );
});

/** Numeric input. Patient variant: big display-font number in a 14px-radius box (Add reading). */
export const NumberField = forwardRef<HTMLInputElement, TextFieldProps & { big?: boolean }>(function NumberField(
  { label, hint, error, density = 'staff', className, labelClassName, suffix, big, id: idProp, ...rest }, ref,
) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className} labelClassName={labelClassName}>
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          id={id}
          type="number"
          inputMode="numeric"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(
            INPUT_BASE, 'tabular',
            big
              ? 'h-14 rounded-inner px-3.5 font-display text-[26px] font-medium'
              : density === 'patient' ? 'h-[52px] rounded-inner px-3 font-display text-2xl font-medium' : 'h-11 rounded-full px-4 text-[15px]',
          )}
          {...rest}
        />
        {suffix && <span className="shrink-0 text-[15px] font-normal text-ink-muted">{suffix}</span>}
      </div>
    </FieldShell>
  );
});

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  labelClassName?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, hint, error, className, labelClassName, rows = 3, id: idProp, ...rest }, ref,
) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className} labelClassName={labelClassName}>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(INPUT_BASE, 'resize-y rounded-inner px-3.5 py-3 text-sm leading-5')}
        {...rest}
      />
    </FieldShell>
  );
});

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: ReactNode;
  error?: string;
  options: { value: string; label: string }[];
  density?: Density;
  labelClassName?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, error, options, density = 'staff', className, labelClassName, id: idProp, ...rest }, ref,
) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <FieldShell id={id} label={label} error={error} className={className} labelClassName={labelClassName}>
      <div className="relative">
        <select
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          className={cn(INPUT_BASE, 'appearance-none rounded-full pr-10 pl-[18px]', density === 'patient' ? 'h-[52px] text-base' : 'h-11 text-[15px]')}
          {...rest}
        >
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={16} strokeWidth={1.8} aria-hidden="true" className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-ink-muted" />
      </div>
    </FieldShell>
  );
});

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ label, error, className, ...rest }, ref) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-ink">
        <input ref={ref} type="checkbox" className="size-[18px] shrink-0 accent-ink focus-visible:ring-2 focus-visible:ring-accent" {...rest} />
        {label}
      </label>
      {error && <span role="alert" className="text-[13px] font-medium text-critical-ink">{error}</span>}
    </div>
  );
});
