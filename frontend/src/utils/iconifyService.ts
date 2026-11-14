/**
 * Iconify Live Vector Search Service
 * Queries the public Iconify API (https://api.iconify.design) with debouncing,
 * fetching 100,000+ brand and interface vector icons ready for live canvas insertion.
 */

export interface IconifyResult {
  prefix: string;
  name: string;
  fullName: string;
  svgUri?: string;
}

let debounceTimer: any = null;

export async function searchIconifyIcons(query: string, limit = 40): Promise<IconifyResult[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return [];
  }

  try {
    const url = `https://api.iconify.design/search?query=${encodeURIComponent(trimmed)}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    if (!data || !Array.isArray(data.icons)) {
      return [];
    }

    return data.icons.map((item: string) => {
      const parts = item.split(':');
      const prefix = parts.length > 1 ? parts[0] : '';
      const name = parts.length > 1 ? parts[1] : parts[0];
      return {
        prefix,
        name,
        fullName: item,
        svgUri: `https://api.iconify.design/${item}.svg`,
      };
    });
  } catch (err) {
    console.warn('[iconifyService] Icon search error:', err);
    return [];
  }
}

/**
 * Fetch raw SVG string for a specific icon name (e.g., "lucide:wifi")
 */
export async function fetchIconifySvg(fullName: string): Promise<string | null> {
  try {
    const url = `https://api.iconify.design/${fullName}.svg`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    console.warn(`[iconifyService] Failed to load SVG for ${fullName}:`, err);
    return null;
  }
}

