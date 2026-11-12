import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';
import { eq } from 'drizzle-orm';

export interface ProfileSeoMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  openGraph: {
    title: string;
    description: string;
    url: string;
    image: string;
    type: string;
    siteName: string;
  };
  twitterCard: {
    card: string;
    title: string;
    description: string;
    image: string;
  };
  jsonLd: Record<string, unknown>;
  robots: string;
}

@Injectable()
export class SeoService {
  private readonly baseUrl: string;

  constructor(private dbService: DatabaseService) {
    this.baseUrl = (process.env.FRONTEND_URL || 'https://taptch.com').replace(/\/+$/, '');
  }

  async getProfileSeo(slug: string): Promise<ProfileSeoMetadata> {
    const [profile] = await this.dbService.db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.slug, slug))
      .limit(1);

    if (!profile) {
      throw new NotFoundException(`Profile with slug "${slug}" not found.`);
    }

    const canonicalUrl = `${this.baseUrl}/p/${profile.slug}`;
    const isBusiness = profile.profileType === 'business';
    const brandName = 'Taptch';

    // 1. Dynamic Title & Description
    let title: string;
    let description: string;

    if (isBusiness) {
      title = `${profile.displayName} | Official Business Profile & Offerings`;
      description =
        profile.bio?.slice(0, 160) ||
        `${profile.displayName} - Verified business profile, catalogue offerings, and direct digital enquiry on ${brandName}.`;
    } else {
      title = profile.headline
        ? `${profile.displayName} — ${profile.headline}`
        : `${profile.displayName} | Digital Visiting Card`;
      description =
        profile.bio?.slice(0, 160) ||
        `Connect with ${profile.displayName} on ${brandName}. Access portfolio, direct contact exchange, and verified digital identity.`;
    }

    const shareImage =
      profile.avatarUrl ||
      profile.coverUrl ||
      `${this.baseUrl}/assets/brand/og-default.png`;

    // 2. Open Graph & Twitter Cards
    const openGraph = {
      title,
      description,
      url: canonicalUrl,
      image: shareImage,
      type: isBusiness ? 'business.business' : 'profile',
      siteName: brandName,
    };

    const twitterCard = {
      card: 'summary_large_image',
      title,
      description,
      image: shareImage,
    };

    // 3. Structured Data (Schema.org)
    const socialUrls = Array.isArray(profile.socialLinks)
      ? profile.socialLinks.map((s: { url: string }) => s.url).filter(Boolean)
      : [];

    let jsonLd: Record<string, unknown>;
    if (isBusiness) {
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: profile.displayName,
        description,
        url: canonicalUrl,
        logo: profile.avatarUrl || undefined,
        image: shareImage,
        email: profile.email || undefined,
        telephone: profile.phone || undefined,
        sameAs: socialUrls,
        address: profile.address
          ? {
              '@type': 'PostalAddress',
              streetAddress: profile.address,
              addressLocality: profile.location || undefined,
            }
          : undefined,
      };
    } else {
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: profile.displayName,
        jobTitle: profile.headline || undefined,
        description,
        image: profile.avatarUrl || undefined,
        url: canonicalUrl,
        email: profile.email || undefined,
        telephone: profile.phone || undefined,
        sameAs: socialUrls,
      };
    }

    return {
      title,
      description,
      canonicalUrl,
      openGraph,
      twitterCard,
      jsonLd,
      robots: profile.status === 'PUBLISHED' ? 'index, follow' : 'noindex, nofollow',
    };
  }

  async generateSitemapXml(): Promise<string> {
    const publishedProfiles = await this.dbService.db
      .select({
        slug: schema.profiles.slug,
        updatedAt: schema.profiles.updatedAt,
      })
      .from(schema.profiles)
      .where(eq(schema.profiles.status, 'PUBLISHED'));

    const staticPages = [
      { loc: `${this.baseUrl}/`, priority: '1.0', changefreq: 'daily' },
      { loc: `${this.baseUrl}/templates`, priority: '0.9', changefreq: 'weekly' },
      { loc: `${this.baseUrl}/pricing`, priority: '0.9', changefreq: 'weekly' },
      { loc: `${this.baseUrl}/features`, priority: '0.8', changefreq: 'monthly' },
      { loc: `${this.baseUrl}/contact`, priority: '0.7', changefreq: 'monthly' },
    ];

    const urls = staticPages.map(
      (page) => `  <url>
    <loc>${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
    );

    for (const p of publishedProfiles) {
      const lastMod = p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString();
      urls.push(`  <url>
    <loc>${this.baseUrl}/p/${p.slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>`);
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
  }

  generateRobotsTxt(): string {
    return `# Taptch Production Robots Directives
User-agent: *
Allow: /
Allow: /p/
Allow: /templates
Allow: /pricing
Allow: /features
Allow: /contact

Disallow: /admin
Disallow: /support
Disallow: /dashboard
Disallow: /builder/
Disallow: /leads
Disallow: /api/

Sitemap: ${this.baseUrl}/sitemap.xml
`;
  }
}
