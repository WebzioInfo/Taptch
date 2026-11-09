import * as React from 'react';
import { SearchInput } from '@/components/ui/search-input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  searchLoading?: boolean;
  filterControls?: React.ReactNode;
  activeFilterCount?: number;
  onResetFilters?: () => void;
  actionButton?: React.ReactNode;
}

export function FilterBar({
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  searchLoading = false,
  filterControls,
  activeFilterCount = 0,
  onResetFilters,
  actionButton,
  className,
  ...props
}: FilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs',
        className
      )}
      {...props}
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
        {onSearchChange && (
          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            loading={searchLoading}
            className="w-full sm:max-w-xs"
          />
        )}

        {filterControls && (
          <div className="flex flex-wrap items-center gap-2">
            {filterControls}
          </div>
        )}

        {activeFilterCount > 0 && onResetFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-8 px-2 text-xs text-slate-500 hover:text-slate-800"
          >
            <X className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
            <span>Reset filters ({activeFilterCount})</span>
          </Button>
        )}
      </div>

      {actionButton && (
        <div className="flex items-center justify-end shrink-0">
          {actionButton}
        </div>
      )}
    </div>
  );
}

