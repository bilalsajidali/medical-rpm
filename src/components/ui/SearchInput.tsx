import { Search } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  'aria-label'?: string;
  /** subtle = bg-subtle + strong border (in cards); plain = white (page header) */
  tone?: 'subtle' | 'plain';
  className?: string;
  inputClassName?: string;
}

export function SearchInput({ value, onChange, placeholder, tone = 'subtle', className, inputClassName, ...rest }: SearchInputProps) {
  return (
    <label
      className={cn(
        'flex h-11 items-center gap-2 rounded-full border px-4 text-ink-muted focus-within:ring-2 focus-within:ring-accent',
        tone === 'subtle' ? 'border-border-strong bg-subtle' : 'border-border bg-surface',
        className,
      )}
    >
      <Search size={18} strokeWidth={1.8} aria-hidden="true" className="shrink-0" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={rest['aria-label'] ?? placeholder}
        className={cn('w-full min-w-0 border-none bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted', inputClassName)}
      />
    </label>
  );
}
