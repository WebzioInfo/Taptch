/**
 * EditorRightSidebar - Contextual Object Property Inspector
 * Provides real-time parameter editing for selected Fabric.js canvas elements:
 * - Typography (Text content, font, size, weight, alignment, spacing)
 * - Appearance (Fills, borders, opacity)
 * - Gradients (Linear & Radial gradients with direction stops)
 * - Drop Shadow Studio (Presets & manual blur/offset adjustments)
 * - Geometry & Transform (Coordinates, dimensions, rotation, alignment)
 */

import React, { useState } from 'react';
import { fabric } from 'fabric';
import {
  Type,
  Sliders,
  Sparkles,
  Move,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Lock,
  Unlock,
  Trash2,
  Copy,
  ChevronDown,
} from 'lucide-react';
import { useEditorStore } from './useEditorStore';
import { FONT_CATALOG, loadGoogleFont } from '../../utils/fontLoader';
import { generateObjectId } from '../../utils/canvasJson';

export const EditorRightSidebar: React.FC = () => {
  const {
    canvas,
    selectedObjectId,
    selectedObjectProps,
    updateSelectedProp,
    syncSelectedProps,
    pushHistory,
    activeSide,
  } = useEditorStore();

  const [activeSection, setActiveSection] = useState<'type' | 'appearance' | 'shadow' | 'transform'>('appearance');

  if (!selectedObjectId || !selectedObjectProps) {
    return (
          <aside className="w-72 border-l border-[var(--border)] bg-[var(--bg-surface)] p-6 flex flex-col items-center justify-center text-center select-none text-[var(--ink)] z-10 font-body">
            <div className="w-12 h-12 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--accent-text)] mb-3">
              <Move className="w-6 h-6" />
            </div>
              <h3 className="font-head text-xs font-medium text-[var(--ink)] uppercase tracking-[0.04em]">No Selection</h3>
              <p className="font-body text-[11px] text-[var(--ink-muted)] mt-1 max-w-[180px]">
                Select any text, icon, or shape on the {activeSide} canvas to inspect and modify properties.
              </p>
          </aside>
          );
  }

          const isText =
          selectedObjectProps.type === 'text' ||
          selectedObjectProps.type === 'i-text' ||
          selectedObjectProps.type === 'textbox';

          const isRect = selectedObjectProps.type === 'rect';

  // Apply Gradient
  const handleApplyGradient = (type: 'linear' | 'radial', color1: string, color2: string) => {
    if (!canvas) return;
          const activeObj = canvas.getActiveObject();
          if (!activeObj) return;

          const width = activeObj.width || 100;
          const height = activeObj.height || 100;

          const grad = new fabric.Gradient({
            type,
            coords:
          type === 'linear'
          ? {x1: 0, y1: 0, x2: width, y2: height }
          : {r1: 0, r2: width / 2, x1: width / 2, y1: height / 2, x2: width / 2, y2: height / 2 },
          colorStops: [
          {offset: 0, color: color1 },
          {offset: 1, color: color2 },
          ],
    });

          activeObj.set('fill', grad);
          canvas.requestRenderAll();
          syncSelectedProps();
          pushHistory();
  };

  // Shadow Presets
  const handleApplyShadowPreset = (preset: 'soft' | 'medium' | 'hard' | 'glow' | 'neon') => {
    if (!canvas) return;
          const activeObj = canvas.getActiveObject();
          if (!activeObj) return;

          let shadowOptions: fabric.IShadowOptions = {
            color: 'rgba(0,0,0,0.4)',
          blur: 8,
          offsetX: 2,
          offsetY: 4,
    };

          if (preset === 'soft') {
            shadowOptions = { color: 'rgba(0,0,0,0.3)', blur: 12, offsetX: 0, offsetY: 4 };
    } else if (preset === 'medium') {
            shadowOptions = { color: 'rgba(0,0,0,0.6)', blur: 16, offsetX: 3, offsetY: 6 };
    } else if (preset === 'hard') {
            shadowOptions = { color: 'rgba(0,0,0,0.8)', blur: 2, offsetX: 4, offsetY: 4 };
    } else if (preset === 'glow') {
          shadowOptions = {color: 'rgba(255,106,0,0.7)', blur: 20, offsetX: 0, offsetY: 0 };
    } else if (preset === 'neon') {
          shadowOptions = {color: 'rgba(47,91,255,0.85)', blur: 24, offsetX: 0, offsetY: 0 };
    }

          const shadow = new fabric.Shadow(shadowOptions);
          activeObj.set('shadow', shadow);
          (activeObj as any).shadowConfig = {preset, ...shadowOptions };
          canvas.requestRenderAll();
          syncSelectedProps();
          pushHistory();
  };

  // Center alignment helpers
  const handleCenter = (axis: 'horiz' | 'vert') => {
    if (!canvas) return;
          const activeObj = canvas.getActiveObject();
          if (!activeObj) return;

          if (axis === 'horiz') {
            activeObj.centerH();
    } else {
            activeObj.centerV();
    }
          activeObj.setCoords();
          canvas.requestRenderAll();
          syncSelectedProps();
          pushHistory();
  };

          return (
            <aside className="w-72 border-l border-[var(--border)] bg-[var(--bg-surface)] flex flex-col select-none text-[var(--ink)] z-10 overflow-y-auto font-body">
              {/* Header with Object Name & Quick Actions */}
                <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                  <div>
                      <h3 className="font-head text-xs font-medium text-[var(--ink)] uppercase tracking-wider truncate max-w-[140px]">
                        {selectedObjectProps.name || selectedObjectProps.type || 'Object'}
                      </h3>
                      <span className="font-mono text-[10px] text-[var(--ink-muted)] capitalize">{selectedObjectProps.type}</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        if (!canvas) return;
                        const activeObj = canvas.getActiveObject() as any;
                        if (activeObj) {
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
                        }
                      }}
                      className="p-1.5 rounded-[var(--radius-sm)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--bg-raised)]"
                      title={selectedObjectProps.isLocked ? 'Unlock Object' : 'Lock Object'}
                    >
                      {selectedObjectProps.isLocked ? (
              <Lock className="w-3.5 h-3.5 text-[var(--warning)]" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        if (!canvas) return;
                        const activeObj = canvas.getActiveObject();
                        if (activeObj) {
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
                        }
                      }}
                      className="p-1.5 rounded-[var(--radius-sm)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--bg-raised)]"
                      title="Duplicate Object"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (!canvas) return;
                        const activeObj = canvas.getActiveObject();
                        if (activeObj) {
                          canvas.remove(activeObj);
                          canvas.discardActiveObject();
                          canvas.requestRenderAll();
                          syncSelectedProps();
                          pushHistory();
                        }
                      }}
                      className="p-1.5 rounded-[var(--radius-sm)] text-[var(--ink-muted)] hover:text-[var(--danger)] hover:bg-[var(--bg-raised)]"
                      title="Delete Object"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-5">
                  {/* 1. TYPOGRAPHY (Only if text element) */}
                  {isText && (
                    <div className="space-y-3">
                        <h4 className="font-head text-[11px] font-medium text-[var(--ink)] uppercase tracking-wider flex items-center space-x-1.5">
                          <Type className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                          <span>Typography</span>
                        </h4>

                        {/* Direct Text Editor */}
                        <div>
                          <label className="font-mono text-[10px] text-[var(--ink-muted)] uppercase tracking-[0.04em] block mb-1">Text Content</label>
                          <textarea
                            value={selectedObjectProps.text || ''}
                            onChange={(e) => updateSelectedProp('text', e.target.value)}
                            rows={2}
                            className="w-full bg-[var(--bg-raised)] border border-[var(--border)] rounded-[var(--radius-sm)] p-2 text-xs text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-body"
                          />
                        </div>

                        {/* Font Family */}
                        <div>
                          <label className="font-mono text-[10px] text-[var(--ink-muted)] uppercase tracking-[0.04em] block mb-1">Font Family</label>
                          <select
                            value={selectedObjectProps.fontFamily || 'Inter'}
                            onChange={async (e) => {
                              const font = e.target.value;
                              await loadGoogleFont(font);
                              updateSelectedProp('fontFamily', font);
                            }}
                            className="w-full bg-[var(--bg-raised)] border border-[var(--border)] rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                          >
                            {FONT_CATALOG.map((f) => (
                              <option key={f.family} value={f.family}>
                                {f.family}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Font Size & Weight */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="font-mono text-[10px] text-[var(--ink-muted)] uppercase tracking-[0.04em] block mb-1">Size</label>
                            <input
                              type="number"
                              value={selectedObjectProps.fontSize || 24}
                              min={8}
                              max={160}
                              onChange={(e) => updateSelectedProp('fontSize', parseInt(e.target.value) || 24)}
                              className="w-full bg-[var(--bg-raised)] border border-[var(--border)] rounded-[var(--radius-sm)] px-2.5 py-1.5 font-mono text-xs text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                            />
                          </div>

                          <div>
                            <label className="font-mono text-[10px] text-[var(--ink-muted)] uppercase tracking-[0.04em] block mb-1">Weight</label>
                            <select
                              value={String(selectedObjectProps.fontWeight || '400')}
                              onChange={(e) => updateSelectedProp('fontWeight', e.target.value)}
                              className="w-full bg-[var(--bg-raised)] border border-[var(--border)] rounded-[var(--radius-sm)] px-2.5 py-1.5 font-mono text-xs text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                            >
                              <option value="400">Regular (400)</option>
                              <option value="500">Medium (500)</option>
                              <option value="600">Semibold (600)</option>
                              <option value="700">Bold (700)</option>
                            </select>
                          </div>
                        </div>
                    </div>
                  )}

                  {/* 2. APPEARANCE */}
                  <div className="space-y-3">
                      <h4 className="font-head text-[11px] font-medium text-[var(--ink)] uppercase tracking-wider flex items-center space-x-1.5">
                        <Sliders className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                        <span>Appearance</span>
                      </h4>

                      {/* Color Fill */}
                      <div>
                        <label className="font-mono text-[10px] text-[var(--ink-muted)] uppercase tracking-[0.04em] block mb-1">Fill Color</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={typeof selectedObjectProps.fill === 'string' ? selectedObjectProps.fill : '#FF6A00'}
                            onChange={(e) => updateSelectedProp('fill', e.target.value)}
                            className="w-8 h-8 rounded border border-[var(--border)] bg-[var(--bg-raised)] cursor-pointer"
                          />
                          <input
                            type="text"
                            value={typeof selectedObjectProps.fill === 'string' ? selectedObjectProps.fill : '#FF6A00'}
                            onChange={(e) => updateSelectedProp('fill', e.target.value)}
                            className="flex-1 bg-[var(--bg-raised)] border border-[var(--border)] rounded-[var(--radius-sm)] px-2.5 py-1.5 font-mono text-xs text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                          />
                        </div>
                      </div>

                      {/* Opacity */}
                      <div>
                          <div className="flex justify-between font-mono text-[10px] text-[var(--ink-muted)] uppercase tracking-[0.04em] mb-1">
                            <span>Opacity</span>
                            <span>{Math.round((selectedObjectProps.opacity ?? 1) * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={selectedObjectProps.opacity ?? 1}
                            onChange={(e) => updateSelectedProp('opacity', parseFloat(e.target.value))}
                            className="w-full accent-[var(--accent)]"
                          />
                        </div>

                        {/* Stroke Width & Color */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="font-mono text-[10px] text-[var(--ink-muted)] uppercase tracking-[0.04em] block mb-1">Border Width</label>
                            <input
                              type="number"
                              min={0}
                              max={30}
                              value={selectedObjectProps.strokeWidth || 0}
                              onChange={(e) => updateSelectedProp('strokeWidth', parseInt(e.target.value) || 0)}
                              className="w-full bg-[var(--bg-raised)] border border-[var(--border)] rounded-[var(--radius-sm)] px-2.5 py-1.5 font-mono text-xs text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                            />
                          </div>

                          <div>
                            <label className="font-mono text-[10px] text-[var(--ink-muted)] uppercase tracking-[0.04em] block mb-1">Border Color</label>
                            <input
                              type="color"
                              value={selectedObjectProps.stroke || '#FF6A00'}
                              onChange={(e) => updateSelectedProp('stroke', e.target.value)}
                              className="w-full h-8 rounded border border-[var(--border)] bg-[var(--bg-raised)] cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Corner Radius if rectangle */}
                        {isRect && (
            <div>
              <div className="flex justify-between font-mono text-[10px] text-[var(--ink-muted)] uppercase tracking-[0.04em] mb-1">
                <span>Corner Radius (rx, ry)</span>
                <span>{selectedObjectProps.rx || 0}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={60}
                value={selectedObjectProps.rx || 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  if (!canvas) return;
                  const activeObj = canvas.getActiveObject() as any;
                  if (activeObj) {
                    activeObj.set({ rx: val, ry: val });
                    canvas.requestRenderAll();
                    syncSelectedProps();
                    pushHistory();
                  }
                }}
                className="w-full accent-[var(--accent)]"
              />
            </div>
          )}
        </div>

        <hr className="border-[var(--border)]" />

        {/* 3. SHADOW & GLOW */}
                        <div className="space-y-3">
                            <h4 className="font-head text-[11px] font-medium text-[var(--ink)] uppercase tracking-wider flex items-center space-x-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                              <span>Drop Shadow</span>
                            </h4>

                              <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
                                {[
                                  { id: 'soft', label: 'Soft' },
                                  { id: 'medium', label: 'Medium' },
                                  { id: 'hard', label: 'Hard' },
                                  { id: 'glow', label: 'Orange Glow' },
                                  { id: 'neon', label: 'Blue Neon' },
                                ].map((p) => (
                                  <button
                                    key={p.id}
                                    onClick={() => handleApplyShadowPreset(p.id as any)}
                                    className="py-1.5 px-2 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] hover:bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--border-strong)] text-[10px] font-medium transition-colors"
                                  >
                                    {p.label}
                                  </button>
                                ))}
                                <button
                                  onClick={() => {
                                    if (!canvas) return;
                                    const activeObj = canvas.getActiveObject();
                                    if (activeObj) {
                                      activeObj.set('shadow', undefined);
                                      (activeObj as any).shadowConfig = null;
                                      canvas.requestRenderAll();
                                      syncSelectedProps();
                                      pushHistory();
                                    }
                                  }}
                                  className="py-1.5 px-2 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] hover:bg-[var(--bg-surface)] border border-[var(--border)] text-[10px] text-[var(--ink-muted)] transition-colors"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>

                            <hr className="border-[var(--border)]" />

                            {/* 4. GEOMETRY & ALIGNMENT */}
                            <div className="space-y-3">
                                <h4 className="font-head text-[11px] font-medium text-[var(--ink)] uppercase tracking-wider flex items-center space-x-1.5">
                                  <Move className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                                  <span>Position &amp; Alignment</span>
                                </h4>

                                {/* Quick Centering */}
                                  <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                                    <button
                                      onClick={() => handleCenter('horiz')}
                                      className="py-1.5 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] hover:bg-[var(--bg-surface)] border border-[var(--border)] text-[10px] font-medium transition-colors"
                                    >
                                      Center Horiz
                                    </button>
                                    <button
                                      onClick={() => handleCenter('vert')}
                                      className="py-1.5 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] hover:bg-[var(--bg-surface)] border border-[var(--border)] text-[10px] font-medium transition-colors"
                                    >
                                      Center Vert
                                    </button>
                                  </div>

                                  {/* X, Y, W, H */}
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <label className="font-mono text-[10px] text-[var(--ink-muted)] uppercase tracking-[0.04em] block mb-0.5">X Pos</label>
                                      <input
                                        type="number"
                                        value={selectedObjectProps.left || 0}
                                        onChange={(e) => updateSelectedProp('left', parseInt(e.target.value) || 0)}
                                        className="w-full bg-[var(--bg-raised)] border border-[var(--border)] rounded-[var(--radius-sm)] px-2 py-1 font-mono text-xs text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                                      />
                                    </div>
                                    <div>
                                      <label className="font-mono text-[10px] text-[var(--ink-muted)] uppercase tracking-[0.04em] block mb-0.5">Y Pos</label>
                                      <input
                                        type="number"
                                        value={selectedObjectProps.top || 0}
                                        onChange={(e) => updateSelectedProp('top', parseInt(e.target.value) || 0)}
                                        className="w-full bg-[var(--bg-raised)] border border-[var(--border)] rounded-[var(--radius-sm)] px-2 py-1 font-mono text-xs text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                                      />
                                    </div>
                                  </div>

                                  {/* Rotation */}
                                  <div>
                                      <div className="flex justify-between font-mono text-[10px] text-[var(--ink-muted)] uppercase tracking-[0.04em] mb-1">
                                        <span>Rotation Angle</span>
                                        <span>{selectedObjectProps.angle || 0}°</span>
                                      </div>
                                      <input
                                        type="range"
                                        min={0}
                                        max={360}
                                        value={selectedObjectProps.angle || 0}
                                        onChange={(e) => updateSelectedProp('angle', parseInt(e.target.value) || 0)}
                                        className="w-full accent-[var(--accent)]"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </aside>
                              );
};
