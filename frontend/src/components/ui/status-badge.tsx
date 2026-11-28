import * as React from 'react';
import { cn } from '@/lib/utils';

export type StatusType =
  | 'active'
  | 'delivered'
  | 'published'
  | 'paid'
  | 'resolved'
  | 'success'
  | 'pending'
  | 'processing'
  | 'in_progress'
  | 'open'
  | 'shipped'
  | 'warning'
  | 'blocked'
  | 'suspended'
  | 'failed'
  | 'cancelled'
  | 'revoked'
  | 'error'
  | 'inactive'
  | 'draft'
  | 'closed'
  | 'unclaimed'
  | 'unpaid'
  | string;

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusType;
  label?: string;
  dot?: boolean;
}

  const GREEN_STYLE = {
    bg: 'bg-[var(--success-bg)]',
    text: 'text-[var(--success)]',
    border: 'border-[var(--success-border)]',
    dotColor: 'bg-[var(--success)]',
  };

  const AMBER_STYLE = {
    bg: 'bg-[var(--warning-bg)]',
    text: 'text-[var(--warning)]',
    border: 'border-[var(--warning-border)]',
    dotColor: 'bg-[var(--warning)]',
  };

  const RED_STYLE = {
    bg: 'bg-[var(--danger-bg)]',
    text: 'text-[var(--danger-text)]',
    border: 'border-[var(--danger-border)]',
    dotColor: 'bg-[var(--danger)]',
  };

  const GREY_STYLE = {
    bg: 'bg-[var(--neutral-bg)]',
    text: 'text-[var(--neutral-text)]',
    border: 'border-[var(--neutral-border)]',
    dotColor: 'bg-[var(--ink-subtle)]',
  };

  const STATUS_MAP: Record<string, typeof GREEN_STYLE & { defaultLabel: string } > = {
    active: { ...GREEN_STYLE, defaultLabel: 'Active' },
    delivered: { ...GREEN_STYLE, defaultLabel: 'Delivered' },
    published: { ...GREEN_STYLE, defaultLabel: 'Published' },
    paid: { ...GREEN_STYLE, defaultLabel: 'Paid' },
    cod_collected: { ...GREEN_STYLE, defaultLabel: 'Paid' },
    waived: { ...GREEN_STYLE, defaultLabel: 'Waived' },
    resolved: { ...GREEN_STYLE, defaultLabel: 'Resolved' },
    success: { ...GREEN_STYLE, defaultLabel: 'Success' },

    pending: { ...AMBER_STYLE, defaultLabel: 'Pending' },
    payment_pending: { ...AMBER_STYLE, defaultLabel: 'Payment Pending' },
    cod_pending: { ...AMBER_STYLE, defaultLabel: 'COD Pending' },
    order_placed: { ...AMBER_STYLE, defaultLabel: 'Placed' },
    order_confirmed: { ...AMBER_STYLE, defaultLabel: 'Confirmed' },
    design_review: { ...AMBER_STYLE, defaultLabel: 'Design Review' },
    card_production: { ...AMBER_STYLE, defaultLabel: 'Processing' },
    processing: { ...AMBER_STYLE, defaultLabel: 'Processing' },
    card_ready: { ...AMBER_STYLE, defaultLabel: 'Ready' },
    dispatched: { ...AMBER_STYLE, defaultLabel: 'Shipped' },
    shipped: { ...AMBER_STYLE, defaultLabel: 'Shipped' },
    in_transit: { ...AMBER_STYLE, defaultLabel: 'In Transit' },
    out_for_delivery: { ...AMBER_STYLE, defaultLabel: 'Out for Delivery' },
    in_progress: { ...AMBER_STYLE, defaultLabel: 'In Progress' },
    open: { ...AMBER_STYLE, defaultLabel: 'Open' },
    warning: { ...AMBER_STYLE, defaultLabel: 'Warning' },

    blocked: { ...RED_STYLE, defaultLabel: 'Blocked' },
    suspended: { ...RED_STYLE, defaultLabel: 'Blocked' },
    failed: { ...RED_STYLE, defaultLabel: 'Failed' },
    cancelled: { ...RED_STYLE, defaultLabel: 'Cancelled' },
    refunded: { ...RED_STYLE, defaultLabel: 'Refunded' },
    revoked: { ...RED_STYLE, defaultLabel: 'Revoked' },
    lost: { ...RED_STYLE, defaultLabel: 'Lost' },
    error: { ...RED_STYLE, defaultLabel: 'Error' },

    inactive: { ...GREY_STYLE, defaultLabel: 'Inactive' },
    deactivated: { ...GREY_STYLE, defaultLabel: 'Inactive' },
    draft: { ...GREY_STYLE, defaultLabel: 'Draft' },
    closed: { ...GREY_STYLE, defaultLabel: 'Closed' },
    unclaimed: { ...GREY_STYLE, defaultLabel: 'Unclaimed' },
    unpaid: { ...GREY_STYLE, defaultLabel: 'Unpaid' },
  };

export function StatusBadge({
  status,
  label,
  dot = true,
  className,
  ...props
}: StatusBadgeProps) {
    const normalized = (status || '').toLowerCase();
    const cfg = STATUS_MAP[normalized] || {
      ...GREY_STYLE,
      defaultLabel: status || 'Unknown',
    };

    return(
    <span
      className = {
        cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap',
        cfg.bg,
        cfg.text,
        cfg.border,
        className,
      )
  }
  {...props }
    >
{ dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dotColor)} /> }
<span>{label || cfg.defaultLabel}</span>
    </span >
  );
}
