import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'sm:max-w-[440px]',
  md: 'sm:max-w-[640px]',
  lg: 'sm:max-w-[880px]',
  xl: 'sm:max-w-[1080px]',
};

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  headerBadge?: React.ReactNode;
  size?: ModalSize;
  footer?: React.ReactNode;
  children: React.ReactNode;
  hasUnsavedChanges?: boolean;
  darkerBackdrop?: boolean;
  className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  headerBadge,
  size = 'md',
  footer,
  children,
  hasUnsavedChanges = false,
  darkerBackdrop = false,
  className,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const attemptClose = () => {
    if (hasUnsavedChanges) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  };

  // Lock body scroll & restore focus
  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus first focusable element inside modal
    const timer = setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      focusable?.focus();
    }, 10);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = prevOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [open]);

  // Esc key & focus trap
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        attemptClose();
        return;
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, hasUnsavedChanges]);

  if (!open) return null;

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Dimmed Backdrop */}
      <div
        className={cn(
          'fixed inset-0 transition-opacity duration-150 backdrop-blur-[2px]',
          darkerBackdrop ? 'bg-[#161616]/65' : 'bg-[#161616]/50',
        )}
        onClick={attemptClose}
      />

      {/* Modal Panel */}
      <div
        ref={panelRef}
        className={cn(
          'relative z-10 w-full sm:w-[calc(100%-32px)] bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl flex flex-col overflow-hidden transition-all duration-150 animate-in fade-in zoom-in-95',
          'h-[92vh] sm:h-auto max-h-[92vh] sm:max-h-[90vh] rounded-t-[16px] sm:rounded-[16px]',
          SIZE_CLASSES[size],
          className,
        )}
      >
        {/* Sticky Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-surface)] flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-[var(--ink)] truncate">{title}</h2>
              {headerBadge}
            </div>
            {subtitle && (
              <p className="text-xs text-[var(--ink-muted)] mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={attemptClose}
            aria-label="Close modal"
            className="min-w-[44px] min-h-[44px] -mr-2 -mt-1 flex items-center justify-center rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--bg-raised)] transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>

        {/* Sticky Footer */}
        {footer && (
          <div className="px-5 py-3.5 border-t border-[var(--border)] bg-[var(--bg-surface)] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 shrink-0">
            {footer}
          </div>
        )}

        {/* Unsaved Changes Confirmation Overlay */}
        {confirmDiscard && (
          <div className="absolute inset-0 z-20 bg-[#161616]/50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-[16px] bg-[var(--bg-surface)] border border-[var(--border)] p-5 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-[var(--ink)]">Discard unsaved changes?</h3>
              <p className="text-xs text-[var(--ink-muted)]">
                You have unsaved changes. Are you sure you want to close without saving?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDiscard(false)}
                  className="min-h-[40px] px-3.5 py-2 rounded-[8px] border border-[var(--border-strong)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--ink)]"
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDiscard(false);
                    onClose();
                  }}
                  className="min-h-[40px] px-3.5 py-2 rounded-[8px] bg-[var(--danger)] text-white text-xs font-semibold"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document === 'undefined') return content;
  return createPortal(content, document.body);
}
