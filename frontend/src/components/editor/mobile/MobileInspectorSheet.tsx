import React, { useState } from 'react';
import { fabric } from 'fabric';
import {
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Lock,
  Unlock,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  X,
  Palette,
  Sliders,
} from 'lucide-react';
import { useEditorStore, SelectedObjectProperties } from '../useEditorStore';
import { FONT_CATALOG, loadGoogleFont } from '../../../utils/fontLoader';
import { generateObjectId } from '../../../utils/canvasJson';

const COLOR_PRESETS = [
  '#FFFFFF',
  '#D4AF37', // Gold
  '#FF6A00', // Orange
  '#0A0A0C', // Deep Obsidian
  '#18181D', // Slate
  '#2E2E38', // Charcoal
  '#E9E9E6', // Platinum
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#EF4444', // Red
];

interface MobileInspectorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  isTabletDrawer?: boolean;
  selectedObjectId?: string | null;
  selectedObjectProps?: SelectedObjectProperties | null;
}

export const MobileInspectorSheet: React.FC<MobileInspectorSheetProps> = ({
  isOpen,
  onClose,
  isTabletDrawer = false,
  selectedObjectId: propObjectId,
  selectedObjectProps: propObjectProps,
}) => {
  const {
    canvas,
    selectedObjectId: storeObjectId,
    selectedObjectProps: storeObjectProps,
    updateSelectedProp,
    syncSelectedProps,
    pushHistory,
  } = useEditorStore();

  const selectedObjectId = propObjectId ?? storeObjectId;
  const selectedObjectProps = propObjectProps ?? storeObjectProps;

  const [activeTab, setActiveTab] = useState<'style' | 'arrange'>('style');

  if (!isOpen || !selectedObjectId || !selectedObjectProps) return null;

  const isText =
    selectedObjectProps.type === 'text' ||
    selectedObjectProps.type === 'i-text' ||
    selectedObjectProps.type === 'textbox';

  const handleDuplicate = () => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (!activeObj) return;

    activeObj.clone((cloned: any) => {
      cloned.set({
        left: (activeObj.left || 0) + 20,
        top: (activeObj.top || 0) + 20,
      });
      cloned.id = generateObjectId(activeObj.type || 'layer');
      cloned.name = `${(activeObj as any).name || 'Layer'} (Copy)`;
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.requestRenderAll();
      syncSelectedProps();
      pushHistory();
    });
  };

  const handleDelete = () => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (!activeObj) return;

    canvas.remove(activeObj);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    syncSelectedProps();
    pushHistory();
    onClose();
  };

  const handleToggleLock = () => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject() as any;
    if (!activeObj) return;

    const isLocked = !activeObj.isLocked;
    activeObj.set({
      isLocked,
      lockMovementX: isLocked,
      lockMovementY: isLocked,
      lockRotation: isLocked,
      lockScalingX: isLocked,
      lockScalingY: isLocked,
      hasControls: !isLocked,
    });
    canvas.requestRenderAll();
    syncSelectedProps();
    pushHistory();
  };

  const handleReorder = (direction: 'up' | 'down') => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (!activeObj) return;

    if (direction === 'up') {
      canvas.bringForward(activeObj);
    } else {
      canvas.sendBackwards(activeObj);
    }
    canvas.requestRenderAll();
    pushHistory();
  };

  const content = (
    <div className="space-y-4">
      {/* Quick Action Toolbar */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleReorder('up')}
            className="w-11 h-11 rounded-[var(--radius-sm)] flex items-center justify-center bg-[var(--bg-raised)] active:bg-[var(--bg-surface)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
            title="Bring Forward"
            aria-label="Bring Forward"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleReorder('down')}
            className="w-11 h-11 rounded-[var(--radius-sm)] flex items-center justify-center bg-[var(--bg-raised)] active:bg-[var(--bg-surface)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
            title="Send Backward"
            aria-label="Send Backward"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            onClick={handleToggleLock}
            className="w-11 h-11 rounded-[var(--radius-sm)] flex items-center justify-center bg-[var(--bg-raised)] active:bg-[var(--bg-surface)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
            title={selectedObjectProps.isLocked ? 'Unlock' : 'Lock'}
            aria-label="Toggle Lock"
          >
            {selectedObjectProps.isLocked ? (
              <Lock className="w-4 h-4 text-[var(--warning)]" />
            ) : (
              <Unlock className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={handleDuplicate}
            className="w-11 h-11 rounded-[var(--radius-sm)] flex items-center justify-center bg-[var(--bg-raised)] active:bg-[var(--bg-surface)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
            title="Duplicate"
            aria-label="Duplicate Element"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="w-11 h-11 rounded-[var(--radius-sm)] flex items-center justify-center bg-[var(--bg-raised)] active:bg-[var(--bg-surface)] text-[var(--ink-muted)] hover:text-[var(--danger)]"
            title="Delete"
            aria-label="Delete Element"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TEXT PROPERTIES */}
      {isText && (
        <div className="space-y-3.5">
          {/* Direct Text Editor */}
          <div>
            <label className="font-mono text-[11px] text-[var(--ink-muted)] uppercase tracking-wider block mb-1">
              Text Content
            </label>
            <textarea
              value={selectedObjectProps.text || ''}
              onChange={(e) => updateSelectedProp('text', e.target.value)}
              rows={2}
              className="w-full bg-[var(--bg-raised)] border border-[var(--border)] rounded-[var(--radius-sm)] p-2.5 text-[16px] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-body"
            />
          </div>

          {/* Font Family Selection */}
          <div>
            <label className="font-mono text-[11px] text-[var(--ink-muted)] uppercase tracking-wider block mb-1">
              Font Family
            </label>
            <select
              value={selectedObjectProps.fontFamily || 'Inter'}
              onChange={async (e) => {
                const font = e.target.value;
                await loadGoogleFont(font);
                updateSelectedProp('fontFamily', font);
              }}
              className="w-full h-11 bg-[var(--bg-raised)] border border-[var(--border)] rounded-[var(--radius-sm)] px-3 text-[16px] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            >
              {FONT_CATALOG.map((f) => (
                <option key={f.family} value={f.family}>
                  {f.family}
                </option>
              ))}
            </select>
          </div>

          {/* Size & Weight */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-mono text-[11px] text-[var(--ink-muted)] uppercase tracking-wider block mb-1">
                Size ({selectedObjectProps.fontSize || 24}px)
              </label>
              <input
                type="number"
                min={8}
                max={160}
                value={selectedObjectProps.fontSize || 24}
                onChange={(e) => updateSelectedProp('fontSize', parseInt(e.target.value) || 24)}
                className="w-full h-11 bg-[var(--bg-raised)] border border-[var(--border)] rounded-[var(--radius-sm)] px-3 text-[16px] font-mono text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="font-mono text-[11px] text-[var(--ink-muted)] uppercase tracking-wider block mb-1">
                Weight
              </label>
              <select
                value={String(selectedObjectProps.fontWeight || '400')}
                onChange={(e) => updateSelectedProp('fontWeight', e.target.value)}
                className="w-full h-11 bg-[var(--bg-raised)] border border-[var(--border)] rounded-[var(--radius-sm)] px-3 text-[16px] font-mono text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                <option value="400">Regular (400)</option>
                <option value="500">Medium (500)</option>
                <option value="600">Semibold (600)</option>
                <option value="700">Bold (700)</option>
              </select>
            </div>
          </div>

          {/* Formatting & Alignment Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {/* Alignment Row */}
            <div className="flex items-center bg-[var(--bg-raised)] p-0.5 rounded-[var(--radius-sm)] border border-[var(--border)] justify-around">
              {[
                { align: 'left', icon: AlignLeft },
                { align: 'center', icon: AlignCenter },
                { align: 'right', icon: AlignRight },
                { align: 'justify', icon: AlignJustify },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = (selectedObjectProps.textAlign || 'left') === item.align;
                return (
                  <button
                    key={item.align}
                    onClick={() => updateSelectedProp('textAlign', item.align)}
                    className={`w-10 h-10 flex items-center justify-center rounded-[var(--radius-sm)] ${
                      isActive ? 'bg-[var(--accent)] text-[var(--accent-ink)]' : 'text-[var(--ink-muted)]'
                    }`}
                    aria-label={`Align ${item.align}`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>

            {/* Bold / Italic / Underline */}
            <div className="flex items-center bg-[var(--bg-raised)] p-0.5 rounded-[var(--radius-sm)] border border-[var(--border)] justify-around">
              <button
                onClick={() =>
                  updateSelectedProp(
                    'fontWeight',
                    selectedObjectProps.fontWeight === 'bold' || selectedObjectProps.fontWeight === '700'
                      ? 'normal'
                      : 'bold'
                  )
                }
                className={`w-10 h-10 flex items-center justify-center rounded-[var(--radius-sm)] ${
                  selectedObjectProps.fontWeight === 'bold' || selectedObjectProps.fontWeight === '700'
                    ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                    : 'text-[var(--ink-muted)]'
                }`}
                aria-label="Toggle Bold"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  updateSelectedProp(
                    'fontStyle',
                    selectedObjectProps.fontStyle === 'italic' ? 'normal' : 'italic'
                  )
                }
                className={`w-10 h-10 flex items-center justify-center rounded-[var(--radius-sm)] ${
                  selectedObjectProps.fontStyle === 'italic'
                    ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                    : 'text-[var(--ink-muted)]'
                }`}
                aria-label="Toggle Italic"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                onClick={() => updateSelectedProp('underline', !selectedObjectProps.underline)}
                className={`w-10 h-10 flex items-center justify-center rounded-[var(--radius-sm)] ${
                  selectedObjectProps.underline
                    ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                    : 'text-[var(--ink-muted)]'
                }`}
                aria-label="Toggle Underline"
              >
                <Underline className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COLOR & FILL */}
      <div className="space-y-2">
        <label className="font-mono text-[11px] text-[var(--ink-muted)] uppercase tracking-wider block">
          Color / Fill
        </label>
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
          {COLOR_PRESETS.map((hex) => (
            <button
              key={hex}
              onClick={() => updateSelectedProp('fill', hex)}
              style={{ backgroundColor: hex }}
              className={`w-10 h-10 min-w-[40px] rounded-full border-2 transition-transform active:scale-95 flex-shrink-0 ${
                (selectedObjectProps.fill || '').toLowerCase() === hex.toLowerCase()
                  ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/40 scale-105'
                  : 'border-[var(--border-strong)]'
              }`}
              title={hex}
              aria-label={`Color ${hex}`}
            />
          ))}
          {/* Custom color picker */}
          <label className="w-10 h-10 min-w-[40px] rounded-full border border-[var(--border)] bg-[var(--bg-raised)] flex items-center justify-center cursor-pointer flex-shrink-0 relative overflow-hidden">
            <Palette className="w-4 h-4 text-[var(--ink-muted)]" />
            <input
              type="color"
              value={typeof selectedObjectProps.fill === 'string' ? selectedObjectProps.fill : '#FFFFFF'}
              onChange={(e) => updateSelectedProp('fill', e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>
        </div>
      </div>

      {/* OPACITY SLIDER */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between font-mono text-[11px] text-[var(--ink-muted)]">
          <span>Opacity</span>
          <span>{Math.round((selectedObjectProps.opacity ?? 1) * 100)}%</span>
        </div>
        <input
          type="range"
          min={0.05}
          max={1}
          step={0.05}
          value={selectedObjectProps.opacity ?? 1}
          onChange={(e) => updateSelectedProp('opacity', parseFloat(e.target.value))}
          className="w-full h-2 bg-[var(--bg-raised)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
        />
      </div>
    </div>
  );

  // Tablet Slide-Over Drawer Mode
  if (isTabletDrawer) {
    return (
      <aside className="fixed top-14 right-0 bottom-0 w-[300px] bg-[var(--bg-surface)] border-l border-[var(--border)] z-30 shadow-2xl flex flex-col p-4 overflow-y-auto animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="font-head text-xs font-semibold uppercase tracking-wider text-[var(--ink)]">
              {selectedObjectProps.name || selectedObjectProps.type || 'Inspector'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded text-[var(--ink-muted)] hover:text-[var(--ink)]"
            aria-label="Close Inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="pt-3">{content}</div>
      </aside>
    );
  }

  // Mobile Bottom Sheet Mode
  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end pointer-events-none select-none">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto transition-opacity"
      />
      <div className="relative w-full h-[52dvh] max-h-[52dvh] sm:h-[44dvh] sm:max-h-[44dvh] bg-[var(--bg-surface)] border-t border-[var(--border)] rounded-t-2xl flex flex-col shadow-2xl pointer-events-auto z-10 overflow-hidden mb-16">
        {/* Handle */}
        <div className="w-full pt-2.5 pb-1 flex flex-col items-center justify-center flex-shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-[var(--border-strong)]" />
        </div>

        {/* Header */}
        <div className="px-4 py-2 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2">
            <span className="font-head text-xs font-semibold uppercase tracking-wider text-[var(--ink)]">
              Edit {selectedObjectProps.type === 'i-text' || selectedObjectProps.type === 'text' ? 'Text' : 'Element'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 -mr-2 flex items-center justify-center rounded-full text-[var(--ink-muted)] hover:text-[var(--ink)]"
            aria-label="Close Inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 text-[var(--ink)] overscroll-contain">
          {content}
        </div>
      </div>
    </div>
  );
};
