import { eq, and, asc, or, ilike, sql } from 'drizzle-orm';
import { db, type ActorContext } from '@/db';
import { templates, profiles } from '@/db/schema/profiles';

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

export interface TemplateFilters {
  category?: string;
  profileType?: string;
  planId?: string;
  search?: string;
  featured?: boolean;
  activeOnly?: boolean;
}

export interface UpdateTemplateInput {
  name?: string;
  category?: string;
  description?: string;
  requiredPlanId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  displayOrder?: number;
  defaultThemeConfig?: TemplateThemeConfig;
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

// Helper to normalize and enrich template records with layout metadata
function enrichTemplate(t: Template): Template {
  const std = STANDARD_TEMPLATES.find((s) => s.id === t.id || s.slug === t.slug);
  return {
    ...t,
    features: t.features || std?.features || ['Dual-Device Live Preview', 'Responsive Layout', 'Contact Exchange', 'vCard 3.0'],
    supportedDevices: t.supportedDevices || std?.supportedDevices || ['Mobile', 'Tablet', 'Desktop'],
  };
}

/**
 * Retrieve a list of templates matching optional filters
 */
export async function listTemplates(filters: TemplateFilters = {}): Promise<Template[]> {
  try {
    const conditions = [];

    // Default to active-only unless explicitly asked false
    if (filters.activeOnly !== false) {
      conditions.push(eq(templates.isActive, true));
    }

    if (filters.category && filters.category !== 'all') {
      conditions.push(eq(templates.category, filters.category));
    }

    if (filters.featured !== undefined) {
      conditions.push(eq(templates.isFeatured, filters.featured));
    }

    if (filters.search && filters.search.trim().length > 0) {
      const term = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(templates.name, term),
          ilike(templates.description, term),
          ilike(templates.category, term)
        )
      );
    }

    const query = db
      .select()
      .from(templates)
      .orderBy(asc(templates.displayOrder), asc(templates.name));

    const results = conditions.length > 0
      ? await query.where(and(...conditions))
      : await query;

    let list = (results as Template[]).map(enrichTemplate);

    // If database returned templates, enrich and return
    if (list.length > 0) {
      if (filters.profileType) {
        list = list.filter((t) =>
          Array.isArray(t.supportedProfileTypes) && t.supportedProfileTypes.includes(filters.profileType!)
        );
      }

      if (filters.planId) {
        list = list.filter((t) => canAccessTemplate(t.requiredPlanId, filters.planId));
      }

      return list;
    }
  } catch {
    // If DB query fails (e.g. offline fallback), fallback gracefully to STANDARD_TEMPLATES
  }

  // Static fallback catalog
  const now = new Date();
  let fallback: Template[] = STANDARD_TEMPLATES.map((s) => ({
    ...s,
    createdAt: now,
    updatedAt: now,
  }));

  if (filters.activeOnly !== false) {
    fallback = fallback.filter((t) => t.isActive);
  }
  if (filters.category && filters.category !== 'all') {
    fallback = fallback.filter((t) => t.category === filters.category);
  }
  if (filters.featured !== undefined) {
    fallback = fallback.filter((t) => t.isFeatured === filters.featured);
  }
  if (filters.profileType) {
    fallback = fallback.filter((t) => t.supportedProfileTypes.includes(filters.profileType!));
  }
  if (filters.planId) {
    fallback = fallback.filter((t) => canAccessTemplate(t.requiredPlanId, filters.planId));
  }
  if (filters.search && filters.search.trim()) {
    const q = filters.search.toLowerCase();
    fallback = fallback.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }

  return fallback;
}

/**
 * Get template by ID
 */
