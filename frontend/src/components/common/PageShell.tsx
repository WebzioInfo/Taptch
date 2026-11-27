import React from 'react';
import { cn } from '../../lib/utils';

export interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Shared full-width page container used across authenticated and catalogue views.
 * Removes restrictive centered max-width wrappers so content expands cleanly
 * across desktop, tablet, and mobile viewports with consistent padding.
 */
export function PageShell({ children, className }: PageShellProps) {
  return (
    <div
      className={cn(
        'w-full min-h-full px-4 sm:px-6 lg:px-8 py-5 sm:py-6 bg-[#F8F9FB] text-[#171717] font-body space-y-6',
        className,
      )}
    >
      {children}
    </div>
  );
}
