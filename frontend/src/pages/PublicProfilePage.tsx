import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ApiClient } from '../services/api';
import { ProfileRenderer } from '../components/templates/ProfileRenderer';
import { MetaTags } from '../components/seo/MetaTags';
import { BrandLogo } from '../components/brand';
import { isReservedUsername } from '../config/reservedUsernames';
import { Loader2, AlertCircle, RefreshCw, Sparkles, Home, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';

type ProfileStatus = 'idle' | 'loading' | 'success' | 'not_found' | 'unpublished' | 'error';

export function PublicProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [status, setStatus] = useState<ProfileStatus>('loading');
  const [profile, setProfile] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchProfile = useCallback(async (targetSlug: string) => {
    // 1. Validate against reserved system usernames
    if (isReservedUsername(targetSlug)) {
      setStatus('not_found');
      return;
    }

    // 2. Cancel previous in-flight request to prevent race conditions
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStatus('loading');
    setErrorMessage('');

    // 3. Set a strict 8-second request timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 8000);

    try {
      const data = await ApiClient.get<any>(`/api/v1/profiles/by-slug/${targetSlug}`);
      clearTimeout(timeoutId);

      // Verify profile is published or active
      if (data && data.status && data.status !== 'PUBLISHED' && data.status !== 'ACTIVE') {
        setStatus('unpublished');
        return;
      }

      if (data && (data.id || data.slug)) {
        setProfile(data);
        setStatus('success');
      } else {
        setStatus('not_found');
      }
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (controller.signal.aborted) {
        // Only set error if not cancelled by user navigating away
        if (!abortControllerRef.current?.signal.aborted) {
          setStatus('error');
          setErrorMessage('Request timed out. The server took too long to respond.');
        }
        return;
      }

      const msg = err?.message || '';
      // Distinguish 404 (not found) from network or 500 server errors
      if (
        msg.includes('not found') ||
        msg.includes('404') ||
        msg.includes('Not Found')
      ) {
        setStatus('not_found');
      } else {
        setStatus('error');
        setErrorMessage(msg || 'Unable to connect to Taptch server. Please check your internet connection.');
      }
    }
  }, []);

  useEffect(() => {
    if (!slug) {
      setStatus('not_found');
      return;
    }

    fetchProfile(slug);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [slug, fetchProfile]);

  // Loading State
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0C] px-4">
        <BrandLogo variant="symbol" size="md" className="mb-6 animate-pulse" />
        <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin mb-4" />
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">
          Loading Digital Profile...
        </p>
      </div>
    );
  }

  // Profile Not Found State (404)
  if (status === 'not_found') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0C] px-4 text-center">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6 shadow-xl">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-3 tracking-tight">
          Profile not found
        </h1>
        <p className="text-sm text-neutral-400 max-w-md mb-8 leading-relaxed">
          We couldn&apos;t find a Taptch profile with this username. The link may be incorrect or the profile may no longer be available.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#E5C058] text-black font-bold text-xs transition-colors inline-flex items-center justify-center gap-2 shadow-lg"
          >
            <Home className="w-4 h-4" />
            <span>Go to Taptch</span>
          </Link>
          <Link
            to="/register"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs border border-white/10 transition-colors inline-flex items-center justify-center gap-2"
          >
            <span>Create Your Profile</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Unpublished / Inactive Profile State
  if (status === 'unpublished') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0C] px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-6">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Profile Unavailable</h1>
        <p className="text-sm text-muted-foreground max-w-md mb-8">
          This digital identity is currently undergoing updates or has been temporarily set to private.
        </p>
        <Link
          to="/"
          className="px-6 py-2.5 rounded-xl bg-[#D4AF37] text-black font-bold text-xs hover:bg-[#E5C058] transition-colors"
        >
          Go to Taptch
        </Link>
      </div>
    );
  }

  // Server / Network Error State (500 or Connection Failed)
  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0C] px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Connection Problem</h1>
        <p className="text-sm text-neutral-400 max-w-md mb-8">
          {errorMessage || 'We encountered a problem loading this profile. Please try again.'}
        </p>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={() => slug && fetchProfile(slug)}
            className="px-6 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C058] text-black font-bold text-xs gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </Button>
          <Link
            to="/"
            className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-xs border border-white/10"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  // Success State -> Render Profile
  if (!profile) return null;

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
    templateId: profile.templateId || profile.themeId || 'clean-corporate',
    themeConfig: profile.customThemeColors || profile.themeConfig || {},
    businesses: (profile.businesses || []).map((b: any) => ({
      id: b.id,
      companyName: b.companyName,
      tagline: b.jobTitle || b.tagline,
      roleTitle: b.roleTitle || b.tagline,
      websiteUrl: b.businessWebsite || b.websiteUrl,
      address: b.businessAddress || b.address,
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
    ? `${profile.displayName} | Official Business Profile`
    : `${profile.displayName} — ${profile.headline || 'Digital Identity'}`;
  const pageDescription =
    profile.bio ||
    `Connect with ${profile.displayName} on Taptch. Access direct contact exchange, portfolio, and verified identity.`;

  const canonicalUrl = `${window.location.origin}/${profile.slug}`;

  const jsonLd = isBusiness
    ? {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: profile.displayName,
        description: pageDescription,
        url: canonicalUrl,
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
        ogImage={profile.avatarUrl || profile.coverUrl}
        ogType={isBusiness ? 'business.business' : 'profile'}
        jsonLd={jsonLd}
      />
      <ProfileRenderer profile={renderData as any} />
    </div>
  );
}
