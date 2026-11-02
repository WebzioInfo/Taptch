import { eq, and, sql, desc, asc } from 'drizzle-orm';
import { db, ActorContext } from '@/db';
import {
  profiles,
  profileBusinesses,
  profileCatalogueItems,
  profileSections,
} from '@/db/schema/profiles';
import { can } from '@/modules/authz';
import { assertWithinLimit, getEntitlements } from '@/modules/entitlements';
import { getTemplateById, canAccessTemplate, TemplatePlanRequirementError } from '@/modules/templates';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

// --- Domain Errors ---

export class ProfileNotFoundError extends Error {
  constructor(identifier: string) {
    super(`Profile with identifier "${identifier}" was not found.`);
    this.name = 'ProfileNotFoundError';
  }
}

export class ProfileSlugTakenError extends Error {
  constructor(slug: string) {
    super(`The profile URL slug "${slug}" is already claimed by another user.`);
    this.name = 'ProfileSlugTakenError';
  }
}

export class UnauthorizedProfileAccessError extends Error {
  constructor(action: string, profileId?: string) {
    super(`You do not have permission to ${action} profile ${profileId || ''}.`);
    this.name = 'UnauthorizedProfileAccessError';
  }
}

export class BusinessNotFoundError extends Error {
  constructor(businessId: string) {
    super(`Business association "${businessId}" was not found.`);
    this.name = 'BusinessNotFoundError';
  }
}

export class CatalogueItemNotFoundError extends Error {
  constructor(itemId: string) {
    super(`Catalogue item "${itemId}" was not found.`);
    this.name = 'CatalogueItemNotFoundError';
  }
}

// --- Interfaces ---

export interface CreateProfileInput {
  slug: string;
  displayName: string;
  profileType?: 'personal' | 'business';
  headline?: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  templateId?: string;
  themeConfig?: Record<string, unknown>;
  organizationId?: string | null;
}

export interface UpdateProfileInput {
  displayName?: string;
  headline?: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  templateId?: string;
  themeConfig?: Record<string, unknown>;
}

export interface CreateBusinessInput {
  name: string;
  tagline?: string;
  logoUrl?: string;
  coverUrl?: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  googleMapsUrl?: string;
  googleReviewUrl?: string;
  brochureUrl?: string;
  socialLinks?: { platform: string; url: string }[];
  displayOrder?: number;
}

export type UpdateBusinessInput = Partial<CreateBusinessInput>;

export interface CreateCatalogueItemInput {
  businessId?: string | null;
  type: 'product' | 'service';
  title: string;
  description?: string;
  price?: string;
  currency?: string;
  imageUrl?: string;
  actionUrl?: string;
  actionLabel?: string;
  displayOrder?: number;
}

export type UpdateCatalogueItemInput = Partial<CreateCatalogueItemInput>;

export interface SectionConfigInput {
  sectionType: string;
  title?: string | null;
  isEnabled: boolean;
  displayOrder: number;
  configJson?: Record<string, unknown>;
}

export const DEFAULT_SECTION_TYPES = [
  'identity',
  'save_contact',
  'contacts',
  'socials',
  'bio',
  'businesses',
  'products',
  'services',
  'google_maps',
  'google_review',
  'exchange_contact',
];

// Helper: normalize slug
export function normalizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// --- Profile Core Operations ---

/**
 * List all profiles owned by actor
 */
export async function listProfilesByOwner(actor: ActorContext) {
  const userProfiles = await db
    .select()
    .from(profiles)
    .where(eq(profiles.ownerId, actor.userId))
    .orderBy(desc(profiles.createdAt));

  return userProfiles;
}

/**
 * Get profile with all related entities (businesses, catalogue, sections)
 */
