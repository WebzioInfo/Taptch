'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const isDestructive = variant === 'destructive';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white p-6 rounded-xl border border-slate-200 shadow-xl">
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                isDestructive ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
              }`}
            >
              {isDestructive ? (
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              ) : (
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              )}
            </div>
            <DialogTitle className="text-sm font-semibold text-slate-900">
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 leading-relaxed pt-1">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 flex flex-row justify-end gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => onOpenChange(false)}
            className="text-xs font-medium"
          >
            {cancelLabel}
          </Button>
          <LoadingButton
            type="button"
            variant={isDestructive ? 'destructive' : 'default'}
            size="sm"
            loading={loading}
            onClick={onConfirm}
            className="text-xs font-semibold"
          >
            {confirmLabel}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export interface DeleteDialogProps
  extends Omit<ConfirmDialogProps, 'variant' | 'confirmLabel'> {
  itemName?: string;
  confirmLabel?: string;
}

export function DeleteDialog({
  itemName,
  title,
  description,
  confirmLabel = 'Delete',
  ...props
}: DeleteDialogProps) {
  const finalTitle = title || (itemName ? `Delete ${itemName}?` : 'Confirm Deletion');
  const finalDesc =
    description ||
    (itemName
      ? `Are you sure you want to delete ${itemName}? This action cannot be undone.`
      : 'Are you sure you want to permanently delete this item? This action cannot be undone.');

  return (
    <ConfirmDialog
      {...props}
      title={finalTitle}
      description={finalDesc}
      variant="destructive"
      confirmLabel={confirmLabel}
    />
  );
}

