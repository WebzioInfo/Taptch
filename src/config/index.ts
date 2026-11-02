import { defaultBrandConfig, BrandConfig } from './brand';
import { db } from '@/db';
import { systemSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

let cachedConfig: BrandConfig | null = null;
let lastFetchedAt = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory cache

export async function getBrandConfig(): Promise<BrandConfig> {
  const now = Date.now();
  if (cachedConfig && now - lastFetchedAt < CACHE_TTL_MS) {
    return cachedConfig;
  }

  try {
    const settings = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.id, 'default'))
      .limit(1);

    if (settings && settings.length > 0) {
      const row = settings[0];
      cachedConfig = {
        ...defaultBrandConfig,
        name: row.brandName || defaultBrandConfig.name,
        tagline: row.brandTagline || defaultBrandConfig.tagline,
        supportEmail: row.contactEmail || defaultBrandConfig.supportEmail,
        assets: {
          ...defaultBrandConfig.assets,
          logoUrl: row.brandLogoUrl || defaultBrandConfig.assets.logoUrl,
        },
        theme: {
          ...defaultBrandConfig.theme,
          ...(row.brandColors || {}),
        },
        features: {
          ...defaultBrandConfig.features,
          ...(row.featuresEnabled || {}),
        },
      };
      lastFetchedAt = now;
      return cachedConfig;
    }
  } catch (err) {
    console.warn('[BRAND CONFIG] Could not load system_settings from DB, using fallback defaults:', err);
  }

  cachedConfig = defaultBrandConfig;
  lastFetchedAt = now;
  return cachedConfig;
}

export function invalidateBrandConfigCache(): void {
  cachedConfig = null;
  lastFetchedAt = 0;
}

