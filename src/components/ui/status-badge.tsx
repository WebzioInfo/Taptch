import * as React from 'react';
import { cn } from '@/lib/utils';

export type StatusType =
  | 'active'
  | 'published'
  | 'draft'
  | 'pending'
  | 'suspended'
  | 'archived'
  | 'paid'
  | 'unpaid'
  | 'success'
  | 'error'
  | 'warning'
  | string;

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusType;
  label?: string;
  dot?: boolean;
}

const statusConfig: Record<
  string,
  { bg: string; text: string; border: string; dotColor: string; defaultLabel: string }
> = {
  active: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
    defaultLabel: 'Active',
  },
  published: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
    defaultLabel: 'Published',
  },
  success: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
    defaultLabel: 'Success',
  },
  draft: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dotColor: 'bg-slate-400',
    defaultLabel: 'Draft',
  },
  pending: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dotColor: 'bg-amber-500',
    defaultLabel: 'Pending',
  },
  warning: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dotColor: 'bg-amber-500',
    defaultLabel: 'Warning',
  },
  suspended: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dotColor: 'bg-red-500',
    defaultLabel: 'Suspended',
  },
  error: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dotColor: 'bg-red-500',
    defaultLabel: 'Error',
  },
  paid: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dotColor: 'bg-blue-500',
    defaultLabel: 'Paid',
  },
  unpaid: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dotColor: 'bg-slate-400',
    defaultLabel: 'Unpaid',
  },
};

export function StatusBadge({
  status,
  label,
  dot = true,
  className,
  ...props
}: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();
  const config = statusConfig[normalizedStatus] || {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dotColor: 'bg-slate-400',
    defaultLabel: status,
  };

  const displayLabel = label || config.defaultLabel;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border capitalize select-none',
        config.bg,
        config.text,
        config.border,
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full shrink-0', config.dotColor)}
          aria-hidden="true"
        />
      )}
      <span>{displayLabel}</span>
    </span>
  );
}

