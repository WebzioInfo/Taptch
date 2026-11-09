/**
 * TAPTCH PROFILE COMPLETION & PRE-PUBLICATION VALIDATION ENGINE
 * Classifies pre-publish state into Blocking Errors, Quality Warnings, and Enhancement Suggestions.
 */

import { isValidUpiId } from '@/lib/upi';

export interface ProfileValidationItem {
  id: string;
  category: 'blocking' | 'warning' | 'suggestion';
  tab: string; // Editor tab to jump to (e.g. 'identity', 'contacts', 'upi')
  field?: string;
  message: string;
  recommendation?: string;
}

export interface ProfileValidationResult {
  canPublish: boolean;
  score: number; // 0 - 100 completion percentage
  blockingErrors: ProfileValidationItem[];
  warnings: ProfileValidationItem[];
  suggestions: ProfileValidationItem[];
  summary: {
    identityStatus: 'complete' | 'incomplete';
    contactStatus: 'complete' | 'partial' | 'missing';
    socialCount: number;
    businessCount: number;
    catalogueCount: number;
    hasAvatar: boolean;
    hasCover: boolean;
    hasUpi: boolean;
  };
}

export interface ProfileValidateInput {
  displayName?: string | null;
  headline?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  socialLinks?: Record<string, string | undefined> | Array<{ platform: string; url: string }> | null;
  businesses?: Array<unknown> | null;
  catalogue?: Array<unknown> | null;
  customFields?: {
    upiConfig?: {
      upiId?: string;
      isEnabled?: boolean;
    };
  } | null;
  themeConfig?: Record<string, unknown> | null;
}

export function validateProfileForPublishing(profile: ProfileValidateInput): ProfileValidationResult {
  const blocking: ProfileValidationItem[] = [];
  const warnings: ProfileValidationItem[] = [];
  const suggestions: ProfileValidationItem[] = [];

  let score = 20; // Baseline

  // 1. Identity Validation
  const displayName = profile.displayName?.trim() || '';
  if (!displayName) {
    blocking.push({
      id: 'missing-name',
      category: 'blocking',
      tab: 'identity',
      field: 'displayName',
      message: 'Display Name is required to publish.',
      recommendation: 'Enter your personal or business display name.',
    });
  } else if (displayName.length < 2) {
    blocking.push({
      id: 'short-name',
      category: 'blocking',
      tab: 'identity',
      field: 'displayName',
      message: 'Display Name must be at least 2 characters.',
    });
  } else {
    score += 20;
  }

  // Profile Avatar
  if (!profile.avatarUrl) {
    warnings.push({
      id: 'missing-avatar',
      category: 'warning',
      tab: 'identity',
      field: 'avatarUrl',
      message: 'Profile image is missing.',
      recommendation: 'Adding an executive avatar or company logo dramatically boosts connection rates.',
    });
  } else {
    score += 15;
  }

  // Profile Cover
  if (!profile.coverUrl) {
    suggestions.push({
      id: 'missing-cover',
      category: 'suggestion',
      tab: 'identity',
      field: 'coverUrl',
      message: 'Cover banner is not configured.',
      recommendation: 'A branded cover banner elevates executive prestige.',
    });
  } else {
    score += 5;
  }

  // Bio / Headline
  if (!profile.headline && !profile.bio) {
    warnings.push({
      id: 'missing-headline',
      category: 'warning',
      tab: 'identity',
      field: 'headline',
      message: 'No professional headline or biography provided.',
      recommendation: 'Add your job title or company designation.',
    });
  } else {
    score += 10;
  }

  // 2. Contacts Validation
  const hasPhone = Boolean(profile.phone?.trim());
  const hasEmail = Boolean(profile.email?.trim());
  const hasWebsite = Boolean(profile.website?.trim());

  if (!hasPhone && !hasEmail && !hasWebsite) {
    warnings.push({
      id: 'missing-all-contacts',
      category: 'warning',
      tab: 'contacts',
      message: 'No primary contact channels (phone, email, website) are configured.',
      recommendation: 'Provide at least one method for visitors to reach you.',
    });
  } else {
    score += 15;
  }

  if (hasEmail && profile.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profile.email.trim())) {
      blocking.push({
        id: 'invalid-email',
        category: 'blocking',
        tab: 'contacts',
        field: 'email',
        message: 'Email address format is invalid.',
      });
    }
  }

  // 3. Social Media Links
  let socialCount = 0;
  if (Array.isArray(profile.socialLinks)) {
    socialCount = profile.socialLinks.filter((s) => Boolean(s.url?.trim())).length;
  } else if (profile.socialLinks && typeof profile.socialLinks === 'object') {
    socialCount = Object.values(profile.socialLinks).filter((u) => Boolean(u?.trim())).length;
  }

  if (socialCount === 0) {
    suggestions.push({
      id: 'no-socials',
      category: 'suggestion',
      tab: 'socials',
      message: 'No social media or networking profiles attached.',
      recommendation: 'Link LinkedIn, X, or Instagram to expand your digital footprint.',
    });
  } else {
    score += 10;
  }

  // 4. UPI Payment Validation
  const upiConfig = profile.customFields?.upiConfig;
  const isUpiEnabled = Boolean(upiConfig?.isEnabled);
  if (isUpiEnabled) {
    if (!upiConfig?.upiId || !isValidUpiId(upiConfig.upiId)) {
      blocking.push({
        id: 'invalid-upi',
        category: 'blocking',
        tab: 'upi',
        field: 'upiId',
        message: 'UPI Payment is enabled, but the UPI ID / VPA is invalid (e.g. name@upi).',
        recommendation: 'Enter a valid Virtual Payment Address or disable UPI.',
      });
    } else {
      score += 5;
    }
  }

  // 5. Ventures & Catalogue
  const businessCount = profile.businesses?.length || 0;
  const catalogueCount = profile.catalogue?.length || 0;

  if (businessCount > 0) score += 5;
  if (catalogueCount > 0) score += 5;

  return {
    canPublish: blocking.length === 0,
    score: Math.min(100, score),
    blockingErrors: blocking,
    warnings,
    suggestions,
    summary: {
      identityStatus: displayName ? 'complete' : 'incomplete',
      contactStatus: hasPhone && hasEmail ? 'complete' : hasPhone || hasEmail || hasWebsite ? 'partial' : 'missing',
      socialCount,
      businessCount,
      catalogueCount,
      hasAvatar: Boolean(profile.avatarUrl),
      hasCover: Boolean(profile.coverUrl),
      hasUpi: isUpiEnabled && Boolean(upiConfig?.upiId),
    },
  };
}

