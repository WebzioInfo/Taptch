---
name: public-profile-seo
description: "Master Tapzio's public profile SEO indexing, Zero Dynamic Hot Path architecture on /p/[slug], Open Graph card generation, and Google Search Console indexing."
risk: safe
source: tapzio-core
date_added: "2026-11-02"
version: "1.0.0"
---

# Tapzio Public Profile SEO & Edge Indexing Skill

Engineering standard for optimizing public digital business cards (`/p/[slug]`) for Google indexing, social media link previews, and sub-50ms edge response times.

---

## 1. When to Use This Skill

- Implementing or optimizing the `/p/[slug]` route.
- Generating dynamic Open Graph and Twitter summary preview cards.
- Ensuring compliance with the **Zero Dynamic Profile Hot Path** architectural constraint.
- Auditing and troubleshooting Google Search Console crawl budget or indexing warnings.

---

## 2. Zero Dynamic Profile Hot Path Mandate

Public profile pages represent the highest-traffic surface on the Tapzio platform, accessed continuously when users tap physical NFC cards or share QR codes.

### Mandatory Rules
1. **Never Import Dynamic Request APIs**: `src/app/(profile)/p/[slug]/page.tsx` must **NEVER** import `cookies()`, `headers()`, or `connection()`.
2. **Read Pre-Compiled Snapshots**: Read from `published_json` in the database or Redis cache (`profile:snapshot:${slug}`).
3. **Draft Profiles Blocked**: If a profile is in `status = 'draft'`, return `notFound()` immediately, preventing search engines from discovering unready drafts.

---

## 3. Dynamic Metadata & Social Previews

```tsx
// src/app/(profile)/p/[slug]/page.tsx
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getProfileBySlug(slug);

  if (!profile || profile.status !== 'published') {
    return { title: brandConfig.name, robots: { index: false, follow: false } };
  }

  const profileUrl = `${brandConfig.appUrl}/p/${slug}`;
  const title = `${profile.displayName} | ${brandConfig.name}`;
  const description = profile.headline || `${profile.displayName}'s digital business card.`;

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
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}
```

---

## 4. Search Engine Indexing Protection

- **Private / App Routes**: All authenticated routes (`/dashboard`, `/builder`, `/cards`, `/leads`, `/admin`) must be blocked in `robots.ts` and marked with `<meta name="robots" content="noindex, nofollow" />`.
- **Published Public Profiles**: Included dynamically in `sitemap.xml` with weekly change frequency and priority 0.7.
- **Deleted Profiles**: Return HTTP 404 cleanly via `notFound()`. Never soft-redirect deleted profiles to the homepage.

---

## 5. Mandatory Engineering Rules

1. **Brand Only From Config**: Always import brand names and URLs from `@/config/brand`. Never hardcode literal brand strings in metadata.
2. **Canonical URL Hygiene**: Every published profile must declare an explicit `canonical` URL to prevent duplicate content issues if accessed via vanity domains or query tracking parameters (`?ref=nfc`).

