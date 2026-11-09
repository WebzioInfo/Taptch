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
import { AlertCircle } from 'lucide-react';

export interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
  onKeepEditing?: () => void;
  title?: string;
  description?: string;
}

export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onDiscard,
  onKeepEditing,
  title = 'Unsaved changes',
  description = 'You have unsaved changes. If you leave this page, your modifications will be lost.',
}: UnsavedChangesDialogProps) {
  const handleStay = () => {
    onKeepEditing?.();
    onOpenChange(false);
  };

  const handleLeave = () => {
    onDiscard();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white p-6 rounded-xl border border-slate-200 shadow-xl">
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
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
            onClick={handleStay}
            className="text-xs font-medium"
          >
            Keep editing
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleLeave}
            className="text-xs font-semibold"
          >
            Discard changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

