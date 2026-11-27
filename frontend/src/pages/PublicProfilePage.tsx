import React, { useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '../services/api';
import { ProfileRenderer, canonicalTemplateId } from '../components/templates/ProfileRenderer';
import { MetaTags } from '../components/seo/MetaTags';
import { BrandLogo } from '../components/brand';
import { env } from '../config/env';
import { isReservedUsername } from '../config/reservedUsernames';
import { RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';

function resolveMediaUrl(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
    return trimmed;
  }
  if (trimmed.startsWith('/') && env.apiUrl) {
    return `${env.apiUrl}${trimmed}`;
  }
  return trimmed;
}

function isConfirmedNotFoundError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const anyErr = err as { statusCode?: number; status?: number; message?: string };
  if (anyErr.statusCode === 404 || anyErr.status === 404) return true;
  const msg = (anyErr.message || '').toLowerCase();
  return msg.includes('not found') || msg.includes('404');
}

export function PublicProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const cleanSlug = (slug || '').trim().toLowerCase();
  const isReserved = !cleanSlug || isReservedUsername(cleanSlug);
  const isFromNfc = Boolean((location.state as { fromNfcRedirect?: boolean } | null)?.fromNfcRedirect);

  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<any>({
    queryKey: ['public-profile', cleanSlug],
    queryFn: async ({ signal }) => {
      const timeoutController = new AbortController();
      const timeoutId = window.setTimeout(() => timeoutController.abort(), 10000);
      const onParentAbort = () => timeoutController.abort();
      signal?.addEventListener('abort', onParentAbort, { once: true });

      try {
        return await ApiClient.get<any>(`/api/v1/profiles/by-slug/${encodeURIComponent(cleanSlug)}`, {
          signal: timeoutController.signal,
        });
      } finally {
        window.clearTimeout(timeoutId);
        signal?.removeEventListener('abort', onParentAbort);
      }
    },
    enabled: !isReserved,
    retry: false, // Never retry confirmed 404s or missing profiles
    staleTime: 0,
    refetchOnMount: 'always',
    gcTime: 5 * 60 * 1000,
  });

  const renderData = useMemo(() => {
    if (!profile || !profile.displayName) return null;
    return {
      id: profile.id,
      slug: profile.slug,
      displayName: profile.displayName,
      headline: profile.headline,
      bio: profile.bio,
      avatarUrl: resolveMediaUrl(profile.avatarUrl),
      coverUrl: resolveMediaUrl(profile.coverUrl),
      phone: profile.phone || profile.phoneNumber || profile.directPhone,
      whatsapp:
        profile.whatsapp ||
        profile.whatsappNumber ||
        profile.whatsappDirectNumber ||
        profile.customFields?.whatsapp,
      email: profile.email,
      website: profile.website,
      address: profile.address,
      location: profile.location || profile.address,
      profileType: profile.profileType || 'personal',
      socialLinks: profile.socialLinks || [],
      templateId: canonicalTemplateId(profile.templateId || profile.themeId, profile.profileType),
      themeConfig: profile.customThemeColors || profile.themeConfig || {},
      customFields: profile.customFields || {},
      renderSource: isFromNfc ? ('nfc_redirect' as const) : ('public_url' as const),
      fetchStatus: 'loaded',
      businesses: (profile.businesses || []).map((b: any) => ({
        id: b.id,
        companyName: b.companyName || b.name,
        name: b.name || b.companyName,
        tagline: b.jobTitle || b.tagline,
        roleTitle: b.roleTitle || b.jobTitle || b.tagline,
        description: b.description || undefined,
        websiteUrl: b.businessWebsite || b.websiteUrl || b.website,
        website: b.website || b.businessWebsite || b.websiteUrl,
        address: b.businessAddress || b.address,
        logoUrl: resolveMediaUrl(b.logoUrl),
        email: b.email || b.businessEmail,
        phone: b.phone || b.businessPhone,
        whatsapp: b.whatsapp,
      })),
      catalogue: (profile.catalogue || []).map((c: any) => ({
        id: c.id,
        title: c.title,
        type: c.type || c.itemType || 'product',
        itemType: c.itemType || c.type || 'product',
        description: c.description,
        price: c.price,
        currency: c.currency || '₹',
        imageUrl: c.imageUrl,
        actionUrl: c.actionUrl,
        actionLabel: c.actionLabel || 'Enquire',
      })),
      // Respect section visibility settings
      sections: (profile.sections || [])
        .filter((s: any) => s.isEnabled !== false)
        .map((s: any) => ({
          id: s.id,
          sectionType: s.sectionType,
          title: s.title,
          isEnabled: s.isEnabled,
          displayOrder: s.orderIndex,
          configJson: s.content,
        })),
    };
  }, [profile]);

  // 1. Minimal Loading State
  if (!isReserved && isLoading) {
    return (
      <div
        className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center p-4 font-body"
        aria-busy="true"
        aria-label="Loading Digital Profile"
      >
        <div className="mb-5">
          <BrandLogo variant="symbol" size="md" />
        </div>
        <div className="flex items-center gap-2" role="status" aria-label="Loading">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF6A00] animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF6A00] animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF6A00] animate-bounce" />
        </div>
      </div>
    );
  }

  // 2. Network / 5xx Error (distinct from confirmed 404)
  if (isError && !isConfirmedNotFoundError(error)) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] text-[#171717] flex flex-col items-center justify-center px-4 text-center font-body">
        <div className="mb-5">
          <BrandLogo variant="symbol" size="md" />
        </div>
        <h1 className="font-head text-lg font-semibold text-[#171717] mb-2">
          Unable to load profile
        </h1>
        <p className="text-xs text-[#666666] mb-5">
          Please check your connection and try again.
        </p>
        <Button
          type="button"
          onClick={() => refetch()}
          className="px-5 py-2.5 rounded-xl bg-[#FF6A00] hover:bg-[#E85D00] text-white font-semibold text-xs gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </Button>
      </div>
    );
  }

  // 3. Unpublished / Unavailable Profile
  const isUnpublished =
    profile &&
    profile.status &&
    profile.status !== 'PUBLISHED' &&
    profile.status !== 'ACTIVE' &&
    profile.status !== 'APPROVED';

  if (isUnpublished) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] text-[#171717] flex flex-col items-center justify-center px-4 text-center font-body">
        <div className="mb-5">
          <BrandLogo variant="symbol" size="md" />
        </div>
        <h1 className="font-head text-lg font-semibold text-[#171717] mb-4">
          Profile unavailable
        </h1>
        <Link
          to="/"
          className="text-xs font-semibold text-[#FF6A00] hover:underline"
        >
          Go to Taptch
        </Link>
      </div>
    );
  }

  // 4. Minimal Profile Not Found (Reserved, 404, or Empty)
  if (isReserved || isError || !profile || !renderData) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] text-[#171717] flex flex-col items-center justify-center px-4 text-center font-body">
        <div className="mb-5">
          <BrandLogo variant="symbol" size="md" />
        </div>
        <h1 className="font-head text-lg font-semibold text-[#171717] mb-4">
          Profile not found
        </h1>
        <Link
          to="/"
          className="text-xs font-semibold text-[#FF6A00] hover:underline"
        >
          Go to Taptch
        </Link>
      </div>
    );
  }

  // 5. Render Published Public Profile
  const isBusiness = profile.profileType === 'business';
  const customSeo = (profile.customFields as Record<string, any> | undefined)?.seo;

  const pageTitle =
    customSeo?.title?.trim() ||
    (isBusiness
      ? `${profile.displayName} | Official Business Profile`
      : `${profile.displayName} — ${profile.headline || 'Digital Identity'}`);

  const pageDescription =
    customSeo?.description?.trim() ||
    profile.bio ||
    `Connect with ${profile.displayName} on Taptch.`;

  const ogImage =
    customSeo?.socialImageUrl?.trim() ||
    profile.coverUrl ||
    profile.avatarUrl ||
    `${env.nfcPublicBaseUrl}/taptch-logo-orange.png`;

  const canonicalUrl = `${env.nfcPublicBaseUrl}/${profile.slug}`;
  const robots =
    profile.status === 'PUBLISHED' || profile.status === 'ACTIVE'
      ? 'index, follow'
      : 'noindex, nofollow';

  const jsonLd = isBusiness
    ? {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: profile.displayName,
        description: pageDescription,
        url: canonicalUrl,
        logo: ogImage || profile.avatarUrl || undefined,
        email: profile.email || undefined,
        telephone: profile.phone || undefined,
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: profile.displayName,
        jobTitle: profile.headline || undefined,
        description: pageDescription,
        image: ogImage || profile.avatarUrl || undefined,
        url: canonicalUrl,
        email: profile.email || undefined,
        telephone: profile.phone || undefined,
      };

  return (
    <div className="min-h-screen bg-black">
      <MetaTags
        title={pageTitle}
        description={pageDescription}
        canonicalUrl={canonicalUrl}
        ogImage={ogImage}
        ogType={isBusiness ? 'business.business' : 'profile'}
        siteName="Taptch"
        twitterCard="summary_large_image"
        robots={robots}
        jsonLd={jsonLd}
      />
      <ProfileRenderer profile={renderData as any} />
    </div>
  );
}
