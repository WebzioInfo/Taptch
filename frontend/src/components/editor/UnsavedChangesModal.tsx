/**
 * UnsavedChangesModal - Route Navigation Guard Dialog
 * Alerts user when navigating away from the studio with uncommitted edits.
 */

import React from 'react';
import { AlertTriangle, Save, Trash2, X } from 'lucide-react';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onSaveAndExit: () => Promise<void>;
  onDiscardAndExit: () => void;
  onCancel: () => void;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  onSaveAndExit,
  onDiscardAndExit,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="relative w-full max-w-md bg-[#0A0A0C] border border-[#23232A] rounded-2xl shadow-2xl p-6 flex flex-col text-white">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Unsaved Changes</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              You have uncommitted customizations on your NFC card.
            </p>
          </div>
        </div>

        <p className="text-xs text-neutral-300 mb-6 bg-[#121216] p-3 rounded-xl border border-[#23232A]">
          Leaving without saving will discard your recent text, layout, and graphic customizations.
        </p>

        <div className="flex flex-col space-y-2">
          <button
            onClick={onSaveAndExit}
            className="w-full py-2.5 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#E5C058] text-black text-xs font-bold flex items-center justify-center space-x-2 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Save & Exit</span>
          </button>

          <button
            onClick={onDiscardAndExit}
            className="w-full py-2.5 px-4 rounded-xl bg-[#18181D] hover:bg-[#23232A] border border-[#23232A] text-xs font-semibold text-rose-400 flex items-center justify-center space-x-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Discard & Exit</span>
          </button>

          <button
            onClick={onCancel}
            className="w-full py-2 px-4 rounded-xl bg-transparent hover:bg-[#121216] text-xs font-medium text-neutral-400 hover:text-white transition-colors"
          >
            Continue Editing
          </button>
        </div>
      </div>
    </div>
  );
};

