'use client';

import * as React from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  loading?: boolean;
  debounceMs?: number;
}

export function SearchInput({
  value,
  onChange,
  onClear,
  loading = false,
  debounceMs = 0,
  placeholder = 'Search...',
  className,
  ...props
}: SearchInputProps) {
  const [internalValue, setInternalValue] = React.useState(value);
  const [prevPropValue, setPrevPropValue] = React.useState(value);

  if (value !== prevPropValue) {
    setPrevPropValue(value);
    setInternalValue(value);
  }

  React.useEffect(() => {
    if (debounceMs <= 0) return;
    const timer = setTimeout(() => {
      onChange(internalValue);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [internalValue, debounceMs, onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInternalValue(val);
    if (debounceMs <= 0) {
      onChange(val);
    }
  };

  const handleClear = () => {
    setInternalValue('');
    onChange('');
    onClear?.();
  };

  return (
    <div className={cn('relative flex items-center w-full max-w-sm', className)}>
      <Search
        className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
        aria-hidden="true"
      />
      <input
        type="text"
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="flex h-9 w-full rounded-md border border-input bg-white pl-8 pr-8 py-1 text-xs shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      />
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
        ) : internalValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="p-0.5 rounded text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Clear search input"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

