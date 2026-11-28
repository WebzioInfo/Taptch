'use client';

import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronLeft,
  ChevronRight,
  Inbox,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ColumnDef<T> {
  key: string;
  header: React.ReactNode;
  render?: (item: T) => React.ReactNode;
  mobileRender?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

export interface DataTableFilter {
  key: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  loadingRows?: number;
  emptyState?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
  keyExtractor: (item: T) => string;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (columnKey: string) => void;
  onRowClick?: (item: T) => void;
  rowActions?: (item: T) => React.ReactNode;
  mobileCardRender?: (item: T, actions?: React.ReactNode) => React.ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: DataTableFilter[];
  toolbarExtra?: React.ReactNode;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  loadingRows = 5,
  emptyState,
  emptyTitle = 'No records found',
  emptyDescription = 'There are currently no items matching your criteria.',
  emptyIcon,
  emptyAction,
  keyExtractor,
  sortColumn,
  sortDirection,
  onSort,
  onRowClick,
  rowActions,
  mobileCardRender,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters,
  toolbarExtra,
  page,
  pageSize = 20,
  total,
  onPageChange,
  className,
}: DataTableProps<T>) {
  const [filterSheetOpen, setFilterSheetOpen] = React.useState(false);

  const hasFilters = Boolean(filters && filters.length > 0);
  const activeFilterCount = (filters || []).filter((f) => f.value !== 'ALL' && f.value !== '').length;
  const hasToolbar = Boolean(onSearchChange || hasFilters || toolbarExtra);

  const allColumns: ColumnDef<T>[] = rowActions
    ? [
        ...columns,
  {
    key: '__actions__',
    header: 'Actions',
    headerClassName: 'text-right',
    className: 'text-right',
    render: (item) => (
      <div
        className="inline-flex items-center justify-end gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        {rowActions(item)}
      </div>
    ),
  },
      ]
    : columns;

  const totalItems = total ?? data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const showPagination = Boolean(onPageChange && page !== undefined);

  return (
    <div className={cn('space-y-3', className)}>
      {hasToolbar && (
          <div className="rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border)] p-3 flex flex-wrap items-center gap-2.5">
            {onSearchChange && (
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-[var(--ink-subtle)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchValue ?? ''}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full min-h-[44px] md:min-h-[38px] pl-9 pr-3 py-2 text-xs bg-[var(--bg-surface)] text-[var(--ink)] placeholder:text-[var(--ink-subtle)] border border-[var(--border-strong)] rounded-[8px] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
          )}

          {/* Desktop Inline Filters */ }
          { hasFilters && (
                        <div className="hidden md:flex flex-wrap items-center gap-2">
                          {filters!.map((f) => (
                            <select
                              key={f.key}
                              aria-label={f.label || f.key}
                              value={f.value}
                              onChange={(e) => f.onChange(e.target.value)}
                              className="min-h-[38px] px-3 py-2 text-xs bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px] focus:outline-none focus:border-[var(--accent)]"
                            >
                              {f.options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          ))}
                  </div>
                )}

                {/* Mobile Filters Button -> Bottom Sheet */}
                {hasFilters && (
                  <button
                    type="button"
                    onClick={() => setFilterSheetOpen(true)}
                    className="md:hidden min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-[8px] border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--ink)] hover:bg-[var(--bg-raised)]"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</span>
                  </button>
                )}

                {toolbarExtra}
              </div>
            )}

            {/* Mobile Filter Bottom Sheet */}
            {filterSheetOpen && hasFilters && (
              <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
                <div
                  className="fixed inset-0 bg-black/40"
                  onClick={() => setFilterSheetOpen(false)}
                />
                <div className="relative z-10 bg-[var(--bg-surface)] rounded-t-[16px] border-t border-[var(--border)] p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[var(--ink)]">Filters</h3>
                    <button
                      type="button"
                      onClick={() => setFilterSheetOpen(false)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--ink-muted)]"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {filters!.map((f) => (
                      <div key={f.key}>
                        <label className="block text-xs font-semibold text-[var(--ink-muted)] mb-1">
                          {f.label || f.key}
                        </label>
                        <select
                          value={f.value}
                          onChange={(e) => f.onChange(e.target.value)}
                          className="w-full min-h-[44px] px-3 py-2 text-xs bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                        >
                          {f.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setFilterSheetOpen(false)}
                    className="w-full min-h-[44px] rounded-[8px] bg-[var(--accent)] text-white text-sm font-semibold"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}

            {!loading && data.length === 0 ? (
              emptyState ? (
                <div className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] p-8 text-center">
                  {emptyState}
                </div>
              ) : (
                <div className="p-8 sm:p-12 text-center rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] space-y-4">
                  <div className="w-14 h-14 rounded-full bg-[var(--accent-tint)] border border-[var(--accent-border)] flex items-center justify-center mx-auto text-[var(--accent-text)]">
                    {emptyIcon || <Inbox className="w-7 h-7" />}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-[var(--ink)]">{emptyTitle}</h3>
                    <p className="text-xs text-[var(--ink-muted)] max-w-xs mx-auto">{emptyDescription}</p>
                  </div>
                  {emptyAction && <div className="pt-1">{emptyAction}</div>}
                </div>
              )
            ) : (
                          <>
                            {/* Mobile Stacked Cards (< md) */}
                            <div className="md:hidden space-y-2.5">
                              {loading
                                ? Array.from({ length: Math.min(3, loadingRows) }).map((_, idx) => (
                                  <div
                                    key={`mob-skel-${idx}`}
                                    className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-2.5 animate-pulse"
                                  >
                                    <Skeleton className="h-4 w-2/3" />
                                    <Skeleton className="h-3 w-1/2" />
                                    <Skeleton className="h-3 w-1/3" />
                                  </div>
                                ))
                                : data.map((item) => {
                                  const key = keyExtractor(item);
                                  const actionsNode = rowActions ? (
                                    <div
                                      className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-[var(--border)]"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {rowActions(item)}
                                    </div>
                                  ) : null;

                                  if (mobileCardRender) {
                                    return (
                      <div
                        key={key}
                        onClick={onRowClick ? () => onRowClick(item) : undefined}
                        className={cn(
                          'rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-2.5',
                          onRowClick && 'cursor-pointer',
                        )}
                      >
                        { mobileCardRender(item, actionsNode) }
                      </div>
                            );
                        }

                  return (
                      <div
                        key={key}
                        onClick={onRowClick ? () => onRowClick(item) : undefined}
                        className={cn(
                          'rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-2',
                          onRowClick && 'cursor-pointer',
                        )}
                      >
                        {columns.map((col) => (
                          <div key={col.key} className="flex items-start justify-between gap-3 text-xs">
                            <span className="font-medium text-[var(--ink-muted)] shrink-0">
                              {col.header}
                            </span>
                            <div className="text-right text-[var(--ink)] min-w-0">
                              {col.mobileRender
                                ? col.mobileRender(item)
                                : col.render
                                  ? col.render(item)
                                  : ((item as Record<string, unknown>)[col.key] as React.ReactNode)}
                            </div>
                          </div>
                        ))}
                        {actionsNode}
                      </div>
                      );
                })}
                    </div>

                    {/* Desktop Table (>= md) */}
                    <div className="hidden md:block w-full overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)]">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-[var(--border)] bg-[var(--bg-raised)]">
                              {allColumns.map((col) => {
                                const isSorted = sortColumn === col.key;
                                return (
                        <th
                          key={col.key}
                          scope="col"
                          className={cn(
                            'py-3 px-4 font-semibold text-[var(--ink-muted)] select-none whitespace-nowrap',
                            col.headerClassName,
                          )}
                        >
                          {col.sortable && onSort ? (
                            <button
                              type="button"
                              onClick={() => onSort(col.key)}
                              className="inline-flex items-center gap-1 hover:text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] rounded px-1 -ml-1 transition-colors"
                            >
                              <span>{col.header}</span>
                              {isSorted ? (
                                sortDirection === 'asc' ? (
                                  <ArrowUp className="h-3.5 w-3.5 text-[var(--accent-text)]" />
                                ) : (
                                  <ArrowDown className="h-3.5 w-3.5 text-[var(--accent-text)]" />
                                )
                              ) : (
                                <ArrowUpDown className="h-3 w-3 text-[var(--ink-subtle)] opacity-70" />
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
                          <tbody className="divide-y divide-[var(--border)]">
                            {loading
                              ? Array.from({ length: loadingRows }).map((_, rIdx) => (
                                <tr key={`skeleton-${rIdx}`} className="animate-pulse">
                                  {allColumns.map((_, cIdx) => (
                                    <td key={`skeleton-cell-${cIdx}`} className="py-3 px-4">
                                      <Skeleton className="h-4 w-3/4" />
                                    </td>
                                  ))}
                                </tr>
                        ))
                    : data.map((item) => {
                        const key = keyExtractor(item);
                        return (
                        <tr
                          key={key}
                          onClick={onRowClick ? () => onRowClick(item) : undefined}
                          className={cn(
                            'hover:bg-[var(--bg-raised)]/70 transition-colors',
                            onRowClick && 'cursor-pointer',
                          )}
                        >
                          {allColumns.map((col) => (
                            <td
                              key={`${key}-${col.key}`}
                              className={cn('py-3 px-4 text-[var(--ink)] align-middle', col.className)}
                            >
                              {col.render
                                ? col.render(item)
                                : ((item as Record<string, unknown>)[col.key] as React.ReactNode)}
                            </td>
                          ))}
                        </tr>
                        );
                      })}
                      </tbody>
                  </table>
                </div>
              </div>

          {showPagination && (
                <div className="rounded-[12px] px-4 py-3 border border-[var(--border)] bg-[var(--bg-surface)] flex items-center justify-between text-xs text-[var(--ink-muted)]">
                  <span>
                    Page {page} of {totalPages} · {totalItems} total
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={(page ?? 1) <= 1}
                      onClick={() => onPageChange?.(Math.max(1, (page ?? 1) - 1))}
                      className="min-h-[44px] md:min-h-[34px] inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--ink)] hover:bg-[var(--bg-raised)] disabled:opacity-40 disabled:pointer-events-none font-medium"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>
                    <button
                      type="button"
                      disabled={(page ?? 1) >= totalPages}
                      onClick={() => onPageChange?.(Math.min(totalPages, (page ?? 1) + 1))}
                      className="min-h-[44px] md:min-h-[34px] inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--ink)] hover:bg-[var(--bg-raised)] disabled:opacity-40 disabled:pointer-events-none font-medium"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
          )}
        </>
      )}
        </div>
      );
}
