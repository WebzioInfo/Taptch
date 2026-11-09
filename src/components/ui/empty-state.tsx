import * as React from 'react';
import Link from 'next/link';
import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  actionNode?: React.ReactNode;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  actionNode,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12',
        className
      )}
      {...props}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3.5">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4 leading-relaxed">
          {description}
        </p>
      )}
      {actionNode ? (
        actionNode
      ) : actionHref && actionLabel ? (
        <Link href={actionHref}>
          <Button size="sm" className="mt-2 text-xs font-medium">
            {actionLabel}
          </Button>
        </Link>
      ) : actionLabel && onAction ? (
        <Button size="sm" onClick={onAction} className="mt-2 text-xs font-medium">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

