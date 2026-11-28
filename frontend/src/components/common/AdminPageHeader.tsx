import React from 'react';
import { cn } from '@/lib/utils';

export interface AdminPageHeaderProps {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Unified page header matching the "My Orders" pattern:
 * title, subtitle, and a primary action button on the right.
 */
export function AdminPageHeader({ title, subtitle, action, className }: AdminPageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border)]',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-[20px] font-bold text-[var(--ink)] tracking-tight leading-tight">
          {title}
        </h1>
        <p className="text-[13px] text-[var(--ink-muted)] mt-0.5">{subtitle}</p>
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
}
