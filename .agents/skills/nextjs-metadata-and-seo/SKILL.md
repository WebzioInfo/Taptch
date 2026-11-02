---
name: nextjs-metadata-and-seo
description: "Master Next.js 15 Metadata API, dynamic Open Graph generation, sitemap.ts, robots.ts, and Search Console indexing hygiene."
risk: safe
source: Tappzio-core
date_added: "2026-11-02"
version: "1.0.0"
---

# Next.js 15 Metadata & SEO Engineering Skill

Comprehensive guide for configuring search engine optimization, dynamic Open Graph cards, sitemaps, robots rules, and resolving Google Search Console coverage issues in Next.js 15 App Router applications.

---

## 1. When to Use This Skill

- Defining static and dynamic metadata (`generateMetadata`) in Next.js App Router.
- Creating social share preview cards (Open Graph and Twitter summary cards).
- Generating dynamic sitemaps (`sitemap.ts`) and robots configurations (`robots.ts`).
- Auditing and fixing Google Search Console indexing states (Duplicate without canonical, Discovered - not indexed, Excluded by noindex).
- Securing private dashboard routes with `noindex, nofollow` while maximizing public profile indexability.

---

## 2. Static vs Dynamic Metadata

### Static Metadata Export
Use static metadata in marketing pages, pricing, and general static routes:

```tsx
// src/app/templates/page.tsx
import type { Metadata } from 'next';
import { brandConfig } from '@/config/brand';

export const metadata: Metadata = {
  title: `Luxury Template Showcase | ${brandConfig.name}`,
  description: 'Explore executive digital business card templates designed with obsidian luxury aesthetics.',
  alternates: {
    canonical: `${brandConfig.appUrl}/templates`,
  },
  openGraph: {
    title: `Luxury Digital Profile Templates | ${brandConfig.name}`,
    description: 'Executive designs for founders and professionals.',
    url: `${brandConfig.appUrl}/templates`,
    siteName: brandConfig.name,
    images: [{ url: `${brandConfig.appUrl}/assets/brand/og-cover.png`, width: 1200, height: 630 }],
    locale: 'en_IN',
    type: 'website',
  },
};
```

### Dynamic `generateMetadata` (Next.js 15)

In Next.js 15, `params` is a **Promise** and must be awaited:

```tsx
// src/app/(profile)/p/[slug]/page.tsx
import type { Metadata } from 'next';
import { getProfileBySlug } from '@/modules/profiles';
import { brandConfig } from '@/config/brand';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const profile = await getProfileBySlug(slug);
    if (!profile || profile.status !== 'published') {
      return { title: brandConfig.name, robots: { index: false, follow: false } };
    }

    const title = `${profile.displayName} | ${brandConfig.name}`;
    const description = profile.headline || `${profile.displayName}'s verified digital identity and executive business card.`;
    const profileUrl = `${brandConfig.appUrl}/p/${slug}`;

    return {
      title,
      description,
      alternates: {
        canonical: profileUrl,
      },
      openGraph: {
        title,
        description,
        url: profileUrl,
        type: 'profile',
        images: profile.avatarUrl ? [{ url: profile.avatarUrl, width: 400, height: 400 }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch {
    return { title: brandConfig.name, robots: { index: false, follow: false } };
  }
}
```

---

## 3. Dynamic Sitemap Generation (`src/app/sitemap.ts`)

```ts
import type { MetadataRoute } from 'next';
import { db } from '@/db';
import { profiles } from '@/db/schema/profiles';
import { eq } from 'drizzle-orm';
import { brandConfig } from '@/config/brand';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = brandConfig.appUrl;

  // 1. Static platform routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/templates`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  ];

  // 2. Published public profiles only
  const publishedProfiles = await db
    .select({ slug: profiles.slug, updatedAt: profiles.updatedAt })
    .from(profiles)
    .where(eq(profiles.status, 'published'))
    .limit(5000);

  const profileRoutes: MetadataRoute.Sitemap = publishedProfiles.map((p) => ({
    url: `${baseUrl}/p/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...profileRoutes];
}
```

---

## 4. Robots Configuration (`src/app/robots.ts`)

```ts
import type { MetadataRoute } from 'next';
import { brandConfig } from '@/config/brand';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/templates', '/p/'],
        disallow: ['/dashboard', '/builder', '/cards', '/leads', '/admin', '/api/', '/dev/'],
      },
    ],
    sitemap: `${brandConfig.appUrl}/sitemap.xml`,
  };
}
```

---

## 5. Resolving Google Search Console Coverage Issues

| Coverage State | Root Cause | Engineering Solution |
| :--- | :--- | :--- |
| **Duplicate without canonical** | HTTP vs HTTPS or trailing slash duplicates | Specify explicit `alternates.canonical` pointing to the canonical URL. |
| **Excluded by noindex** | Accidental `noindex` on public routes | Verify `robots` setting on public profiles; only private/draft pages should have `noindex`. |
| **Discovered - not indexed** | Google discovered URL via sitemap but hasn't crawled | Ensure public profiles are linked internally from templates or directory pages. |
| **Not found (404)** | Deleted profile | Return HTTP 404 cleanly via `notFound()`, never redirect 404s to homepage. |

---

## 6. Mandatory Engineering Rules

1. **Zero Dynamic Imports in Profile Metadata**: `generateMetadata` on `/p/[slug]` must never import `cookies()` or `headers()`.
2. **Draft Profiles Protected from Indexing**: If `profile.status !== 'published'`, always return `robots: { index: false, follow: false }`.
3. **Brand Only From Config**: Always interpolate brand title using `brandConfig.name`, never hardcoded strings.

