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
      activePlanId = sub[0].planId;
    }
  } else if (target.userId) {
    const sub = await db
      .select({
        planId: tenantSubscriptions.planId,
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
      activePlanId = sub[0].planId;
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

