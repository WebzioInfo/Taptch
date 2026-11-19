import { useEffect, useState } from 'react';
import fonts from './fonts.json';

export type FontDef = (typeof fonts)[number];

const cache = new Map<string, Promise<void>>();

export function cssUrl(f: any): string {
  if (f.source === 'fontshare' || f.url) return f.url;
  const fam = f.family.replace(/ /g, '+');
  const w = f.weights.length === 1 && f.weights[0] === 400 ? '' : ':wght@' + f.weights.join(';');
  return `https://fonts.googleapis.com/css2?family=${fam}${w}&display=swap`;
}

export function loadFont(f: any): Promise<void> {
  if (f.source === 'local') return document.fonts.load(`400 16px "${f.family}"`).then(() => {});
  const hit = cache.get(f.family);
  if (hit) return hit;
  const p = new Promise<void>((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssUrl(f);
    link.onload = () => {
      Promise.all(f.weights.map((w: number) => document.fonts.load(`${w} 16px "${f.family}"`)))
        .then(() => resolve())
        .catch(() => resolve());
    };
    link.onerror = () => {
      console.warn('Font failed to load:', f.family);
      resolve();
    };
    document.head.appendChild(link);
  });
  cache.set(f.family, p);
  return p;
}

export const allFonts = fonts;

export function loadFontByFamily(family: string): Promise<void> {
  const font = (fonts as FontDef[]).find((f) => f.family.toLowerCase() === family.toLowerCase());
  if (font) {
    return loadFont(font);
  }
  return Promise.resolve();
}

/**
 * Snap target weight to the nearest available weight supported by this font.
 */
export function snapToNearestWeight(availableWeights: number[], targetWeight: number): number {
  if (!availableWeights || availableWeights.length === 0) return 400;
  return availableWeights.reduce((prev, curr) => {
    return Math.abs(curr - targetWeight) < Math.abs(prev - targetWeight) ? curr : prev;
  });
}

/**
 * Concurrency queue for preview lazy-loading (limit 6 active concurrent requests).
 */
let activeLoads = 0;
const queue: (() => void)[] = [];

function pumpQueue() {
  while (activeLoads < 6 && queue.length > 0) {
    const next = queue.shift();
    if (next) {
      activeLoads++;
      next();
    }
  }
}

export function loadFontQueued(font: FontDef): Promise<void> {
  return new Promise<void>((resolve) => {
    const task = () => {
      loadFont(font)
        .catch(() => {})
        .finally(() => {
          activeLoads--;
          pumpQueue();
          resolve();
        });
    };
    queue.push(task);
    pumpQueue();
  });
}

/**
 * Lazy load hook with IntersectionObserver for font preview rows
 */
export function useFontReady(
  font: FontDef,
  rowRef: React.RefObject<HTMLElement | null>,
  rootRef?: React.RefObject<HTMLElement | null>
) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!rowRef.current) return;
    if (cache.has(font.family)) {
      setReady(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          loadFontQueued(font).then(() => {
            setReady(true);
          });
          observer.disconnect();
        }
      },
      {
        root: rootRef?.current || null,
        rootMargin: '200px',
      }
    );

    observer.observe(rowRef.current);
    return () => {
      observer.disconnect();
    };
  }, [font, rowRef, rootRef]);

  return ready;
}

/**
 * Ensures all fonts referenced in a canvas JSON string are loaded before rendering.
 */
export async function ensureFontsForJson(jsonStr: string): Promise<void> {
  if (!jsonStr) return;
  try {
    const parsed = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
    const fontFamilies = new Set<string>();

    const extractFonts = (objs: any[]) => {
      if (!Array.isArray(objs)) return;
      for (const obj of objs) {
        if (obj.fontFamily) {
          fontFamilies.add(obj.fontFamily);
        }
        if (obj.objects) {
          extractFonts(obj.objects);
        }
      }
    };

    if (parsed.objects) {
      extractFonts(parsed.objects);
    }

    const promises = Array.from(fontFamilies).map((fam) => loadFontByFamily(fam));
    await Promise.all(promises);
    if ('fonts' in document && (document as any).fonts?.ready) {
      await (document as any).fonts.ready;
    }
  } catch (err) {
    console.warn('[ensureFontsForJson] Failed to load canvas fonts:', err);
  }
}