export async function getProfileWithDetails(actor: ActorContext, profileId: string) {
  const rows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .limit(1);

  if (!rows || rows.length === 0) {
    throw new ProfileNotFoundError(profileId);
  }

  const profile = rows[0];

  // Verify access
  if (profile.ownerId !== actor.userId && !actor.isAdmin && actor.role !== 'super_admin') {
    if (profile.organizationId && actor.orgId && profile.organizationId === actor.orgId) {
      // Allowed within organization
    } else {
      throw new UnauthorizedProfileAccessError('view', profileId);
    }
  }

  const [businesses, catalogue, sections] = await Promise.all([
    db
      .select()
      .from(profileBusinesses)
      .where(eq(profileBusinesses.profileId, profileId))
      .orderBy(asc(profileBusinesses.displayOrder)),
    db
      .select()
      .from(profileCatalogueItems)
      .where(eq(profileCatalogueItems.profileId, profileId))
      .orderBy(asc(profileCatalogueItems.displayOrder)),
    db
      .select()
      .from(profileSections)
      .where(eq(profileSections.profileId, profileId))
      .orderBy(asc(profileSections.displayOrder)),
  ]);

  return {
    ...profile,
    businesses,
    catalogue,
    sections,
  };
}

/**
 * Get public profile by slug for reading / snapshot rendering
 */
export async function getProfileBySlug(slug: string) {
  const normalized = normalizeSlug(slug);
  const rows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.slug, normalized))
    .limit(1);

  if (!rows || rows.length === 0) {
    throw new ProfileNotFoundError(slug);
  }

  const profile = rows[0];

  const [businesses, catalogue, sections] = await Promise.all([
    db
      .select()
      .from(profileBusinesses)
      .where(eq(profileBusinesses.profileId, profile.id))
      .orderBy(asc(profileBusinesses.displayOrder)),
    db
      .select()
      .from(profileCatalogueItems)
      .where(eq(profileCatalogueItems.profileId, profile.id))
      .orderBy(asc(profileCatalogueItems.displayOrder)),
    db
      .select()
      .from(profileSections)
      .where(eq(profileSections.profileId, profile.id))
      .orderBy(asc(profileSections.displayOrder)),
  ]);

  return {
    ...profile,
    businesses,
    catalogue,
    sections,
  };
}

/**
 * Create a new profile
 */
