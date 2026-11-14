/**
 * Font Catalog & Dynamic Google Fonts Loader
 * Loads 40+ curated Google Fonts dynamically without cluttering the initial page load.
 * Supports Sans-Serif, Serif, Display, Monospace, and Handwriting categories.
 */

export interface FontDefinition {
  family: string;
  category: 'sans-serif' | 'serif' | 'display' | 'monospace' | 'handwriting';
  weights: number[];
  isPopular?: boolean;
}

export const FONT_CATALOG: FontDefinition[] = [
  // Sans-Serif (Modern & Clean)
  { family: 'Inter', category: 'sans-serif', weights: [400, 500, 600, 700, 800], isPopular: true },
  { family: 'Roboto', category: 'sans-serif', weights: [300, 400, 500, 700], isPopular: true },
  { family: 'Montserrat', category: 'sans-serif', weights: [400, 500, 600, 700, 800], isPopular: true },
  { family: 'Poppins', category: 'sans-serif', weights: [400, 500, 600, 700], isPopular: true },
  { family: 'Open Sans', category: 'sans-serif', weights: [400, 600, 700] },
  { family: 'Lato', category: 'sans-serif', weights: [400, 700] },
  { family: 'Plus Jakarta Sans', category: 'sans-serif', weights: [400, 500, 600, 700, 800], isPopular: true },
  { family: 'Outfit', category: 'sans-serif', weights: [400, 500, 600, 700] },
  { family: 'Manrope', category: 'sans-serif', weights: [400, 500, 600, 700, 800] },
  { family: 'Raleway', category: 'sans-serif', weights: [400, 600, 700] },
  { family: 'Work Sans', category: 'sans-serif', weights: [400, 600, 700] },
  { family: 'DM Sans', category: 'sans-serif', weights: [400, 500, 700] },

  // Serif (Luxury & Editorial)
  { family: 'Playfair Display', category: 'serif', weights: [400, 600, 700, 800], isPopular: true },
  { family: 'Cinzel', category: 'serif', weights: [400, 600, 700], isPopular: true },
  { family: 'Cormorant Garamond', category: 'serif', weights: [400, 600, 700], isPopular: true },
  { family: 'Merriweather', category: 'serif', weights: [400, 700] },
  { family: 'Lora', category: 'serif', weights: [400, 600, 700] },
  { family: 'Bodoni Moda', category: 'serif', weights: [400, 600, 700, 900] },
  { family: 'Prata', category: 'serif', weights: [400] },
  { family: 'Marcellus', category: 'serif', weights: [400] },
  { family: 'Fraunces', category: 'serif', weights: [400, 600, 700, 900] },
  { family: 'DM Serif Display', category: 'serif', weights: [400] },

  // Display (Architectural, Creative & Bold)
  { family: 'Syne', category: 'display', weights: [600, 700, 800], isPopular: true },
  { family: 'Space Grotesk', category: 'display', weights: [500, 600, 700], isPopular: true },
  { family: 'Clash Display', category: 'display', weights: [500, 600, 700] },
  { family: 'Bebas Neue', category: 'display', weights: [400], isPopular: true },
  { family: 'Oswald', category: 'display', weights: [400, 600, 700] },
  { family: 'Righteous', category: 'display', weights: [400] },
  { family: 'Cinzel Decorative', category: 'display', weights: [400, 700] },
  { family: 'Unbounded', category: 'display', weights: [400, 600, 800] },
  { family: 'Cabinet Grotesk', category: 'display', weights: [500, 700, 800] },

  // Monospace (Tech, Minimal & Precision)
  { family: 'Space Mono', category: 'monospace', weights: [400, 700], isPopular: true },
  { family: 'JetBrains Mono', category: 'monospace', weights: [400, 600, 700], isPopular: true },
  { family: 'Fira Code', category: 'monospace', weights: [400, 600] },
  { family: 'IBM Plex Mono', category: 'monospace', weights: [400, 600] },

  // Handwriting & Script (Signatures & Crests)
  { family: 'Great Vibes', category: 'handwriting', weights: [400], isPopular: true },
  { family: 'Alex Brush', category: 'handwriting', weights: [400] },
  { family: 'Allura', category: 'handwriting', weights: [400] },
  { family: 'Pinyon Script', category: 'handwriting', weights: [400] },
  { family: 'Dancing Script', category: 'handwriting', weights: [400, 700] },
];

const loadedFonts = new Set<string>();

/**
 * Dynamically load a font from Google Fonts and wait until ready.
 */
export async function loadGoogleFont(family: string, weight = 400): Promise<boolean> {
  const cacheKey = `${family}:${weight}`;
  if (loadedFonts.has(cacheKey)) {
    return true;
  }

  // System fallback fonts don't need network loading
  const systemFonts = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Courier New', 'sans-serif', 'serif', 'monospace'];
  if (systemFonts.includes(family)) {
    loadedFonts.add(cacheKey);
    return true;
  }

  try {
    const formattedFamily = family.replace(/\s+/g, '+');
    const linkId = `google-font-${formattedFamily.toLowerCase()}`;

    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${formattedFamily}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,700&display=swap`;
      document.head.appendChild(link);
    }

    if ('fonts' in document) {
      await document.fonts.load(`${weight} 16px "${family}"`);
    }

    loadedFonts.add(cacheKey);
    return true;
  } catch (err) {
    console.warn(`[fontLoader] Failed to load font "${family}":`, err);
    return false;
  }
}

