import type { MetadataRoute } from 'next';
import { getDatabase } from '@/db';
import { profiles } from '@/db/schema/profiles';
import { inArray, desc } from 'drizzle-orm';
import { STANDARD_TEMPLATES } from '@/modules/templates/constants';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://taptch.com';
  const now = new Date();

  // 1. Core High-Intent Static Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/nfc-business-card`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/digital-business-card`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/templates`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // 2. Individual Template Showcase Routes
  const templateRoutes: MetadataRoute.Sitemap = STANDARD_TEMPLATES.map((tmpl) => ({
    url: `${baseUrl}/templates/${tmpl.id}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // 3. Published Public Digital Profiles (Opted-in only)
  let profileRoutes: MetadataRoute.Sitemap = [];
  try {
    // Only attempt database query if DATABASE_URL or DATABASE_URL_POOLED is present
    if (process.env.DATABASE_URL || process.env.DATABASE_URL_POOLED || process.env.NODE_ENV === 'test') {
      const db = getDatabase();
      const publishedProfiles = await db
        .select({
          slug: profiles.slug,
          updatedAt: profiles.updatedAt,
          customFields: profiles.customFields,
        })
        .from(profiles)
        .where(inArray(profiles.status, ['PUBLISHED', 'published', 'APPROVED']))
        .orderBy(desc(profiles.updatedAt))
        .limit(5000);

      profileRoutes = (publishedProfiles as Array<{
        slug: string;
        updatedAt: Date | null;
        customFields: Record<string, unknown> | null;
      }>)
        .filter((p) => {
          if (p.customFields && typeof p.customFields === 'object') {
            return (p.customFields as Record<string, unknown>).seoIndexing !== false;
          }
          return true;
        })
        .map((p) => ({
          url: `${baseUrl}/p/${p.slug}`,
          lastModified: p.updatedAt || now,
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        }));
    }
  } catch (error) {
    // Graceful fallback during isolated builds without DB access
    console.warn('[sitemap] Notice: Database query skipped or failed, indexing static routes only:', error);
  }

  return [...staticRoutes, ...templateRoutes, ...profileRoutes];
}

