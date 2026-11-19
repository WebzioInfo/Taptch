import { fabric } from 'fabric';
import { safeParseCanvasJson, normalizeLiveTextStyle } from './canvasJson';
import { ensureFontsForJson } from '../studio/fonts/fontLoader';

/**
 * Headless fabric renderer that transforms a dual-sided canvas JSON
 * into a lightweight, crisp PNG data URL preview.
 */
export async function renderSideToPreview(
  jsonStr: string | object | null | undefined,
  width = 1050,
  height = 600,
  multiplier = 0.5
): Promise<string> {
  if (!jsonStr) return '';
  const str = typeof jsonStr === 'string' ? jsonStr : JSON.stringify(jsonStr);
  if (!str || str === '{}' || str === '{"version":"5.3.0","objects":[]}') return '';

  try {
    try {
      await ensureFontsForJson(str);
      if (typeof document !== 'undefined' && 'fonts' in document && (document as any).fonts?.ready) {
        await (document as any).fonts.ready;
      }
    } catch (fontErr) {
      // Proceed with system fallbacks if Google fonts network is slow
    }

    if (typeof document === 'undefined') return '';
    const offEl = document.createElement('canvas');
    const offCanvas = new fabric.StaticCanvas(offEl, {
      width,
      height,
      backgroundColor: '#0A0A0C',
    });

    const parsed = safeParseCanvasJson(str);
    return new Promise((resolve) => {
      offCanvas.loadFromJSON(parsed.data, () => {
        try {
          const objects = offCanvas.getObjects() || [];
          for (const obj of objects) {
            normalizeLiveTextStyle(obj);
            if ((obj as any).initDimensions) {
              (obj as any).initDimensions();
            }
          }
          offCanvas.renderAll();

          const dataUrl = offCanvas.toDataURL({
            format: 'png',
            quality: 0.92,
            multiplier,
          });

          offCanvas.dispose();
          resolve(dataUrl);
        } catch (renderErr) {
          try {
            offCanvas.dispose();
          } catch (_) {}
          resolve('');
        }
      });
    });
  } catch (err) {
    console.warn('[renderSideToPreview] Canvas export error:', err);
    return '';
  }
}
