import { db } from '@/db';
import { plans, planEntitlements, tenantSubscriptions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export class EntitlementLimitExceededError extends Error {
  code = 'ENTITLEMENT_LIMIT_EXCEEDED';
  limitKey: string;
  currentCount?: number;
  maxAllowed: number | boolean | string;
  planId: string;

  constructor(message: string, limitKey: string, maxAllowed: number | boolean | string, planId: string, currentCount?: number) {
    super(message);
    this.name = 'EntitlementLimitExceededError';
    this.limitKey = limitKey;
    this.maxAllowed = maxAllowed;
    this.planId = planId;
    this.currentCount = currentCount;
  }
}

export interface EntitlementTarget {
  organizationId?: string | null;
  userId?: string | null;
}

export interface PlanEntitlementsResult {
  planId: string;
  planName: string;
  entitlements: Record<string, number | boolean | string>;
}

/**
 * Default fallback entitlements for the free tier if not found in database.
 */
export const DEFAULT_FREE_ENTITLEMENTS: Record<string, number | boolean | string> = {
  max_profiles: 1,
  max_cards: 0,
  max_team_members: 1,
  analytics_retention_days: 30,
  custom_domain_allowed: false,
  remove_branding: false,
  has_company_overview: false,
  has_exchange_contact: false,
  has_gallery: false,
  max_gallery_images: 0,
  has_google_maps: false,
  max_businesses: 0,
  has_product_catalogue: false,
  max_products: 0,
  has_service_catalogue: false,
  max_services: 0,
  has_brochure_download: false,
  has_youtube_videos: false,
  has_google_review_link: false,
};

/**
 * Retrieve the active plan and all entitlement values for an organization or individual user.
 */
export async function getEntitlements(target: EntitlementTarget): Promise<PlanEntitlementsResult> {
  let activePlanId = 'free';
  let activePlanName = 'Free Forever';

  // 1. Look up active subscription
  if (target.organizationId) {
    const sub = await db
      .select({
        planId: tenantSubscriptions.planId,
        validUntil: tenantSubscriptions.validUntil,
        status: tenantSubscriptions.status,
      })
      .from(tenantSubscriptions)
      .where(
        and(
          eq(tenantSubscriptions.organizationId, target.organizationId),
          eq(tenantSubscriptions.status, 'active')
        )
      )
      .limit(1);

    if (sub.length > 0 && sub[0].planId) {
      // Check expiration
      const isExpired = sub[0].validUntil && new Date(sub[0].validUntil) < new Date();
      if (!isExpired) {
        activePlanId = sub[0].planId;
      }
    }
  } else if (target.userId) {
    const sub = await db
      .select({
        planId: tenantSubscriptions.planId,
        validUntil: tenantSubscriptions.validUntil,
        status: tenantSubscriptions.status,
      })
      .from(tenantSubscriptions)
      .where(
        and(
          eq(tenantSubscriptions.userId, target.userId),
          eq(tenantSubscriptions.status, 'active')
        )
      )
      .limit(1);

    if (sub.length > 0 && sub[0].planId) {
      // Check expiration
      const isExpired = sub[0].validUntil && new Date(sub[0].validUntil) < new Date();
      if (!isExpired) {
        activePlanId = sub[0].planId;
      }
    }
  }

  // 2. Fetch plan details
  const planRecord = await db
    .select({
      id: plans.id,
      name: plans.name,
    })
    .from(plans)
    .where(eq(plans.id, activePlanId))
    .limit(1);

  if (planRecord.length > 0) {
    activePlanName = planRecord[0].name;
  }

  // 3. Fetch entitlements for the plan
  const rows = await db
    .select({
      key: planEntitlements.entitlementKey,
      value: planEntitlements.value,
    })
    .from(planEntitlements)
    .where(eq(planEntitlements.planId, activePlanId));

  const entitlementsMap: Record<string, number | boolean | string> = {
    ...DEFAULT_FREE_ENTITLEMENTS,
  };

  for (const row of rows) {
    entitlementsMap[row.key] = row.value;
  }

  return {
    planId: activePlanId,
    planName: activePlanName,
    entitlements: entitlementsMap,
  };
}

/**
 * Asserts that a proposed count (or boolean entitlement) does not exceed the tenant's plan allowance.
 * Throws EntitlementLimitExceededError if exceeded.
 */
export async function assertWithinLimit(
  target: EntitlementTarget,
  key: string,
  proposedCount?: number
): Promise<void> {
  const { planId, entitlements } = await getEntitlements(target);
  const limitValue = entitlements[key];

  if (typeof limitValue === 'boolean') {
    if (!limitValue) {
      throw new EntitlementLimitExceededError(
        `Feature "${key}" is not included in the ${planId} plan. Please contact your administrator to upgrade.`,
        key,
        limitValue,
        planId
      );
    }
    return;
  }

  if (typeof limitValue === 'number' && proposedCount !== undefined) {
    if (proposedCount > limitValue) {
      throw new EntitlementLimitExceededError(
        `Plan limit exceeded for "${key}". Allowed: ${limitValue}, requested: ${proposedCount}.`,
        key,
        limitValue,
        planId,
        proposedCount
      );
    }
  }
}

export interface ProfileWithDisplayDetails {
  id: string;
  slug: string;
  displayName: string;
  headline?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  socialLinks?: Array<Record<string, unknown>>;
  businesses?: Array<Record<string, unknown>>;
  catalogue?: Array<{ type: string; [key: string]: unknown }>;
  gallery?: Array<Record<string, unknown>>;
  videos?: Array<Record<string, unknown>>;
  brochures?: Array<Record<string, unknown>>;
  sections?: Array<{ sectionType: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

/**
 * Filter full profile data down to only the sections and features permitted by the assigned plan.
 * Crucial Security Rule: Restricted sections are excluded server-side before serving publicly.
 * Never rely on frontend CSS or client conditions to hide restricted content.
 */
export function filterProfileForPublicDisplay(
  profile: ProfileWithDisplayDetails,
  planEntitlements: Record<string, number | boolean | string>,
  planId: string
): ProfileWithDisplayDetails {
  // 1. Social links limit
  const allSocials = Array.isArray(profile.socialLinks) ? profile.socialLinks : [];
  const maxSocials = planId === 'nano' ? 3 : planId === 'micro' ? 5 : allSocials.length;
  const filteredSocials = allSocials.slice(0, maxSocials);

  // 2. Associated Businesses
  const allBusinesses = Array.isArray(profile.businesses) ? profile.businesses : [];
  const maxBusinesses = typeof planEntitlements.max_businesses === 'number' ? planEntitlements.max_businesses : 0;
  const filteredBusinesses = maxBusinesses > 0 ? allBusinesses.slice(0, maxBusinesses) : [];

  // 3. Catalogue Items (Products & Services)
  const allCatalogue = Array.isArray(profile.catalogue) ? profile.catalogue : [];
  const hasProducts = Boolean(planEntitlements.has_product_catalogue);
  const maxProducts = typeof planEntitlements.max_products === 'number' ? planEntitlements.max_products : 0;
  const hasServices = Boolean(planEntitlements.has_service_catalogue);
  const maxServices = typeof planEntitlements.max_services === 'number' ? planEntitlements.max_services : 0;

  let productCount = 0;
  let serviceCount = 0;
  const filteredCatalogue = allCatalogue.filter((item: { type: string; [key: string]: unknown }) => {
    if (item.type === 'product') {
      if (!hasProducts || (maxProducts > 0 && productCount >= maxProducts)) return false;
      productCount++;
      return true;
    }
    if (item.type === 'service') {
      if (!hasServices || (maxServices > 0 && serviceCount >= maxServices)) return false;
      serviceCount++;
      return true;
    }
    return false;
  });

  // 4. Photo Gallery
  const allGallery = Array.isArray(profile.gallery) ? profile.gallery : [];
  const hasGallery = Boolean(planEntitlements.has_gallery);
  const maxGalleryImages = typeof planEntitlements.max_gallery_images === 'number' ? planEntitlements.max_gallery_images : 0;
  const filteredGallery = hasGallery && maxGalleryImages > 0 ? allGallery.slice(0, maxGalleryImages) : [];

  // 5. Videos
  const allVideos = Array.isArray(profile.videos) ? profile.videos : [];
  const hasVideos = Boolean(planEntitlements.has_youtube_videos);
  const filteredVideos = hasVideos ? allVideos : [];

  // 6. Brochures
  const allBrochures = Array.isArray(profile.brochures) ? profile.brochures : [];
  const hasBrochures = Boolean(planEntitlements.has_brochure_download);
  const filteredBrochures = hasBrochures ? allBrochures : [];

  // 7. Sections Filtering
  const allSections = Array.isArray(profile.sections) ? profile.sections : [];
  const allowedSectionTypes = new Set<string>(['identity', 'contacts', 'bio', 'save_contact']);

  if (filteredSocials.length > 0) allowedSectionTypes.add('socials');
  if (filteredBusinesses.length > 0) allowedSectionTypes.add('businesses');
  if (filteredCatalogue.some((c: { type: string }) => c.type === 'product')) allowedSectionTypes.add('products');
  if (filteredCatalogue.some((c: { type: string }) => c.type === 'service')) allowedSectionTypes.add('services');
  if (filteredGallery.length > 0) allowedSectionTypes.add('gallery');
  if (filteredVideos.length > 0) allowedSectionTypes.add('videos');
  if (filteredBrochures.length > 0) allowedSectionTypes.add('brochure');
  if (Boolean(planEntitlements.has_exchange_contact)) allowedSectionTypes.add('exchange_contact');
  if (Boolean(planEntitlements.has_google_maps)) allowedSectionTypes.add('google_maps');
  if (Boolean(planEntitlements.has_google_review_link)) allowedSectionTypes.add('google_review');

  const filteredSections = allSections.filter((sec: { sectionType: string }) => allowedSectionTypes.has(sec.sectionType));

  return {
    ...profile,
    planId,
    socialLinks: filteredSocials,
    businesses: filteredBusinesses,
    catalogue: filteredCatalogue,
    gallery: filteredGallery,
    videos: filteredVideos,
    brochures: filteredBrochures,
    sections: filteredSections,
    hasExchangeContact: Boolean(planEntitlements.has_exchange_contact),
    hasGoogleMaps: Boolean(planEntitlements.has_google_maps),
    hasGoogleReviews: Boolean(planEntitlements.has_google_review_link),
  };
}


