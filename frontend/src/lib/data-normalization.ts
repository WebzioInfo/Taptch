/**
 * Taptch Production Data Normalization & Safe String Operations
 * Ensures zero unhandled TypeErrors from `.trim()`, `.toLowerCase()`, `.split()`, or missing API properties.
 */

import {
  getTemplateDefaultThemeConfig,
  type ThemeColorsConfig,
} from '../modules/templates/constants';

/**
 * Safely trims any value. Never throws on null, undefined, objects, numbers, or non-strings.
 */
export function safeTrim(val: unknown, fallback: string = ''): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'number' || typeof val === 'boolean') return String(val).trim();
  return fallback;
}

/**
 * Guarantees a safe string. Never returns null, undefined, or 'undefined' string.
 */
export function safeString(val: unknown, fallback: string = ''): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  return fallback;
}

/**
 * Safely converts any value to trimmed lowercase without throwing.
 */
export function safeLower(val: unknown, fallback: string = ''): string {
  return safeTrim(val, fallback).toLowerCase();
}

/**
 * Safely sanitizes a public profile slug.
 */
export function safeSlug(val: unknown, fallback: string = ''): string {
  return safeLower(val, fallback).replace(/[^a-z0-9_-]/g, '');
}

/**
 * Normalized representation of profile builder state.
 */
export interface NormalizedProfileState {
  displayName: string;
  slug: string;
  headline: string;
  bio: string;
  avatarUrl: string;
  coverUrl: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  address: string;
  templateId: string;
  profileType: 'personal' | 'business';
  themeColors: ThemeColorsConfig;
  seoTitle: string;
  seoDescription: string;
  socialImageUrl: string;
  socialLinks: Array<{ id: string; platform: string; url: string }>;
  businesses: Array<{
    id: string;
    companyName: string;
    jobTitle: string;
    businessWebsite: string;
    businessAddress: string;
    businessEmail?: string;
    businessPhone?: string;
    logoUrl?: string;
  }>;
  catalogue: Array<{
    id: string;
    title: string;
    type: 'product' | 'service';
    price: string;
    description: string;
    imageUrl?: string;
    actionUrl?: string;
    currency?: string;
  }>;
}

/**
 * Normalizes any raw profile object (from API, older drafts, or initial state).
 * Completely eliminates missing-field runtime failures.
 */
export function normalizeProfileDraft(raw: any): NormalizedProfileState {
  if (!raw || typeof raw !== 'object') {
    const defaultTpl = 'obsidian-luxury';
    return {
      displayName: '',
      slug: '',
      headline: '',
      bio: '',
      avatarUrl: '',
      coverUrl: '',
      phone: '',
      whatsapp: '',
      email: '',
      website: '',
      address: '',
      templateId: defaultTpl,
      profileType: 'personal',
      themeColors: getTemplateDefaultThemeConfig(defaultTpl),
      seoTitle: '',
      seoDescription: '',
      socialImageUrl: '',
      socialLinks: [],
      businesses: [],
      catalogue: [],
    };
  }

  const rawTemplate = safeLower(raw.templateId || raw.themeId, 'obsidian-luxury');
  const defaultColors = getTemplateDefaultThemeConfig(rawTemplate);
  const rawCustomColors =
    raw.themeConfig && typeof raw.themeConfig === 'object'
      ? raw.themeConfig
      : raw.customThemeColors && typeof raw.customThemeColors === 'object'
        ? raw.customThemeColors
        : {};

  const mergedColors: ThemeColorsConfig = {
    ...defaultColors,
    ...rawCustomColors,
  };

  const rawCustomFields = raw.customFields && typeof raw.customFields === 'object' ? raw.customFields : {};
  const rawSeo = rawCustomFields.seo && typeof rawCustomFields.seo === 'object' ? rawCustomFields.seo : {};

  // Normalize social links safely
  const socialLinks: Array<{ id: string; platform: string; url: string }> = [];
  if (Array.isArray(raw.socialLinks)) {
    (raw.socialLinks as any[]).forEach((item: any, idx: number) => {
      if (item && typeof item === 'object') {
        socialLinks.push({
          id: safeTrim(item.id, `social-${idx}-${Date.now()}`),
          platform: safeLower(item.platform, 'instagram'),
          url: safeTrim(item.url, ''),
        });
      }
    });
  }

  // Normalize businesses safely
  const businesses: NormalizedProfileState['businesses'] = [];
  if (Array.isArray(raw.businesses)) {
    (raw.businesses as any[]).forEach((b: any, idx: number) => {
      if (b && typeof b === 'object') {
        businesses.push({
          id: safeTrim(b.id, `biz-${idx}-${Date.now()}`),
          companyName: safeTrim(b.companyName || b.name, ''),
          jobTitle: safeTrim(b.jobTitle || b.tagline, ''),
          businessWebsite: safeTrim(b.businessWebsite || b.website || b.websiteUrl, ''),
          businessAddress: safeTrim(b.businessAddress || b.address, ''),
          businessEmail: safeTrim(b.businessEmail || b.email, ''),
          businessPhone: safeTrim(b.businessPhone || b.phone, ''),
          logoUrl: safeTrim(b.logoUrl, ''),
        });
      }
    });
  }

  // Normalize catalogue safely
  const catalogue: NormalizedProfileState['catalogue'] = [];
  if (Array.isArray(raw.catalogue)) {
    (raw.catalogue as any[]).forEach((c: any, idx: number) => {
      if (c && typeof c === 'object') {
        catalogue.push({
          id: safeTrim(c.id, `cat-${idx}-${Date.now()}`),
          title: safeTrim(c.title, ''),
          type: c.type === 'service' || c.itemType === 'service' ? 'service' : 'product',
          price: safeTrim(c.price, '₹'),
          description: safeTrim(c.description, ''),
          imageUrl: safeTrim(c.imageUrl, ''),
          actionUrl: safeTrim(c.actionUrl, ''),
          currency: safeTrim(c.currency, '₹'),
        });
      }
    });
  }

  return {
    displayName: safeTrim(raw.displayName, ''),
    slug: safeSlug(raw.slug, ''),
    headline: safeTrim(raw.headline, ''),
    bio: safeTrim(raw.bio, ''),
    avatarUrl: safeTrim(raw.avatarUrl, ''),
    coverUrl: safeTrim(raw.coverUrl, ''),
    phone: safeTrim(raw.phone || raw.phoneNumber || raw.directPhone, ''),
    whatsapp: safeTrim(raw.whatsapp || raw.whatsappNumber || raw.whatsappDirectNumber || raw.customFields?.whatsapp, ''),
    email: safeTrim(raw.email, ''),
    website: safeTrim(raw.website, ''),
    address: safeTrim(raw.address, ''),
    templateId: rawTemplate,
    profileType: raw.profileType === 'business' ? 'business' : 'personal',
    themeColors: mergedColors,
    seoTitle: safeTrim(rawSeo.title, ''),
    seoDescription: safeTrim(rawSeo.description, ''),
    socialImageUrl: safeTrim(rawSeo.socialImageUrl, ''),
    socialLinks,
    businesses,
    catalogue,
  };
}
