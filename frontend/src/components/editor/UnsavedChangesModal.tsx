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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 select-none">
          <div className="relative w-full max-w-md bg-white border border-[#E8E8E8] rounded-2xl shadow-2xl p-6 flex flex-col text-[#171717]">
            <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-[#171717] uppercase tracking-wider">Unsaved Changes</h3>
                    <p className="text-xs text-[#666666] mt-0.5">
                      You have uncommitted customizations on your NFC card.
                    </p>
                </div>
              </div>

                <p className="text-xs text-[#666666] mb-6 bg-[#F8F9FB] p-3 rounded-xl border border-[#E8E8E8]">
                  Leaving without saving will discard your recent text, layout, and graphic customizations.
                </p>

                <div className="flex flex-col space-y-2">
                  <button
                    onClick={onSaveAndExit}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#FF6A00] hover:bg-[#E85D00] text-white text-xs font-bold flex items-center justify-center space-x-2 transition-colors shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save &amp; Exit</span>
                  </button>

                  <button
                    onClick={onDiscardAndExit}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-600 flex items-center justify-center space-x-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Discard &amp; Exit</span>
                  </button>

                  <button
                    onClick={onCancel}
                    className="w-full py-2 px-4 rounded-xl bg-transparent hover:bg-[#F8F9FB] text-xs font-medium text-[#666666] hover:text-[#171717] transition-colors"
                  >
                    Continue Editing
                  </button>
                </div>
            </div>
          </div>
          );
};

