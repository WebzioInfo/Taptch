import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-[var(--radius-sm)] border px-2 py-0.5 font-mono text-[11px] font-medium tracking-[0.04em] uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--ink)]',
        secondary:
          'border-transparent bg-[var(--bg-raised)] text-[var(--ink-muted)]',
        destructive:
          'border-transparent bg-[var(--danger)]/15 text-[var(--danger)]',
        outline:
          'border-[var(--border)] text-[var(--ink)] bg-transparent',
        success:
          'border-transparent bg-[var(--success)]/15 text-[var(--success)]',
        brand:
          'border-transparent bg-[var(--accent)]/15 text-[var(--accent-text)] font-semibold',
        gold:
          'border-transparent bg-[var(--accent)]/15 text-[var(--accent-text)]',
        warning:
          'border-transparent bg-[var(--warning)]/15 text-[var(--warning)]',
        info:
          'border-transparent bg-[var(--info)]/15 text-[var(--info)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
