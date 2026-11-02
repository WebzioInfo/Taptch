export interface TemplateThemeConfig {
  primaryColor?: string;
  background?: string;
  cardBg?: string;
  fontFamily?: string;
  buttonStyle?: string;
  borderRadius?: string;
  accent?: string;
  [key: string]: unknown;
}

export interface Template {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  thumbnailUrl: string;
  supportedProfileTypes: string[];
  requiredPlanId: string;
  defaultThemeConfig: TemplateThemeConfig;
  isFeatured: boolean;
  isActive: boolean;
  displayOrder: number;
  features?: string[];
  supportedDevices?: string[];
  usageCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export const PLAN_TIER_RANK: Record<string, number> = {
  nano: 1,
  micro: 2,
  mini: 3,
  max: 4,
};

export class TemplateNotFoundError extends Error {
  constructor(identifier: string) {
    super(`Template with identifier "${identifier}" was not found.`);
    this.name = 'TemplateNotFoundError';
  }
}

export class TemplatePlanRequirementError extends Error {
  constructor(templateName: string, requiredPlanId: string, currentPlanId: string) {
    super(`Template "${templateName}" requires the ${requiredPlanId.toUpperCase()} plan or higher (Current plan: ${currentPlanId.toUpperCase()}).`);
    this.name = 'TemplatePlanRequirementError';
  }
}

/**
 * Check if a given user plan satisfies the template's required plan tier.
 */
export function canAccessTemplate(requiredPlanId: string, userPlanId: string = 'nano'): boolean {
  const userRank = PLAN_TIER_RANK[userPlanId.toLowerCase()] ?? 1;
  const requiredRank = PLAN_TIER_RANK[requiredPlanId.toLowerCase()] ?? 1;
  return userRank >= requiredRank;
}

/**
 * Authoritative 8-Template Catalog for Mass Marketing & Business Directory
 */
export const STANDARD_TEMPLATES: Omit<Template, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'industrial-manufacturing',
    name: 'Industrial & Manufacturing',
    slug: 'industrial-manufacturing',
    description: 'Heavy machinery, plant specs, technical PDF brochures, and direct RFQ engineering enquiry.',
    category: 'industrial',
    thumbnailUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80',
    supportedProfileTypes: ['business'],
    requiredPlanId: 'mini',
    defaultThemeConfig: { primaryColor: '#D97706', background: '#0F172A', cardBg: '#1E293B', fontFamily: 'Plus Jakarta Sans', accent: '#F59E0B' },
    isFeatured: true,
    isActive: true,
    displayOrder: 1,
    features: ['Machinery Catalogue', 'Technical PDF Specs', 'Plant Location', 'Direct RFQ Quotation'],
    supportedDevices: ['Mobile', 'Tablet', 'Desktop'],
  },
  {
    id: 'corporate-business',
    name: 'Corporate Business',
    slug: 'corporate-business',
    description: 'Structured enterprise navy and titanium precision grid for B2B executives, M&A advisors, and holding groups.',
    category: 'corporate',
    thumbnailUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
    supportedProfileTypes: ['personal', 'business'],
    requiredPlanId: 'mini',
    defaultThemeConfig: { primaryColor: '#2563EB', background: '#0B0F19', cardBg: '#111827', fontFamily: 'Plus Jakarta Sans', accent: '#3B82F6' },
    isFeatured: true,
    isActive: true,
    displayOrder: 2,
    features: ['Executive Header', 'Corporate Credentials', 'Venture Switcher', 'B2B Enquiry Form'],
    supportedDevices: ['Mobile', 'Tablet', 'Desktop'],
  },
  {
    id: 'modern-business',
    name: 'Modern Business',
    slug: 'modern-business',
    description: 'Commercial showcase design featuring dedicated product shelves, service cards, and quick lead capture.',
    category: 'business',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    supportedProfileTypes: ['business', 'personal'],
    requiredPlanId: 'mini',
    defaultThemeConfig: { primaryColor: '#059669', background: '#064E3B', cardBg: '#065F46', fontFamily: 'Plus Jakarta Sans', accent: '#10B981' },
    isFeatured: true,
    isActive: true,
    displayOrder: 3,
    features: ['Product/Service Showcase', 'Dual Tab Navigation', 'Contact Exchange', 'Fast Booking'],
    supportedDevices: ['Mobile', 'Tablet', 'Desktop'],
  },
  {
    id: 'premium-brand',
    name: 'Premium Brand',
    slug: 'premium-brand',
    description: 'Signature luxury dark aesthetic with brushed metallic gold accents, VIP contact cards, and high-contrast typography.',
    category: 'personal',
    thumbnailUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80',
    supportedProfileTypes: ['personal', 'business'],
    requiredPlanId: 'nano',
    defaultThemeConfig: { primaryColor: '#D4AF37', background: '#0A0A0C', cardBg: '#121216', fontFamily: 'Plus Jakarta Sans', accent: '#D4AF37' },
    isFeatured: true,
    isActive: true,
    displayOrder: 4,
    features: ['Obsidian Luxury Theme', 'vCard 3.0 Instant Save', 'VIP Verified Shield', 'High-Contrast Cards'],
    supportedDevices: ['Mobile', 'Tablet', 'Desktop'],
  },
  {
    id: 'professional-services',
    name: 'Professional Services',
    slug: 'professional-services',
    description: 'Warm alabaster editorial aesthetic with timeless serif headings, subtle dividers, and high legibility for legal & advisory.',
    category: 'personal',
    thumbnailUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
    supportedProfileTypes: ['personal', 'business'],
    requiredPlanId: 'nano',
    defaultThemeConfig: { primaryColor: '#8C6D3B', background: '#FAF8F5', cardBg: '#FFFFFF', fontFamily: 'Playfair Display', accent: '#8C6D3B' },
    isFeatured: true,
    isActive: true,
    displayOrder: 5,
    features: ['Editorial Serif Typography', 'Partner Credentials', 'Chambers Location', 'Discreet vCard'],
    supportedDevices: ['Mobile', 'Tablet', 'Desktop'],
  },
  {
    id: 'retail-shopping',
    name: 'Retail & Shopping',
    slug: 'retail-shopping',
    description: 'Vibrant storefront with product gallery, INR price tags, store hours, and direct WhatsApp ordering.',
    category: 'retail',
    thumbnailUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=80',
    supportedProfileTypes: ['business'],
    requiredPlanId: 'micro',
    defaultThemeConfig: { primaryColor: '#E11D48', background: '#0F172A', cardBg: '#1E293B', fontFamily: 'Plus Jakarta Sans', accent: '#FB7185' },
    isFeatured: true,
    isActive: true,
    displayOrder: 6,
    features: ['Storefront Product Grid', 'WhatsApp Quick Buy', 'Opening Hours Badge', 'Physical Store Location'],
    supportedDevices: ['Mobile', 'Tablet', 'Desktop'],
  },
  {
    id: 'food-restaurant',
    name: 'Food & Restaurant',
    slug: 'food-restaurant',
    description: 'Culinary layout with signature menu cards, chef specialties, opening timings, and table reservation enquiry.',
    category: 'food',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
    supportedProfileTypes: ['business'],
    requiredPlanId: 'micro',
    defaultThemeConfig: { primaryColor: '#EA580C', background: '#18181B', cardBg: '#27272A', fontFamily: 'Plus Jakarta Sans', accent: '#F97316' },
    isFeatured: true,
    isActive: true,
    displayOrder: 7,
    features: ['Chef Specials Showcase', 'Menu Pricing & Categories', 'Table Reservation', 'Kitchen Timings'],
    supportedDevices: ['Mobile', 'Tablet', 'Desktop'],
  },
  {
    id: 'creative-agency',
    name: 'Creative & Agency',
    slug: 'creative-agency',
    description: 'Vibrant neon-infused glassmorphism designed for digital creators, artists, agency founders, and designers.',
    category: 'creative',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
    supportedProfileTypes: ['personal', 'business'],
    requiredPlanId: 'micro',
    defaultThemeConfig: { primaryColor: '#A855F7', background: '#0B0D1B', cardBg: '#151833', fontFamily: 'Plus Jakarta Sans', accent: '#C084FC' },
    isFeatured: true,
    isActive: true,
    displayOrder: 8,
    features: ['Glassmorphic Backdrop Blur', 'Visual Portfolio Grid', 'Social Link Showcase', 'Interactive Project Cards'],
    supportedDevices: ['Mobile', 'Tablet', 'Desktop'],
  },
  {
    id: 'apex-capital',
    name: 'Apex Capital & Wealth',
    slug: 'apex-capital',
    description: 'Prestige emerald and dark graphite tailored for luxury real estate developers, venture capital, and private wealth.',
    category: 'real-estate',
    thumbnailUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80',
    supportedProfileTypes: ['personal', 'business'],
    requiredPlanId: 'max',
    defaultThemeConfig: { primaryColor: '#10B981', background: '#022C22', cardBg: '#064E3B', fontFamily: 'Cinzel', accent: '#34D399' },
    isFeatured: false,
    isActive: true,
    displayOrder: 9,
    features: ['Prestige Luxury Styling', 'Private Off-Market Assets', 'Escrow Concierge', 'VIP Wealth Advisory'],
    supportedDevices: ['Mobile', 'Tablet', 'Desktop'],
  },
];

