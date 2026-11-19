import React, { useState, useEffect } from 'react';
import { MousePointerClick, X } from 'lucide-react';
import { useEditorStore } from '../useEditorStore';
import { CanvasStudio } from '../CanvasStudio';
import { MobileStudioTopBar } from './MobileStudioTopBar';
import { MobileBottomTabBar, MobileTabId } from './MobileBottomTabBar';
import { MobileBottomSheet } from './MobileBottomSheet';
import { MobileInspectorSheet } from './MobileInspectorSheet';
import { MobileToolPanels } from './MobileToolPanels';
import { useIsTablet } from '../../../hooks/useMediaQuery';

interface MobileStudioShellProps {
  product?: any;
  selectedVariant?: any;
  templates?: any[];
  onOpenPreview: () => void;
  onOpenExport: () => void;
  onResetTemplate?: () => void;
  onApplyTemplate?: (template: any) => void;
}

export const MobileStudioShell: React.FC<MobileStudioShellProps> = ({
  product,
  selectedVariant,
  templates = [],
  onOpenPreview,
  onOpenExport,
  onResetTemplate,
  onApplyTemplate,
}) => {
  const isTablet = useIsTablet();
  const { selectedObjectId } = useEditorStore();

  const [activeTab, setActiveTab] = useState<MobileTabId | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Automatically open inspector when user selects an object on the canvas
  useEffect(() => {
    if (selectedObjectId) {
      // Close tool tab sheet if open to keep canvas focused
      setActiveTab(null);
      setIsInspectorOpen(true);
    } else {
      setIsInspectorOpen(false);
    }
  }, [selectedObjectId]);

  const handleSelectTab = (tab: MobileTabId) => {
    // If clicking same tab, toggle closed
    if (activeTab === tab) {
      setActiveTab(null);
    } else {
      setActiveTab(tab);
      // Close inspector if open so sheet takes focus
      setIsInspectorOpen(false);
    }
  };

  const getTabTitle = (tab: MobileTabId): string => {
    switch (tab) {
      case 'templates':
        return 'Card Layouts';
      case 'text':
        return 'Typography & Fonts';
      case 'uploads':
        return 'Media & Logos';
      case 'background':
        return 'Surface Colors';
      case 'elements':
        return 'Vector Shapes';
      case 'artwork':
        return 'Artwork & Icons';
      case 'layers':
        return 'Canvas Layers';
      default:
        return 'Studio Tool';
    }
  };

  return (
    <div
      data-theme="dark"
      className="h-dvh w-full flex flex-col bg-[var(--bg-page)] text-[var(--ink)] font-body overflow-x-hidden overflow-y-hidden select-none relative"
    >
      {/* 1. Compact Sticky Top Bar (56px) */}
      <MobileStudioTopBar
        product={product}
        selectedVariant={selectedVariant}
        onOpenPreview={onOpenPreview}
        onOpenExport={onOpenExport}
        onResetTemplate={onResetTemplate}
      />

      {/* 2. Main Canvas Viewport (Auto-scaled, centered) */}
      <main className="flex-1 relative flex flex-col items-center justify-center bg-[var(--bg-page)] overflow-hidden pb-16">
        <div className="w-full h-full flex items-center justify-center relative p-3 sm:p-4">
          <CanvasStudio product={product} />

          {/* Floating Hint Chip when Nothing is Selected */}
          {!selectedObjectId && !activeTab && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-surface)]/90 backdrop-blur-md border border-[var(--border)] shadow-md text-[11px] font-mono text-[var(--ink-muted)] pointer-events-none animate-in fade-in duration-300">
              <MousePointerClick className="w-3.5 h-3.5 text-[var(--accent)] animate-pulse" />
              <span>Tap an element to edit</span>
            </div>
          )}
        </div>

        {/* Tablet Slide-Over Left Drawer for Tools (768px-1023px) */}
        {isTablet && activeTab && (
          <aside className="fixed top-14 left-0 bottom-0 w-[320px] bg-[var(--bg-surface)] border-r border-[var(--border)] z-30 shadow-2xl flex flex-col p-4 overflow-y-auto animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="font-head text-xs font-semibold uppercase tracking-wider text-[var(--ink)]">
                {getTabTitle(activeTab)}
              </h3>
              <button
                onClick={() => setActiveTab(null)}
                className="w-10 h-10 flex items-center justify-center rounded text-[var(--ink-muted)] hover:text-[var(--ink)]"
                aria-label="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="pt-3">
              <MobileToolPanels
                activeTab={activeTab}
                templates={templates}
                product={product}
                onApplyTemplate={onApplyTemplate}
                onClose={() => setActiveTab(null)}
              />
            </div>
          </aside>
        )}

        {/* Tablet Slide-Over Right Drawer for Inspector (768px-1023px) */}
        {isTablet && isInspectorOpen && selectedObjectId && (
          <MobileInspectorSheet
            isOpen={isInspectorOpen}
            onClose={() => setIsInspectorOpen(false)}
            isTabletDrawer={true}
          />
        )}
      </main>

      {/* 3. Phone Tool Bottom Sheet (< 768px) */}
      {!isTablet && activeTab && (
        <MobileBottomSheet
          isOpen={!!activeTab}
          onClose={() => setActiveTab(null)}
          title={getTabTitle(activeTab)}
        >
          <MobileToolPanels
            activeTab={activeTab}
            templates={templates}
            product={product}
            onApplyTemplate={onApplyTemplate}
            onClose={() => setActiveTab(null)}
          />
        </MobileBottomSheet>
      )}

      {/* 4. Phone Inspector Bottom Sheet (< 768px) */}
      {!isTablet && isInspectorOpen && selectedObjectId && (
        <MobileInspectorSheet
          isOpen={isInspectorOpen}
          onClose={() => setIsInspectorOpen(false)}
          isTabletDrawer={false}
        />
      )}

      {/* 5. Fixed Bottom Tab Bar (64px + safe-area) */}
      <MobileBottomTabBar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />
    </div>
  );
};
