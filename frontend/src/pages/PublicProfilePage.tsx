import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '../services/api';
import { ProfileRenderer } from '../components/templates/ProfileRenderer';
import { MetaTags } from '../components/seo/MetaTags';
import { BrandLogo } from '../components/brand';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';

export function PublicProfilePage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', 'public', slug],
    queryFn: () => ApiClient.get<any>(`/api/v1/profiles/by-slug/${slug}`),
    retry: 1,
    enabled: Boolean(slug),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0C]">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">
          Loading Digital Profile...
        </p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0C] px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Profile Not Found</h1>
        <p className="text-sm text-muted-foreground max-w-md mb-8">
          The digital identity profile for <span className="font-mono text-white">/{slug}</span> does not exist or has been made private.
        </p>
        <Link
          to="/"
          className="px-6 py-2.5 rounded-xl bg-primary text-black font-semibold text-xs hover:bg-primary-hover transition-colors"
        >
          Return to TAPTCH
        </Link>
      </div>
    );
  }

  // Transform snapshot to ProfileRenderData format expected by ProfileRenderer
  const renderData = {
    id: profile.id,
    slug: profile.slug,
    displayName: profile.displayName,
    headline: profile.headline,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    coverUrl: profile.coverUrl,
    phone: profile.phone,
    whatsapp: profile.whatsapp,
    email: profile.email,
    website: profile.website,
    address: profile.address,
    themeId: profile.themeId || 'obsidian-luxury',
    themeConfig: profile.customThemeColors || {},
    businesses: (profile.businesses || []).map((b: any) => ({
      id: b.id,
      companyName: b.companyName,
      tagline: b.jobTitle,
      websiteUrl: b.businessWebsite,
      address: b.businessAddress,
    })),
    catalogue: (profile.catalogue || []).map((c: any) => ({
      id: c.id,
      title: c.title,
      itemType: 'product',
      description: c.description,
      price: c.price,
      imageUrl: c.imageUrl,
      actionUrl: c.actionUrl,
    })),
    sections: (profile.sections || []).map((s: any) => ({
      id: s.id,
      sectionType: s.sectionType,
      title: s.title,
      isEnabled: s.isEnabled,
      displayOrder: s.orderIndex,
      configJson: s.content,
    })),
  };

  const isBusiness = profile.profileType === 'business';
  const pageTitle = isBusiness
    ? `${profile.displayName} | Business Profile & Offerings`
    : `${profile.displayName} — ${profile.headline || 'Digital Identity'}`;
  const pageDescription =
    profile.bio ||
    `Connect with ${profile.displayName} on Taptch. Access direct contact exchange, portfolio, and verified identity.`;

  const jsonLd = isBusiness
    ? {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: profile.displayName,
        description: pageDescription,
        url: window.location.href,
        logo: profile.avatarUrl || undefined,
        email: profile.email || undefined,
        telephone: profile.phone || undefined,
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: profile.displayName,
        jobTitle: profile.headline || undefined,
        description: pageDescription,
        image: profile.avatarUrl || undefined,
        url: window.location.href,
        email: profile.email || undefined,
        telephone: profile.phone || undefined,
      };

  return (
    <div className="min-h-screen bg-black">
      <MetaTags
        title={pageTitle}
        description={pageDescription}
        canonicalUrl={window.location.href}
        ogImage={profile.avatarUrl || profile.coverUrl}
        ogType={isBusiness ? 'business.business' : 'profile'}
        jsonLd={jsonLd}
      />
      <ProfileRenderer profile={renderData as any} />
    </div>
  );
}
