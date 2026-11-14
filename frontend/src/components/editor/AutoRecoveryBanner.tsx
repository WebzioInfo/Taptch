/**
 * AutoRecoveryBanner - Local Crash Recovery Alert
 * Detects uncommitted local session drafts in localStorage and provides
 * one-click recovery of unsaved work.
 */

import React from 'react';
import { AlertCircle, RotateCcw, X } from 'lucide-react';

export interface RecoverySnapshot {
  productId: string;
  templateId?: string;
  designName?: string;
  frontJson: string;
  backJson: string;
  timestamp: number;
}

interface AutoRecoveryBannerProps {
  snapshot: RecoverySnapshot;
  onRestore: () => void;
  onDismiss: () => void;
}

export const AutoRecoveryBanner: React.FC<AutoRecoveryBannerProps> = ({
  snapshot,
  onRestore,
  onDismiss,
}) => {
  const timeFormatted = new Date(snapshot.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 max-w-lg w-full px-4 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center justify-between p-3 rounded-xl bg-[#18181D] border border-amber-500/40 text-white shadow-xl backdrop-blur-md">
        <div className="flex items-center space-x-2.5">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-white">Unsaved Session Recovered</p>
            <p className="text-neutral-400 text-[11px]">
              Found unsaved changes from {timeFormatted} for "{snapshot.designName || 'Card'}".
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onRestore}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#E5C058] text-black font-semibold text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore</span>
          </button>
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-[#23232A] transition-colors"
            title="Dismiss recovery"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

