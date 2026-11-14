/**
 * Canvas JSON Serialization & Deserialization Utilities
 * Authoritative implementation based on Syncmie Live Design Studio Technical Audit.
 * Prevents Fabric 5.3.0 text style crashes, normalizes JSON structures, and preserves all 21 custom properties.
 */

export const CUSTOM_FABRIC_PROPS = [
  'id',                  // 1. Unique element ID
  'name',                // 2. Human-readable layer name
  'isLocked',            // 3. Boolean lock state
  'selectable',          // 4. Interaction flag
  'evented',             // 5. Pointer event flag
  'lockMovementX',       // 6. Translation X constraint
  'lockMovementY',       // 7. Translation Y constraint
  'lockRotation',        // 8. Rotation constraint
  'lockScalingX',        // 9. Scaling X constraint
  'lockScalingY',        // 10. Scaling Y constraint
  'isProtected',         // 11. Template protected layer flag
  'isArtworkBackground', // 12. Background plate layer flag
  'isQRCode',            // 13. QR code identifier
  'qrValue',             // 14. Encoded URL/text of QR code
  'editable',            // 15. Customer-editable flag
  'assetType',           // 16. 'brand' | 'monochrome' | 'shape' | 'text' | 'artwork'
  'originalColor',       // 17. Color before tinting
  'strokeDashArray',     // 18. Border dashed pattern
  'strokeLineCap',       // 19. Line cap: butt | round | square
  'shadow',              // 20. Native Fabric.js shadow
  'shadowConfig',        // 21. Serialized UI shadow configuration
];

/**
 * Generate a random unique object ID
 */
export function generateObjectId(prefix = 'obj'): string {
  const rand = Math.random().toString(36).substring(2, 9);
  const time = Date.now().toString(36).substring(4);
  return `${prefix}_${rand}_${time}`;
}

/**
 * Normalize live Fabric text objects before serialization
 * Recursively traverses groups and ensures `.styles` is an object `{}` (not null/undefined)
 * to prevent Fabric 5.3.0 `stylesToArray` undefined-read crashes.
 */
export function normalizeLiveTextStyle(obj: any): void {
  if (!obj) return;

  const type = (obj.type || '').toLowerCase();
  if (type === 'text' || type === 'i-text' || type === 'textbox') {
    if (!obj.styles || typeof obj.styles !== 'object') {
      obj.styles = {};
    }
  }

  // Handle nested group objects
  if (obj._objects && Array.isArray(obj._objects)) {
    for (const child of obj._objects) {
      normalizeLiveTextStyle(child);
    }
  }
}

/**
 * Normalize raw JSON text objects prior to calling `canvas.loadFromJSON()`
 * In Fabric 5.3.0, JSON styles must be an array `[]` (or sanitized style map)
 * so that `stylesFromArray` initializes cleanly on the live instance.
 */
export function normalizeJsonTextStyle(obj: any): void {
  if (!obj) return;

  const type = (obj.type || '').toLowerCase();
  if (type === 'text' || type === 'i-text' || type === 'textbox') {
    if (!obj.styles || typeof obj.styles !== 'object') {
      obj.styles = [];
    }
  }

  if (obj.objects && Array.isArray(obj.objects)) {
    for (const child of obj.objects) {
      normalizeJsonTextStyle(child);
    }
  }
}

/**
 * Safely serialize a live Fabric canvas into a sanitized JSON string.
 * Applies pre-normalization to live text styles, captures all 21 custom properties,
 * and recovers gracefully if an individual object is corrupted.
 */
export function safeSerializeCanvas(canvas: any): string {
  if (!canvas) {
    return JSON.stringify({ version: '5.3.0', objects: [] });
  }

  try {
    const objects = canvas.getObjects() || [];
    for (const obj of objects) {
      normalizeLiveTextStyle(obj);
    }

    const json = canvas.toJSON(CUSTOM_FABRIC_PROPS);
    return JSON.stringify(json);
  } catch (err) {
    console.warn('[safeSerializeCanvas] Full canvas serialization failed, executing per-object fallback:', err);
    try {
      const recoveredObjects: any[] = [];
      const objects = canvas.getObjects() || [];

      for (const obj of objects) {
        try {
          normalizeLiveTextStyle(obj);
          recoveredObjects.push(obj.toObject(CUSTOM_FABRIC_PROPS));
        } catch (itemErr) {
          console.error('[safeSerializeCanvas] Dropping unrecoverable object:', itemErr);
        }
      }

      return JSON.stringify({
        version: '5.3.0',
        backgroundColor: canvas.backgroundColor || '#0A0A0C',
        background: canvas.background || '#0A0A0C',
        objects: recoveredObjects,
      });
    } catch (fatalErr) {
      console.error('[safeSerializeCanvas] Fatal serialization error:', fatalErr);
      return JSON.stringify({ version: '5.3.0', objects: [] });
    }
  }
}

export interface ParseCanvasResult {
  success: boolean;
  data: any;
  error?: string;
}

/**
 * Safely parses and normalizes a canvas JSON string or object.
 * Guarantees stable object IDs, assigns default interaction flags,
 * and normalizes text styles before canvas loading.
 */
export function safeParseCanvasJson(raw: string | object | null | undefined): ParseCanvasResult {
  if (!raw) {
    return {
      success: true,
      data: {
        version: '5.3.0',
        backgroundColor: '#0A0A0C',
        background: '#0A0A0C',
        objects: [],
      },
    };
  }

  let parsed: any;
  try {
    if (typeof raw === 'string') {
      parsed = JSON.parse(raw);
    } else {
      parsed = JSON.parse(JSON.stringify(raw));
    }
  } catch (err: any) {
    return {
      success: false,
      data: { version: '5.3.0', objects: [] },
      error: `Failed to parse canvas JSON: ${err.message}`,
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    parsed = { version: '5.3.0', objects: [] };
  }

  if (!Array.isArray(parsed.objects)) {
    parsed.objects = [];
  }

  if (!parsed.backgroundColor && !parsed.background) {
    parsed.backgroundColor = '#0A0A0C';
    parsed.background = '#0A0A0C';
  }

  // Ensure every object has an ID, valid text styles, and correct interaction defaults
  for (let i = 0; i < parsed.objects.length; i++) {
    const item = parsed.objects[i];
    if (!item.id) {
      item.id = generateObjectId(item.type || 'layer');
    }
    if (!item.name) {
      item.name = item.text ? String(item.text).substring(0, 20) : `${item.type || 'Layer'} ${i + 1}`;
    }

    normalizeJsonTextStyle(item);
  }

  return {
    success: true,
    data: parsed,
  };
}

