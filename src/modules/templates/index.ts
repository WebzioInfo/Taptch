import { eq, and, asc, or, ilike } from 'drizzle-orm';
import { db } from '@/db';
import { templates } from '@/db/schema/profiles';

export interface TemplateThemeConfig {
  primaryColor?: string;
  background?: string;
  cardBg?: string;
  fontFamily?: string;
  buttonStyle?: string;
  borderRadius?: string;
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
 * Retrieve a list of templates matching optional filters
 */
export async function listTemplates(filters: TemplateFilters = {}): Promise<Template[]> {
  const conditions = [];

  // Default to active-only unless explicitly asked
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

  // Filter in memory for JSON array fields and plan rank if provided
  let filtered = results as Template[];

  if (filters.profileType) {
    filtered = filtered.filter((t) =>
      Array.isArray(t.supportedProfileTypes) && t.supportedProfileTypes.includes(filters.profileType!)
    );
  }

  if (filters.planId) {
    filtered = filtered.filter((t) => canAccessTemplate(t.requiredPlanId, filters.planId));
  }

  return filtered;
}

/**
 * Get template by ID
 */
export async function getTemplateById(id: string): Promise<Template> {
  const rows = await db
    .select()
    .from(templates)
    .where(eq(templates.id, id))
    .limit(1);

  if (!rows || rows.length === 0) {
    throw new TemplateNotFoundError(id);
  }

  return rows[0] as Template;
}

/**
 * Get template by Slug
 */
export async function getTemplateBySlug(slug: string): Promise<Template> {
  const rows = await db
    .select()
    .from(templates)
    .where(eq(templates.slug, slug))
    .limit(1);

  if (!rows || rows.length === 0) {
    throw new TemplateNotFoundError(slug);
  }

  return rows[0] as Template;
}