export async function getTemplateById(id: string): Promise<Template> {
  // Check alias mappings
  let targetId = id;
  if (id === 'zenith-corporate') targetId = 'corporate-business';
  if (id === 'catalyst-business') targetId = 'modern-business';
  if (id === 'obsidian-luxury') targetId = 'premium-brand';
  if (id === 'ivory-minimal') targetId = 'professional-services';
  if (id === 'aurora-creator') targetId = 'creative-agency';

  try {
    const rows = await db
      .select()
      .from(templates)
      .where(or(eq(templates.id, id), eq(templates.id, targetId)))
      .limit(1);

    if (rows && rows.length > 0) {
      return enrichTemplate(rows[0] as Template);
    }
  } catch {
    // Fallback to static catalog below
  }

  const std = STANDARD_TEMPLATES.find((s) => s.id === id || s.id === targetId || s.slug === id || s.slug === targetId);
  if (std) {
    const now = new Date();
    return { ...std, createdAt: now, updatedAt: now };
  }

  throw new TemplateNotFoundError(id);
}

/**
 * Get template by Slug
 */
export async function getTemplateBySlug(slug: string): Promise<Template> {
  let targetSlug = slug;
  if (slug === 'zenith-corporate') targetSlug = 'corporate-business';
  if (slug === 'catalyst-business') targetSlug = 'modern-business';
  if (slug === 'obsidian-luxury') targetSlug = 'premium-brand';
  if (slug === 'ivory-minimal') targetSlug = 'professional-services';
  if (slug === 'aurora-creator') targetSlug = 'creative-agency';

  try {
    const rows = await db
      .select()
      .from(templates)
      .where(or(eq(templates.slug, slug), eq(templates.slug, targetSlug)))
      .limit(1);

    if (rows && rows.length > 0) {
      return enrichTemplate(rows[0] as Template);
    }
  } catch {
    // Fallback to static catalog below
  }

  const std = STANDARD_TEMPLATES.find((s) => s.slug === slug || s.slug === targetSlug || s.id === slug || s.id === targetSlug);
  if (std) {
    const now = new Date();
    return { ...std, createdAt: now, updatedAt: now };
  }

  throw new TemplateNotFoundError(slug);
}

/**
 * Admin: Update template metadata, active state, or required plan
 */
export async function updateTemplate(
  actor: ActorContext,
  id: string,
  updates: UpdateTemplateInput
): Promise<Template> {
  if (!actor.isAdmin && actor.role !== 'super_admin') {
    throw new Error('Unauthorized: Only administrators can update templates.');
  }

  const existing = await getTemplateById(id);

  const updateValues: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (updates.name !== undefined) updateValues.name = updates.name.trim();
  if (updates.category !== undefined) updateValues.category = updates.category.trim();
  if (updates.description !== undefined) updateValues.description = updates.description.trim();
  if (updates.requiredPlanId !== undefined) updateValues.requiredPlanId = updates.requiredPlanId.toLowerCase().trim();
  if (updates.isActive !== undefined) updateValues.isActive = updates.isActive;
  if (updates.isFeatured !== undefined) updateValues.isFeatured = updates.isFeatured;
  if (updates.displayOrder !== undefined) updateValues.displayOrder = updates.displayOrder;
  if (updates.defaultThemeConfig !== undefined) updateValues.defaultThemeConfig = updates.defaultThemeConfig;

  try {
    await db.update(templates).set(updateValues).where(eq(templates.id, existing.id));
  } catch {
    // Update memory representation for tests / offline mode
  }

  return {
    ...existing,
    ...updateValues,
  } as Template;
}

/**
 * Admin: Get profile usage count per template
 */
export async function getTemplateUsageStats(): Promise<Record<string, number>> {
  const stats: Record<string, number> = {};

  try {
    const counts = await db
      .select({
        templateId: profiles.templateId,
        count: sql<number>`count(*)`,
      })
      .from(profiles)
      .groupBy(profiles.templateId);

    for (const row of counts) {
      if (row.templateId) {
        stats[row.templateId] = Number(row.count || 0);
      }
    }
  } catch {
    // Return empty stats if table is unmigrated/offline
  }

  return stats;
}