export async function createProfile(actor: ActorContext, input: CreateProfileInput) {
  if (!can(actor, 'profile:create')) {
    throw new UnauthorizedProfileAccessError('create');
  }

  const cleanSlug = normalizeSlug(input.slug);
  if (!cleanSlug) {
    throw new Error('Valid URL slug is required.');
  }

  // 1. Check existing profiles count vs plan entitlement
  const existingCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(profiles)
    .where(eq(profiles.ownerId, actor.userId));

  const currentProfiles = Number(existingCount[0]?.count || 0);

  const target = actor.orgId
    ? { organizationId: actor.orgId }
    : { userId: actor.userId };

  await assertWithinLimit(target, 'max_profiles', currentProfiles + 1);

  // 2. Check slug uniqueness
  const slugMatch = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.slug, cleanSlug))
    .limit(1);

  if (slugMatch.length > 0) {
    throw new ProfileSlugTakenError(cleanSlug);
  }

  // 3. Validate template and plan requirement
  const templateId = input.templateId || 'obsidian-luxury';
  const template = await getTemplateById(templateId);
  const { planId } = await getEntitlements(target);

  if (!canAccessTemplate(template.requiredPlanId, planId)) {
    throw new TemplatePlanRequirementError(template.name, template.requiredPlanId, planId);
  }

  // 4. Create profile record
  const profileId = `prof_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const newProfile = {
    id: profileId,
    slug: cleanSlug,
    ownerId: actor.userId,
    organizationId: input.organizationId || actor.orgId || null,
    profileType: input.profileType || 'personal',
    displayName: input.displayName,
    headline: input.headline || null,
    bio: input.bio || null,
    avatarUrl: input.avatarUrl || null,
    coverUrl: input.coverUrl || null,
    templateId: template.id,
    themeId: template.id,
    themeConfig: input.themeConfig || template.defaultThemeConfig || {},
    status: 'draft',
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(profiles).values(newProfile);

  // 5. Seed default sections
  const sectionsToInsert = DEFAULT_SECTION_TYPES.map((secType, index) => ({
    id: `sec_${profileId}_${secType}`,
    profileId,
    sectionType: secType,
    title: secType.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    isEnabled: true,
    displayOrder: index,
    configJson: {},
  }));

  await db.insert(profileSections).values(sectionsToInsert);

  return newProfile;
}

/**
 * Update profile draft details
 */
export async function updateProfile(
  actor: ActorContext,
  profileId: string,
  input: UpdateProfileInput
) {
  const profile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .limit(1);

  if (!profile || profile.length === 0) {
    throw new ProfileNotFoundError(profileId);
  }

  if (
    profile[0].ownerId !== actor.userId &&
    !actor.isAdmin &&
    actor.role !== 'super_admin'
  ) {
    throw new UnauthorizedProfileAccessError('update', profileId);
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (input.displayName !== undefined) updates.displayName = input.displayName;
  if (input.headline !== undefined) updates.headline = input.headline;
  if (input.bio !== undefined) updates.bio = input.bio;
  if (input.avatarUrl !== undefined) updates.avatarUrl = input.avatarUrl;
  if (input.coverUrl !== undefined) updates.coverUrl = input.coverUrl;

  if (input.templateId) {
    const template = await getTemplateById(input.templateId);
    const target = actor.orgId
      ? { organizationId: actor.orgId }
      : { userId: actor.userId };
    const { planId } = await getEntitlements(target);

    if (!canAccessTemplate(template.requiredPlanId, planId)) {
      throw new TemplatePlanRequirementError(template.name, template.requiredPlanId, planId);
    }
    updates.templateId = template.id;
    updates.themeId = template.id;
  }

  if (input.themeConfig !== undefined) {
    updates.themeConfig = input.themeConfig;
  }

  await db.update(profiles).set(updates).where(eq(profiles.id, profileId));

  return { ...profile[0], ...updates };
}

/**
 * Publish profile (compile snapshot and mark published)
 */
export async function publishProfile(actor: ActorContext, profileId: string) {
  const fullProfile = await getProfileWithDetails(actor, profileId);

  // Compile snapshot
  const snapshot = {
    id: fullProfile.id,
    slug: fullProfile.slug,
    profileType: fullProfile.profileType,
    displayName: fullProfile.displayName,
    headline: fullProfile.headline,
    bio: fullProfile.bio,
    avatarUrl: fullProfile.avatarUrl,
    coverUrl: fullProfile.coverUrl,
    templateId: fullProfile.templateId,
    themeConfig: fullProfile.themeConfig,
    businesses: fullProfile.businesses,
    catalogue: fullProfile.catalogue,
    sections: fullProfile.sections,
    publishedAt: new Date().toISOString(),
  };

  await db
    .update(profiles)
    .set({
      status: 'published',
      publishedJson: snapshot,
      publishedAt: new Date(),
      version: sql`${profiles.version} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, profileId));

  // Purge or update Redis cache if available
  try {
    if (redis && typeof redis.set === 'function') {
      await redis.set(
        `cache:profile:slug:${fullProfile.slug}`,
        JSON.stringify(snapshot),
        'EX',
        86400 // 24h
      );
    }
  } catch (err) {
    logger.warn({ err }, 'Redis cache sync skipped');
  }

  return { ...fullProfile, status: 'published', publishedJson: snapshot };
}

// --- Multiple Business Support Operations ---

