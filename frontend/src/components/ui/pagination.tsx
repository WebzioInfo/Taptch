import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  className,
  ...props
}: PaginationProps) {
  if (totalPages <= 1 && !totalItems) return null;

  const startItem = totalItems && pageSize ? (currentPage - 1) * pageSize + 1 : undefined;
  const endItem =
    totalItems && pageSize
      ? Math.min(currentPage * pageSize, totalItems)
      : undefined;

  return (
    <div
      className={cn(
        'flex items-center justify-between border-t border-slate-100 pt-3 px-1 text-xs text-slate-500',
        className
      )}
      {...props}
    >
      <div>
        {totalItems !== undefined && startItem !== undefined && endItem !== undefined ? (
          <span>
            Showing <strong className="font-semibold text-slate-700">{startItem}</strong> to{' '}
            <strong className="font-semibold text-slate-700">{endItem}</strong> of{' '}
            <strong className="font-semibold text-slate-700">{totalItems}</strong> entries
          </span>
        ) : (
          <span>
            Page <strong className="font-semibold text-slate-700">{currentPage}</strong> of{' '}
            <strong className="font-semibold text-slate-700">{totalPages}</strong>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="h-8 px-2.5 text-xs font-medium"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
          <span>Previous</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="h-8 px-2.5 text-xs font-medium"
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight className="h-3.5 w-3.5 ml-1" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

