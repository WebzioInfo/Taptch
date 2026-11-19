import React, { useRef, useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  heightClass?: string;
  headerAction?: React.ReactNode;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  heightClass = 'h-[48dvh] max-h-[48dvh] sm:h-[42dvh] sm:max-h-[42dvh]',
  headerAction,
}) => {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef<number>(0);
  const currentTranslateY = useRef<number>(0);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setDragOffset(0);
      setIsDragging(false);
    }
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (deltaY > 0) {
      // Dragging downward
      setDragOffset(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset > 90) {
      // Threshold passed: dismiss
      onClose();
    }
    setDragOffset(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end pointer-events-none select-none">
      {/* Semi-transparent backdrop to focus tool interactions */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto transition-opacity duration-200"
      />

      {/* Sheet Surface */}
      <div
        ref={sheetRef}
        style={{
          transform: `translateY(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`relative w-full ${heightClass} bg-[var(--bg-surface)] border-t border-[var(--border)] rounded-t-2xl flex flex-col shadow-2xl pointer-events-auto z-10 overflow-hidden mb-16`}
      >
        {/* Drag Handle Bar */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full pt-2.5 pb-1 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
        >
          <div className="w-10 h-1.5 rounded-full bg-[var(--border-strong)]" />
        </div>

        {/* Sheet Header */}
        <div className="px-4 py-2 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2 min-w-0">
            <h3 className="font-head text-xs font-semibold uppercase tracking-wider text-[var(--ink)] truncate">
              {title}
            </h3>
            {headerAction}
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 -mr-2 flex items-center justify-center rounded-full text-[var(--ink-muted)] hover:text-[var(--ink)] active:bg-[var(--bg-raised)] transition-colors"
            aria-label="Close sheet"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sheet Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 text-[var(--ink)] overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
};
