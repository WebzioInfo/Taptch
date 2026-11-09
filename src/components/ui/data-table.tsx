'use client';

import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ColumnDef<T> {
  key: string;
  header: React.ReactNode;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  loadingRows?: number;
  emptyState?: React.ReactNode;
  keyExtractor: (item: T) => string;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (columnKey: string) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  loadingRows = 5,
  emptyState,
  keyExtractor,
  sortColumn,
  sortDirection,
  onSort,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn('w-full overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-2xs', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/75">
              {columns.map((col) => {
                const isSorted = sortColumn === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={cn(
                      'py-3 px-4 font-semibold text-slate-700 select-none whitespace-nowrap',
                      col.headerClassName
                    )}
                  >
                    {col.sortable && onSort ? (
                      <button
                        type="button"
                        onClick={() => onSort(col.key)}
                        className="inline-flex items-center gap-1 hover:text-slate-900 focus:outline-none focus:ring-1 focus:ring-ring rounded px-1 -ml-1 transition-colors"
                      >
                        <span>{col.header}</span>
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5 text-blue-600" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: loadingRows }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`} className="animate-pulse">
                  {columns.map((col, cIdx) => (
                    <td key={`skeleton-cell-${cIdx}`} className="py-3 px-4">
                      <Skeleton className="h-4 w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 px-4 text-center">
                  {emptyState || (
                    <EmptyState
                      title="No records found"
                      description="There are currently no items matching your criteria."
                    />
                  )}
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const key = keyExtractor(item);
                return (
                  <tr
                    key={key}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    {columns.map((col) => (
                      <td
                        key={`${key}-${col.key}`}
                        className={cn('py-3 px-4 text-slate-700 align-middle', col.className)}
                      >
                        {col.render ? col.render(item) : ((item as Record<string, unknown>)[col.key] as React.ReactNode)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

