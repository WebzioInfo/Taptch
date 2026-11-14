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
      <aside className="w-72 border-l border-[#23232A] bg-[#0A0A0C] p-6 flex flex-col items-center justify-center text-center select-none text-white z-10">
        <div className="w-12 h-12 rounded-2xl bg-[#121216] border border-[#23232A] flex items-center justify-center text-[#D4AF37] mb-3">
          <Move className="w-6 h-6" />
        </div>
        <h3 className="text-xs font-semibold text-white uppercase tracking-wider">No Selection</h3>
        <p className="text-[11px] text-neutral-400 mt-1 max-w-[180px]">
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
          ? { x1: 0, y1: 0, x2: width, y2: height }
          : { r1: 0, r2: width / 2, x1: width / 2, y1: height / 2, x2: width / 2, y2: height / 2 },
      colorStops: [
        { offset: 0, color: color1 },
        { offset: 1, color: color2 },
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
      shadowOptions = { color: 'rgba(212,175,55,0.7)', blur: 20, offsetX: 0, offsetY: 0 };
    } else if (preset === 'neon') {
      shadowOptions = { color: 'rgba(22,109,245,0.85)', blur: 24, offsetX: 0, offsetY: 0 };
    }

    const shadow = new fabric.Shadow(shadowOptions);
    activeObj.set('shadow', shadow);
    (activeObj as any).shadowConfig = {
      enabled: true,
      ...shadowOptions,
      preset,
    };

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
    <aside className="w-72 border-l border-[#23232A] bg-[#0A0A0C] flex flex-col select-none text-white z-10 overflow-y-auto">
      {/* Header with Object Name & Quick Actions */}
      <div className="p-4 border-b border-[#23232A] flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider truncate max-w-[140px]">
            {selectedObjectProps.name || selectedObjectProps.type || 'Object'}
          </h3>
          <span className="text-[10px] text-neutral-400 capitalize">{selectedObjectProps.type}</span>
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
            className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-[#18181D]"
            title={selectedObjectProps.isLocked ? 'Unlock Object' : 'Lock Object'}
          >
            {selectedObjectProps.isLocked ? (
              <Lock className="w-3.5 h-3.5 text-amber-400" />
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
            className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-[#18181D]"
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
            className="p-1.5 rounded text-neutral-400 hover:text-rose-400 hover:bg-[#18181D]"
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
            <h4 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Type className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Typography</span>
            </h4>

            {/* Direct Text Editor */}
            <div>
              <label className="text-[10px] text-neutral-400 block mb-1">Text Content</label>
              <textarea
                value={selectedObjectProps.text || ''}
                onChange={(e) => updateSelectedProp('text', e.target.value)}
                rows={2}
                className="w-full bg-[#121216] border border-[#23232A] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* Font Family */}
            <div>
              <label className="text-[10px] text-neutral-400 block mb-1">Font Family</label>
              <select
                value={selectedObjectProps.fontFamily || 'Inter'}
                onChange={async (e) => {
                  const font = e.target.value;
                  await loadGoogleFont(font);
                  updateSelectedProp('fontFamily', font);
                }}
                className="w-full bg-[#121216] border border-[#23232A] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
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
                <label className="text-[10px] text-neutral-400 block mb-1">Size</label>
                <input
                  type="number"
                  value={selectedObjectProps.fontSize || 24}
                  min={8}
                  max={160}
                  onChange={(e) => updateSelectedProp('fontSize', parseInt(e.target.value) || 24)}
                  className="w-full bg-[#121216] border border-[#23232A] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Weight</label>
                <select
                  value={String(selectedObjectProps.fontWeight || '400')}
                  onChange={(e) => updateSelectedProp('fontWeight', e.target.value)}
                  className="w-full bg-[#121216] border border-[#23232A] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="300">Light (300)</option>
                  <option value="400">Regular (400)</option>
                  <option value="500">Medium (500)</option>
                  <option value="600">Semibold (600)</option>
                  <option value="700">Bold (700)</option>
                  <option value="800">ExtraBold (800)</option>
                </select>
              </div>
            </div>

            {/* Text Style & Alignment Toggles */}
            <div className="flex items-center justify-between pt-1">
              {/* Alignments */}
              <div className="flex bg-[#121216] rounded-lg p-0.5 border border-[#23232A]">
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
                      className={`p-1.5 rounded ${isActive ? 'bg-[#18181D] text-[#D4AF37]' : 'text-neutral-400 hover:text-white'}`}
                      title={item.align}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                  );
                })}
              </div>

              {/* Italic, Underline */}
              <div className="flex bg-[#121216] rounded-lg p-0.5 border border-[#23232A]">
                <button
                  onClick={() =>
                    updateSelectedProp(
                      'fontStyle',
                      selectedObjectProps.fontStyle === 'italic' ? 'normal' : 'italic'
                    )
                  }
                  className={`p-1.5 rounded ${selectedObjectProps.fontStyle === 'italic'
                      ? 'bg-[#18181D] text-[#D4AF37]'
                      : 'text-neutral-400 hover:text-white'
                    }`}
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => updateSelectedProp('underline', !selectedObjectProps.underline)}
                  className={`p-1.5 rounded ${selectedObjectProps.underline
                      ? 'bg-[#18181D] text-[#D4AF37]'
                      : 'text-neutral-400 hover:text-white'
                    }`}
                  title="Underline"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Letter Spacing */}
            <div>
              <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
                <span>Letter Spacing</span>
                <span>{selectedObjectProps.charSpacing || 0}</span>
              </div>
              <input
                type="range"
                min={-50}
                max={300}
                value={selectedObjectProps.charSpacing || 0}
                onChange={(e) => updateSelectedProp('charSpacing', parseInt(e.target.value) || 0)}
                className="w-full accent-[#D4AF37]"
              />
            </div>
          </div>
        )}

        <hr className="border-[#23232A]" />

        {/* 2. APPEARANCE (Fills, Borders, Opacity) */}
        <div className="space-y-3">
          <h4 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Appearance</span>
          </h4>

          {/* Fill Color */}
          <div>
            <label className="text-[10px] text-neutral-400 block mb-1">Fill Color</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={typeof selectedObjectProps.fill === 'string' ? selectedObjectProps.fill : '#D4AF37'}
                onChange={(e) => updateSelectedProp('fill', e.target.value)}
                className="w-8 h-8 rounded border border-[#23232A] bg-[#121216] cursor-pointer"
              />
              <input
                type="text"
                value={typeof selectedObjectProps.fill === 'string' ? selectedObjectProps.fill : '#D4AF37'}
                onChange={(e) => updateSelectedProp('fill', e.target.value)}
                className="flex-1 bg-[#121216] border border-[#23232A] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {/* Opacity */}
          <div>
            <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
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
              className="w-full accent-[#D4AF37]"
            />
          </div>

          {/* Stroke Width & Color */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-neutral-400 block mb-1">Border Width</label>
              <input
                type="number"
                min={0}
                max={30}
                value={selectedObjectProps.strokeWidth || 0}
                onChange={(e) => updateSelectedProp('strokeWidth', parseInt(e.target.value) || 0)}
                className="w-full bg-[#121216] border border-[#23232A] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="text-[10px] text-neutral-400 block mb-1">Border Color</label>
              <input
                type="color"
                value={selectedObjectProps.stroke || '#D4AF37'}
                onChange={(e) => updateSelectedProp('stroke', e.target.value)}
                className="w-full h-8 rounded border border-[#23232A] bg-[#121216] cursor-pointer"
              />
            </div>
          </div>

          {/* Corner Radius if rectangle */}
          {isRect && (
            <div>
              <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
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
                className="w-full accent-[#D4AF37]"
              />
            </div>
          )}
        </div>

        <hr className="border-[#23232A]" />

        {/* 3. SHADOW & GLOW */}
        <div className="space-y-3">
          <h4 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Drop Shadow & Glow</span>
          </h4>

          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'soft', label: 'Soft' },
              { id: 'medium', label: 'Medium' },
              { id: 'hard', label: 'Hard' },
              { id: 'glow', label: 'Gold Glow' },
              { id: 'neon', label: 'Blue Neon' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handleApplyShadowPreset(p.id as any)}
                className="py-1.5 px-2 rounded-lg bg-[#121216] hover:bg-[#18181D] border border-[#23232A] hover:border-[#D4AF37] text-[10px] font-medium transition-colors"
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
              className="py-1.5 px-2 rounded-lg bg-[#121216] hover:bg-[#18181D] border border-[#23232A] text-[10px] text-neutral-400 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        <hr className="border-[#23232A]" />

        {/* 4. GEOMETRY & ALIGNMENT */}
        <div className="space-y-3">
          <h4 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Move className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Position & Alignment</span>
          </h4>

          {/* Quick Centering */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleCenter('horiz')}
              className="py-1.5 rounded-lg bg-[#121216] hover:bg-[#18181D] border border-[#23232A] text-[10px] font-medium transition-colors"
            >
              Center Horiz
            </button>
            <button
              onClick={() => handleCenter('vert')}
              className="py-1.5 rounded-lg bg-[#121216] hover:bg-[#18181D] border border-[#23232A] text-[10px] font-medium transition-colors"
            >
              Center Vert
            </button>
          </div>

          {/* X, Y, W, H */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-neutral-400 block mb-0.5">X Pos</label>
              <input
                type="number"
                value={selectedObjectProps.left || 0}
                onChange={(e) => updateSelectedProp('left', parseInt(e.target.value) || 0)}
                className="w-full bg-[#121216] border border-[#23232A] rounded px-2 py-1 text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-400 block mb-0.5">Y Pos</label>
              <input
                type="number"
                value={selectedObjectProps.top || 0}
                onChange={(e) => updateSelectedProp('top', parseInt(e.target.value) || 0)}
                className="w-full bg-[#121216] border border-[#23232A] rounded px-2 py-1 text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Rotation */}
          <div>
            <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
              <span>Rotation Angle</span>
              <span>{selectedObjectProps.angle || 0}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={360}
              value={selectedObjectProps.angle || 0}
              onChange={(e) => updateSelectedProp('angle', parseInt(e.target.value) || 0)}
              className="w-full accent-[#D4AF37]"
            />
          </div>
        </div>
      </div>
    </aside>
  );
};