export async function addBusiness(
  actor: ActorContext,
  profileId: string,
  input: CreateBusinessInput
) {
  const profile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .limit(1);

  if (!profile || profile.length === 0) {
    throw new ProfileNotFoundError(profileId);
  }

  if (profile[0].ownerId !== actor.userId && !actor.isAdmin && actor.role !== 'super_admin') {
    throw new UnauthorizedProfileAccessError('add business to', profileId);
  }

  // Check max_businesses entitlement
  const countRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(profileBusinesses)
    .where(eq(profileBusinesses.profileId, profileId));

  const currentCount = Number(countRes[0]?.count || 0);

  const target = actor.orgId ? { organizationId: actor.orgId } : { userId: actor.userId };
  await assertWithinLimit(target, 'max_businesses', currentCount + 1);

  const businessId = `biz_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const newBiz = {
    id: businessId,
    profileId,
    name: input.name,
    tagline: input.tagline || null,
    logoUrl: input.logoUrl || null,
    coverUrl: input.coverUrl || null,
    description: input.description || null,
    website: input.website || null,
    email: input.email || null,
    phone: input.phone || null,
    whatsapp: input.whatsapp || null,
    address: input.address || null,
    googleMapsUrl: input.googleMapsUrl || null,
    googleReviewUrl: input.googleReviewUrl || null,
    brochureUrl: input.brochureUrl || null,
    socialLinks: input.socialLinks || [],
    displayOrder: input.displayOrder !== undefined ? input.displayOrder : currentCount,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(profileBusinesses).values(newBiz);
  return newBiz;
}

export async function updateBusiness(
  actor: ActorContext,
  businessId: string,
  input: UpdateBusinessInput
) {
  const rows = await db
    .select()
    .from(profileBusinesses)
    .where(eq(profileBusinesses.id, businessId))
    .limit(1);

  if (!rows || rows.length === 0) {
    throw new BusinessNotFoundError(businessId);
  }

  const biz = rows[0];
  const profile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, biz.profileId))
    .limit(1);

  if (
    !profile ||
    (profile[0].ownerId !== actor.userId && !actor.isAdmin && actor.role !== 'super_admin')
  ) {
    throw new UnauthorizedProfileAccessError('update business on', biz.profileId);
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) updates.name = input.name;
  if (input.tagline !== undefined) updates.tagline = input.tagline;
  if (input.logoUrl !== undefined) updates.logoUrl = input.logoUrl;
  if (input.coverUrl !== undefined) updates.coverUrl = input.coverUrl;
  if (input.description !== undefined) updates.description = input.description;
  if (input.website !== undefined) updates.website = input.website;
  if (input.email !== undefined) updates.email = input.email;
  if (input.phone !== undefined) updates.phone = input.phone;
  if (input.whatsapp !== undefined) updates.whatsapp = input.whatsapp;
  if (input.address !== undefined) updates.address = input.address;
  if (input.googleMapsUrl !== undefined) updates.googleMapsUrl = input.googleMapsUrl;
  if (input.googleReviewUrl !== undefined) updates.googleReviewUrl = input.googleReviewUrl;
  if (input.brochureUrl !== undefined) updates.brochureUrl = input.brochureUrl;
  if (input.socialLinks !== undefined) updates.socialLinks = input.socialLinks;
  if (input.displayOrder !== undefined) updates.displayOrder = input.displayOrder;

  await db.update(profileBusinesses).set(updates).where(eq(profileBusinesses.id, businessId));
  return { ...biz, ...updates };
}

export async function deleteBusiness(actor: ActorContext, businessId: string) {
  const rows = await db
    .select()
    .from(profileBusinesses)
    .where(eq(profileBusinesses.id, businessId))
    .limit(1);

  if (!rows || rows.length === 0) {
    throw new BusinessNotFoundError(businessId);
  }

  const biz = rows[0];
  const profile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, biz.profileId))
    .limit(1);

  if (
    !profile ||
    (profile[0].ownerId !== actor.userId && !actor.isAdmin && actor.role !== 'super_admin')
  ) {
    throw new UnauthorizedProfileAccessError('delete business from', biz.profileId);
  }

  await db.delete(profileBusinesses).where(eq(profileBusinesses.id, businessId));
  return { success: true };
}

// --- Catalogue Items Operations (Products & Services) ---

export async function addCatalogueItem(
  actor: ActorContext,
  profileId: string,
  input: CreateCatalogueItemInput
) {
  const profile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .limit(1);

  if (!profile || profile.length === 0) {
    throw new ProfileNotFoundError(profileId);
  }

  if (profile[0].ownerId !== actor.userId && !actor.isAdmin && actor.role !== 'super_admin') {
    throw new UnauthorizedProfileAccessError('add catalogue item to', profileId);
  }

  // Check product or service entitlement
  const limitKey = input.type === 'product' ? 'max_products' : 'max_services';
  const countRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(profileCatalogueItems)
    .where(
      and(
        eq(profileCatalogueItems.profileId, profileId),
        eq(profileCatalogueItems.type, input.type)
      )
    );

  const currentCount = Number(countRes[0]?.count || 0);
  const target = actor.orgId ? { organizationId: actor.orgId } : { userId: actor.userId };
  await assertWithinLimit(target, limitKey, currentCount + 1);

  const itemId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const newItem = {
    id: itemId,
    profileId,
    businessId: input.businessId || null,
    type: input.type,
    title: input.title,
    description: input.description || null,
    price: input.price || null,
    currency: input.currency || 'INR',
    imageUrl: input.imageUrl || null,
    actionUrl: input.actionUrl || null,
    actionLabel: input.actionLabel || 'Enquire',
    displayOrder: input.displayOrder !== undefined ? input.displayOrder : currentCount,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(profileCatalogueItems).values(newItem);
  return newItem;
}

export async function updateCatalogueItem(
  actor: ActorContext,
  itemId: string,
  input: UpdateCatalogueItemInput
) {
  const rows = await db
    .select()
    .from(profileCatalogueItems)
    .where(eq(profileCatalogueItems.id, itemId))
    .limit(1);

  if (!rows || rows.length === 0) {
    throw new CatalogueItemNotFoundError(itemId);
  }

  const item = rows[0];
  const profile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, item.profileId))
    .limit(1);

  if (
    !profile ||
    (profile[0].ownerId !== actor.userId && !actor.isAdmin && actor.role !== 'super_admin')
  ) {
    throw new UnauthorizedProfileAccessError('update catalogue item on', item.profileId);
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (input.title !== undefined) updates.title = input.title;
  if (input.description !== undefined) updates.description = input.description;
  if (input.price !== undefined) updates.price = input.price;
  if (input.currency !== undefined) updates.currency = input.currency;
  if (input.imageUrl !== undefined) updates.imageUrl = input.imageUrl;
  if (input.actionUrl !== undefined) updates.actionUrl = input.actionUrl;
  if (input.actionLabel !== undefined) updates.actionLabel = input.actionLabel;
  if (input.displayOrder !== undefined) updates.displayOrder = input.displayOrder;

  await db.update(profileCatalogueItems).set(updates).where(eq(profileCatalogueItems.id, itemId));
  return { ...item, ...updates };
}

export async function deleteCatalogueItem(actor: ActorContext, itemId: string) {
  const rows = await db
    .select()
    .from(profileCatalogueItems)
    .where(eq(profileCatalogueItems.id, itemId))
    .limit(1);

  if (!rows || rows.length === 0) {
    throw new CatalogueItemNotFoundError(itemId);
  }

  const item = rows[0];
  const profile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, item.profileId))
    .limit(1);

  if (
    !profile ||
    (profile[0].ownerId !== actor.userId && !actor.isAdmin && actor.role !== 'super_admin')
  ) {
    throw new UnauthorizedProfileAccessError('delete catalogue item from', item.profileId);
  }

  await db.delete(profileCatalogueItems).where(eq(profileCatalogueItems.id, itemId));
  return { success: true };
}

// --- Section Order and Visibility Updates ---

export async function updateProfileSections(
  actor: ActorContext,
  profileId: string,
  sections: SectionConfigInput[]
) {
  const profile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .limit(1);

  if (!profile || profile.length === 0) {
    throw new ProfileNotFoundError(profileId);
  }

  if (profile[0].ownerId !== actor.userId && !actor.isAdmin && actor.role !== 'super_admin') {
    throw new UnauthorizedProfileAccessError('update sections on', profileId);
  }

  // Upsert or update each section
  for (const sec of sections) {
    const existing = await db
      .select({ id: profileSections.id })
      .from(profileSections)
      .where(
        and(
          eq(profileSections.profileId, profileId),
          eq(profileSections.sectionType, sec.sectionType)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(profileSections)
        .set({
          title: sec.title !== undefined ? sec.title : undefined,
          isEnabled: sec.isEnabled,
          displayOrder: sec.displayOrder,
          configJson: sec.configJson || {},
          updatedAt: new Date(),
        })
        .where(eq(profileSections.id, existing[0].id));
    } else {
      await db.insert(profileSections).values({
        id: `sec_${profileId}_${sec.sectionType}`,
        profileId,
        sectionType: sec.sectionType,
        title: sec.title || null,
        isEnabled: sec.isEnabled,
        displayOrder: sec.displayOrder,
        configJson: sec.configJson || {},
      });
    }
  }

  return db
    .select()
    .from(profileSections)
    .where(eq(profileSections.profileId, profileId))
    .orderBy(asc(profileSections.displayOrder));
}
