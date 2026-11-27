export interface ThemeColorsConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  cardBackground: string;
  text: string;
  heading: string;
  buttonBackground: string;
  buttonText: string;
  border: string;
  [key: string]: string;
}

export const CINEMATIC_DEFAULT_PALETTE: ThemeColorsConfig = {
  primary: '#0866F8',
  secondary: '#1A73F8',
  accent: '#0866F8',
  background: '#0A0A0B',
  cardBackground: '#111113',
  text: '#EDEBE6',
  heading: '#EDEBE6',
  buttonBackground: '#0866F8',
  buttonText: '#FFFFFF',
  border: 'rgba(237, 235, 230, 0.1)',
};

export const DARK_PREMIUM_DEFAULT_PALETTE: ThemeColorsConfig = {
  primary: '#C5A880',
  secondary: '#D8BD96',
  accent: '#C5A880',
  background: '#08090A',
  cardBackground: '#121316',
  surface: '#1A1C20',
  text: '#F4F4F6',
  heading: '#F4F4F6',
  buttonBackground: '#C5A880',
  buttonText: '#0C0D0E',
  border: '#22252A',
};

export const DEFAULT_THEME_PALETTES: Record<string, ThemeColorsConfig> = {
  'cinematic-noir': CINEMATIC_DEFAULT_PALETTE,
  'dark-premium': DARK_PREMIUM_DEFAULT_PALETTE,
};

export const PLAN_TIER_RANK: Record<'nano' | 'micro' | 'mini' | 'max', number> = {
  nano: 1,
  micro: 2,
  mini: 3,
  max: 4,
};

export function canAccessTemplate(
  requiredTier: 'nano' | 'micro' | 'mini' | 'max',
  userTier: 'nano' | 'micro' | 'mini' | 'max',
): boolean {
  return PLAN_TIER_RANK[userTier] >= PLAN_TIER_RANK[requiredTier];
}

export interface StandardTemplateDefinition {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: 'luxury' | 'minimal' | 'corporate' | 'creative' | 'business';
  templateType: 'PERSONAL' | 'BUSINESS';
  supportedProfileTypes: ('personal' | 'business')[];
  thumbnailUrl: string;
  premiumTier: 'nano' | 'micro' | 'mini' | 'max';
  requiredPlanId?: 'nano' | 'micro' | 'mini' | 'max';
  features: string[];
  defaultColors: {
    primary: string;
    background: string;
    surface: string;
    text: string;
  };
}

/**
 * Phase 1 Profile Template Registry:
 * Supports the new two-template architecture.
 * Slot 1: Cinematic Digital Profile ('cinematic-noir') — active (Personal Profile template).
 * Slot 2: Reserved for Phase 2 implementation.
 */
export const STANDARD_TEMPLATES: StandardTemplateDefinition[] = [
  {
    id: 'cinematic-noir',
    slug: 'cinematic-noir',
    name: 'Cinematic Digital Profile',
    description:
      'Dark editorial portrait profile with animated curtain intro, film grain vignette, numbered ventures roster, and instant UPI/vCard terminal.',
    category: 'luxury',
    templateType: 'PERSONAL',
    supportedProfileTypes: ['personal'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
    premiumTier: 'nano',
    requiredPlanId: 'nano',
    features: [
      'Cinematic Curtain Intro',
      'Full-Screen Portrait Hero',
      'Editorial Ventures & Education',
      'UPI QR Modal & vCard Sync',
    ],
    defaultColors: {
      primary: '#0866F8',
      background: '#0A0A0B',
      surface: '#111113',
      text: '#EDEBE6',
    },
  },
  {
    id: 'dark-premium',
    slug: 'dark-premium',
    name: 'Dark Premium',
    description:
      'Near-black architectural layout with restrained champagne gold accent, bold Plus Jakarta Sans typography, and high-contrast contact rows.',
    category: 'luxury',
    templateType: 'PERSONAL',
    supportedProfileTypes: ['personal', 'business'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
    premiumTier: 'nano',
    requiredPlanId: 'nano',
    features: [
      'Champagne Gold Accent',
      'Plus Jakarta Sans Typography',
      'Ventures & Catalogue Support',
      'Direct Coordinates & vCard',
    ],
    defaultColors: {
      primary: '#C5A880',
      background: '#08090A',
      surface: '#121316',
      text: '#F4F4F6',
    },
  },
];

export interface TemplatePreviewPlaceholder {
  slug: string;
  displayName: string;
  headline: string;
  location: string;
  bio: string;
  avatarUrl: string;
  phone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  education: string;
  businesses: Array<{
    id: string;
    companyName: string;
    tagline: string;
    roleTitle: string;
    websiteUrl?: string;
    logoUrl?: string;
  }>;
}

export const TEMPLATE_PREVIEW_PLACEHOLDER: TemplatePreviewPlaceholder = {
  slug: 'alex-morgan',
  displayName: 'Alex Morgan',
  headline: 'Entrepreneur',
  location: 'London, UK',
  bio: 'Building digital products and creative technology ventures.',
  avatarUrl: '',
  phone: '+44 7700 900077',
  whatsapp: '+44 7700 900077',
  email: 'alex@example.com',
  instagram: '@alexmorgan',
  education: 'Business Administration',
  businesses: [
    {
      id: 'preview-v1',
      companyName: 'Nova Technologies',
      tagline: 'Founder',
      roleTitle: 'Founder',
    },
    {
      id: 'preview-v2',
      companyName: 'Creative Labs',
      tagline: 'Co-Founder',
      roleTitle: 'Co-Founder',
    },
  ],
};

export function getTemplateDefaultThemeConfig(templateId?: string | null): ThemeColorsConfig {
  const norm = (templateId || 'cinematic-noir').toLowerCase().trim();
  return { ...(DEFAULT_THEME_PALETTES[norm] || CINEMATIC_DEFAULT_PALETTE) };
}
