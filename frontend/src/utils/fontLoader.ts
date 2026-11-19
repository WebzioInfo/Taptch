/**
 * Font Catalog & Dynamic Loader Bridge
 * Backwards compatibility bridge delegating to src/studio/fonts/fontLoader.ts
 */

import { allFonts, loadFontByFamily } from '../studio/fonts/fontLoader';

export interface FontDefinition {
  family: string;
  category: 'sans-serif' | 'serif' | 'display' | 'monospace' | 'handwriting';
  weights: number[];
  isPopular?: boolean;
}

export const FONT_CATALOG: FontDefinition[] = (allFonts as any[]).map((f) => ({
    family: f.family,
    category: f.category.toLowerCase() as FontDefinition['category'],
    weights: f.weights,
    isPopular: ['Inter', 'Roboto', 'Montserrat', 'Playfair Display', 'Oswald', 'JetBrains Mono', 'Great Vibes'].includes(f.family),
  }));

  export async function loadGoogleFont(family: string, _weight = 400): Promise<boolean> {
    try {
      await loadFontByFamily(family);
      return true;
    } catch (err) {
      console.warn(`[fontLoader] Failed to load font "${family}":`, err);
      return false;
    }
  }
