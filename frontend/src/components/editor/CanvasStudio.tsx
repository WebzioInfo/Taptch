/**
 * CanvasStudio - Core 2D Vector Workspace
 * Houses the interactive Fabric.js canvas, logical coordinate mapping (1050x600 px),
 * card boundary clipping (rx: 24, ry: 24), safe zone / bleed guides, and event bindings.
 */

import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { useEditorStore } from './useEditorStore';
import {
  safeParseCanvasJson,
  normalizeLiveTextStyle,
} from '../../utils/canvasJson';
import { ensureFontsForJson } from '../../studio/fonts/fontLoader';

interface CanvasStudioProps {
  product?: any;
}

export const CanvasStudio: React.FC<CanvasStudioProps> = ({ product }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const isInternalLoading = useRef<boolean>(false);

  const {
    activeSide,
    frontJson,
    backJson,
    zoom,
    setZoom,
    showGuides,
    setCanvas,
    syncSelectedProps,
    pushHistory,
    undo,
    redo,
    setPreviews,
  } = useEditorStore();

  const logicalWidth = product?.canvasWidth || 1050;
  const logicalHeight = product?.canvasHeight || 600;
  const safeZone = product?.safeZone || 40;
  const bleedZone = product?.bleedZone || 25;

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(1);

  // Monitor container dimensions for responsive auto-scaling below 1024px
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();

    const observer = new ResizeObserver(() => {
      updateSize();
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Viewport Scaling based on Container and Zoom
  // On desktop (width >= 1024), strictly maintain exact 720 / logicalWidth baseline for zero desktop drift
  const isDesktopScreen = typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;

  const baseScale = isDesktopScreen
    ? Math.min(1.0, 720 / logicalWidth)
    : (() => {
      const availWidth = Math.max(160, (containerSize.width || 320) - 32);
      const availHeight = Math.max(120, (containerSize.height || 260) - 32);
      return Math.min(availWidth / logicalWidth, availHeight / logicalHeight, 1.0);
    })();

  const effectiveScale = baseScale * zoom;

  // Initialize Fabric Canvas once on mount
  useEffect(() => {
    if (!canvasElRef.current) return;

    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: logicalWidth,
      height: logicalHeight,
      preserveObjectStacking: true,
      perPixelTargetFind: true,
      targetFindTolerance: 6,
      backgroundColor: '#0A0A0C',
      selectionColor: 'rgba(255, 106, 0, 0.15)',
      selectionBorderColor: '#FF6A00',
      selectionLineWidth: 1.5,
    });

    // Custom circle handles
    fabric.Object.prototype.set({
      cornerStyle: 'circle',
      cornerSize: 10,
      cornerColor: '#FFFFFF',
      cornerStrokeColor: '#FF6A00',
      transparentCorners: false,
      borderColor: '#FF6A00',
      borderScaleFactor: 1.5,
    });

    // Absolute Card Boundary ClipPath (rounded CR80 standard)
    canvas.clipPath = new fabric.Rect({
      left: 0,
      top: 0,
      width: logicalWidth,
      height: logicalHeight,
      rx: 24,
      ry: 24,
      absolutePositioned: true,
    });

    fabricRef.current = canvas;
    setCanvas(canvas);

    // Event Listeners with guard against programmatic loops
    const handleModified = () => {
      if (isInternalLoading.current) return;
      pushHistory();

      // Update raster preview
      try {
        const preview = canvas.toDataURL({ format: 'png', multiplier: 0.5 });
        if (useEditorStore.getState().activeSide === 'front') {
          setPreviews(preview, undefined);
        } else {
          setPreviews(undefined, preview);
        }
      } catch (e) {
        // Ignore preview capture error
      }
    };

    const handleSelection = () => {
      syncSelectedProps();
    };

    canvas.on('object:modified', handleModified);
    canvas.on('object:added', () => {
      if (!isInternalLoading.current) pushHistory();
    });
    canvas.on('object:removed', () => {
      if (!isInternalLoading.current) pushHistory();
    });

    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', handleSelection);

    // Keyboard Shortcuts (Delete, Undo, Redo)
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects && activeObjects.length > 0) {
          activeObjects.forEach((obj) => {
            if (!(obj as any).isLocked) {
              canvas.remove(obj);
            }
          });
          canvas.discardActiveObject();
          canvas.requestRenderAll();
          pushHistory();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      canvas.dispose();
      fabricRef.current = null;
      setCanvas(null);
    };
  }, []);

  // Viewport Scaling based on Container and Zoom
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !containerRef.current) return;

    canvas.setDimensions({
      width: logicalWidth * effectiveScale,
      height: logicalHeight * effectiveScale,
    });
    canvas.setZoom(effectiveScale);
    canvas.requestRenderAll();
  }, [effectiveScale, logicalWidth, logicalHeight]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      touchStartZoomRef.current = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / touchStartDistRef.current;
      const newZoom = Math.min(2.5, Math.max(0.5, touchStartZoomRef.current * ratio));
      setZoom(Number(newZoom.toFixed(2)));
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
  };

  // Load active side JSON when side or initial configs change
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const targetJson = activeSide === 'front' ? frontJson : backJson;
    if (!targetJson) return;

    isInternalLoading.current = true;
    const parsed = safeParseCanvasJson(targetJson);

    ensureFontsForJson(targetJson).finally(() => {
      if (!fabricRef.current) return;
      canvas.loadFromJSON(parsed.data, () => {
        const objects = canvas.getObjects() || [];
        for (const obj of objects) {
          normalizeLiveTextStyle(obj);
          if ((obj as any).initDimensions) {
            (obj as any).initDimensions();
          }
        }
        canvas.renderAll();
        isInternalLoading.current = false;
        syncSelectedProps();
      });
    });
  }, [activeSide]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center w-full h-full p-4 lg:p-8 select-none overflow-hidden"
    >
      {/* Canvas Wrapper */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative shadow-2xl rounded-[18px] overflow-hidden border border-[var(--border)] touch-none"
        style={{
          width: logicalWidth * effectiveScale,
          height: logicalHeight * effectiveScale,
        }}
      >
        <canvas ref={canvasElRef} />

        {/* Print Guides Overlay (Safe Zone & Bleed Zone) */}
        {showGuides && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Bleed Margin (Outer boundary indicator) */}
            <div
              className="absolute border border-dashed border-rose-500/40 rounded-[22px]"
              style={{
                top: `${(bleedZone / logicalHeight) * 100}%`,
                bottom: `${(bleedZone / logicalHeight) * 100}%`,
                left: `${(bleedZone / logicalWidth) * 100}%`,
                right: `${(bleedZone / logicalWidth) * 100}%`,
              }}
            />

            {/* Safe Zone Margin (All critical text & QR codes must reside inside here) */}
            <div
              className="absolute border border-dashed border-emerald-400/50 rounded-[18px]"
              style={{
                top: `${(safeZone / logicalHeight) * 100}%`,
                bottom: `${(safeZone / logicalHeight) * 100}%`,
                left: `${(safeZone / logicalWidth) * 100}%`,
                right: `${(safeZone / logicalWidth) * 100}%`,
              }}
            >
              <span className="absolute top-1 left-2 text-[10px] font-mono tracking-wider text-emerald-400/70 uppercase">
                Safe Area
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

