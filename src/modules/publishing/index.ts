/**
 * TAPTCH PUBLISHING & ADMIN PLAN ASSIGNMENT DOMAIN MODULE
 *
 * Implements controlled profile publishing, admin review workflows,
 * manual plan assignment, payment verification, and plan-filtered snapshot compilation.
 */

import { eq, and, desc, sql } from 'drizzle-orm';
import { db, type ActorContext } from '@/db';
import {
  profiles,
  publicationRequests,
  planAssignmentHistory,
  tenantSubscriptions,
  users,
} from '@/db/schema';
import { getProfileWithDetails } from '@/modules/profiles';
import { getEntitlements, filterProfileForPublicDisplay } from '@/modules/entitlements';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

export class PublicationWorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PublicationWorkflowError';
  }
}

export interface SubmitPublicationRequestInput {
  profileId: string;
  requestedPlanId?: string;
  contactPhone?: string;
  contactWhatsapp?: string;
}

export interface ReviewPublicationInput {
  action: 'APPROVE' | 'REJECT' | 'REQUEST_CORRECTIONS' | 'SUSPEND' | 'UNPUBLISH' | 'REACTIVATE';
  planId?: string;
  validDays?: number;
  paymentStatus?: 'NOT_RECORDED' | 'PENDING_VERIFICATION' | 'PAID' | 'PARTIALLY_PAID' | 'WAIVED' | 'REFUNDED';
  amountInr?: string;
  adminNotes?: string;
  rejectionReason?: string;
  correctionsRequested?: string;
}

export interface AssignPlanInput {
  userId: string;
  planId: string;
  validDays?: number;
  paymentStatus?: 'NOT_RECORDED' | 'PENDING_VERIFICATION' | 'PAID' | 'PARTIALLY_PAID' | 'WAIVED' | 'REFUNDED';
  amountInr?: string;
  notes?: string;
}

/**
 * Customer submits profile for publication review.
 * Profile status transitions to PENDING_PUBLICATION and remains private until approved.
 */
export async function submitPublicationRequest(
  actor: ActorContext,
  input: SubmitPublicationRequestInput
) {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, input.profileId))
    .limit(1);

  if (!profile) {
    throw new PublicationWorkflowError(`Profile "${input.profileId}" was not found.`);
  }

  if (profile.ownerId !== actor.userId && !actor.isAdmin && actor.role !== 'super_admin') {
    throw new PublicationWorkflowError('Unauthorized: You can only submit publication requests for your own profiles.');
  }

  const requestId = `pub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // 1. Update profile status to PENDING_PUBLICATION
  await db
    .update(profiles)
    .set({
      status: 'PENDING_PUBLICATION',
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, input.profileId));

  // 2. Insert or update publication request record
  await db.insert(publicationRequests).values({
    id: requestId,
    profileId: input.profileId,
    userId: actor.userId,
    status: 'PENDING_PUBLICATION',
    requestedPlanId: input.requestedPlanId || null,
    customerContactPhone: input.contactPhone || null,
    customerContactWhatsapp: input.contactWhatsapp || null,
  });

  logger.info({ profileId: input.profileId, userId: actor.userId, requestId }, 'Publication request submitted');

  return {
    requestId,
    profileId: input.profileId,
    status: 'PENDING_PUBLICATION',
    message: 'Publication request submitted successfully. Our team will review your profile and reach out via WhatsApp/phone.',
  };
}

/**
 * Lists publication requests with customer details for Admin review.
 */
export async function listPublicationRequests(
  actor: ActorContext,
  statusFilter?: string
) {
  if (!actor.isAdmin && actor.role !== 'super_admin') {
    throw new PublicationWorkflowError('Unauthorized: Admin access required.');
  }

  const query = db
    .select({
      id: publicationRequests.id,
      profileId: publicationRequests.profileId,
      userId: publicationRequests.userId,
      status: publicationRequests.status,
      requestedPlanId: publicationRequests.requestedPlanId,
      adminNotes: publicationRequests.adminNotes,
      rejectionReason: publicationRequests.rejectionReason,
      correctionsRequested: publicationRequests.correctionsRequested,
      contactPhone: publicationRequests.customerContactPhone,
      contactWhatsapp: publicationRequests.customerContactWhatsapp,
      createdAt: publicationRequests.createdAt,
      updatedAt: publicationRequests.updatedAt,
      // Joined Profile Details
      profileName: profiles.displayName,
      profileSlug: profiles.slug,
      profileType: profiles.profileType,
      profileStatus: profiles.status,
      templateId: profiles.templateId,
      // Joined Customer Details
      customerName: users.name,
      customerEmail: users.email,
    })
    .from(publicationRequests)
    .innerJoin(profiles, eq(publicationRequests.profileId, profiles.id))
    .innerJoin(users, eq(publicationRequests.userId, users.id))
    .orderBy(desc(publicationRequests.createdAt));

  const rows = await query;
  if (statusFilter) {
    return rows.filter((r: { status: string }) => r.status.toLowerCase() === statusFilter.toLowerCase());
  }
  return rows;
}

/**
 * Admin reviews a publication request, assigns/updates plan, and publishes or rejects.
 */
export async function reviewPublicationRequest(
  adminActor: ActorContext,
  requestId: string,
  input: ReviewPublicationInput
) {
  if (!adminActor.isAdmin && adminActor.role !== 'super_admin') {
    throw new PublicationWorkflowError('Unauthorized: Admin access required.');
  }

  const [reqRecord] = await db
    .select()
    .from(publicationRequests)
    .where(eq(publicationRequests.id, requestId))
    .limit(1);

  if (!reqRecord) {
    throw new PublicationWorkflowError(`Publication request "${requestId}" was not found.`);
  }

  const profileId = reqRecord.profileId;
  const userId = reqRecord.userId;

  // Handle Action
  if (input.action === 'APPROVE') {
    const assignedPlan = input.planId || reqRecord.requestedPlanId || 'nano';

    // 1. Assign or update user's subscription
    const validUntil = input.validDays
      ? new Date(Date.now() + input.validDays * 24 * 60 * 60 * 1000)
      : null;

    const subId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Upsert subscription
    const existingSub = await db
      .select()
      .from(tenantSubscriptions)
      .where(eq(tenantSubscriptions.userId, userId))
      .limit(1);

    const fromPlanId = existingSub[0]?.planId || 'free';

    if (existingSub.length > 0) {
      await db
        .update(tenantSubscriptions)
        .set({
          planId: assignedPlan,
          status: 'active',
          paymentStatus: input.paymentStatus || existingSub[0].paymentStatus || 'NOT_RECORDED',
          amountInr: input.amountInr || existingSub[0].amountInr,
          validUntil,
          assignedBy: adminActor.userId,
          notes: input.adminNotes || existingSub[0].notes,
          updatedAt: new Date(),
        })
        .where(eq(tenantSubscriptions.id, existingSub[0].id));
    } else {
      await db.insert(tenantSubscriptions).values({
        id: subId,
        userId,
        planId: assignedPlan,
        status: 'active',
        paymentStatus: input.paymentStatus || 'NOT_RECORDED',
        amountInr: input.amountInr,
        validUntil,
        assignedBy: adminActor.userId,
        notes: input.adminNotes,
      });
    }

    // 2. Record Plan Assignment & Payment History
    await db.insert(planAssignmentHistory).values({
      id: `pah_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      subscriptionId: existingSub[0]?.id || subId,
      userId,
      fromPlanId,
      toPlanId: assignedPlan,
      assignedBy: adminActor.userId,
      action: 'APPROVE',
      paymentStatus: input.paymentStatus || 'NOT_RECORDED',
      amountInr: input.amountInr,
      validUntil,
      notes: input.adminNotes,
    });

    // 3. Compile Plan-Filtered Public Snapshot
    const fullProfile = await getProfileWithDetails(adminActor, profileId);
    const { entitlements } = await getEntitlements({ userId });
    const filteredSnapshot = filterProfileForPublicDisplay(fullProfile, entitlements, assignedPlan);

    // 4. Mark Profile as PUBLISHED
    await db
      .update(profiles)
      .set({
        status: 'PUBLISHED',
        publishedJson: filteredSnapshot,
        publishedAt: new Date(),
        version: sql`${profiles.version} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, profileId));

    // 5. Mark Request as APPROVED
    await db
      .update(publicationRequests)
      .set({
        status: 'APPROVED',
        adminNotes: input.adminNotes,
        reviewedBy: adminActor.userId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(publicationRequests.id, requestId));

    // 6. Update Redis cache
    try {
      if (redis && typeof redis.set === 'function') {
        await redis.set(
          `cache:profile:slug:${fullProfile.slug}`,
          JSON.stringify(filteredSnapshot),
          'EX',
          86400
        );
      }
    } catch (err) {
      logger.warn({ err: err instanceof Error ? err.message : String(err) }, 'Redis cache sync skipped');
    }

    logger.info({ profileId, userId, planId: assignedPlan }, 'Profile publication approved and published');

    return {
      success: true,
      action: 'APPROVE',
      profileStatus: 'PUBLISHED',
      assignedPlan,
      validUntil,
    };
  }

  if (input.action === 'REJECT') {
    await db
      .update(profiles)
      .set({ status: 'REJECTED', updatedAt: new Date() })
      .where(eq(profiles.id, profileId));

    await db
      .update(publicationRequests)
      .set({
        status: 'REJECTED',
        rejectionReason: input.rejectionReason || 'Profile content does not comply with guidelines.',
        adminNotes: input.adminNotes,
        reviewedBy: adminActor.userId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(publicationRequests.id, requestId));

    return { success: true, action: 'REJECT', profileStatus: 'REJECTED' };
  }

  if (input.action === 'REQUEST_CORRECTIONS') {
    await db
      .update(profiles)
      .set({ status: 'DRAFT', updatedAt: new Date() })
      .where(eq(profiles.id, profileId));

    await db
      .update(publicationRequests)
      .set({
        status: 'CORRECTIONS_REQUESTED',
        correctionsRequested: input.correctionsRequested,
        adminNotes: input.adminNotes,
        reviewedBy: adminActor.userId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(publicationRequests.id, requestId));

    return { success: true, action: 'REQUEST_CORRECTIONS', profileStatus: 'DRAFT' };
  }

  if (input.action === 'SUSPEND') {
    await db
      .update(profiles)
      .set({ status: 'SUSPENDED', updatedAt: new Date() })
      .where(eq(profiles.id, profileId));

    // Invalidate Redis cache
    const [prof] = await db.select({ slug: profiles.slug }).from(profiles).where(eq(profiles.id, profileId));
    if (prof) {
      try {
        if (redis && typeof redis.del === 'function') {
          await redis.del(`cache:profile:slug:${prof.slug}`);
        }
      } catch {}
    }

    return { success: true, action: 'SUSPEND', profileStatus: 'SUSPENDED' };
  }

  if (input.action === 'UNPUBLISH') {
    await db
      .update(profiles)
      .set({ status: 'UNPUBLISHED', updatedAt: new Date() })
      .where(eq(profiles.id, profileId));

    const [prof] = await db.select({ slug: profiles.slug }).from(profiles).where(eq(profiles.id, profileId));
    if (prof) {
      try {
        if (redis && typeof redis.del === 'function') {
          await redis.del(`cache:profile:slug:${prof.slug}`);
        }
      } catch {}
    }

    return { success: true, action: 'UNPUBLISH', profileStatus: 'UNPUBLISHED' };
  }

  if (input.action === 'REACTIVATE') {
    // Re-publish with plan filtering
    const fullProfile = await getProfileWithDetails(adminActor, profileId);
    const { planId, entitlements } = await getEntitlements({ userId });
    const filteredSnapshot = filterProfileForPublicDisplay(fullProfile, entitlements, planId);

    await db
      .update(profiles)
      .set({
        status: 'PUBLISHED',
        publishedJson: filteredSnapshot,
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, profileId));

    return { success: true, action: 'REACTIVATE', profileStatus: 'PUBLISHED' };
  }

  throw new PublicationWorkflowError(`Unsupported review action "${input.action}".`);
}

/**
 * Admin directly assigns or upgrades/downgrades a user's plan.
 * Automatically recalculates and refreshes public visibility for all user's published profiles!
 */
export async function assignUserPlan(
  adminActor: ActorContext,
  input: AssignPlanInput
) {
  if (!adminActor.isAdmin && adminActor.role !== 'super_admin') {
    throw new PublicationWorkflowError('Unauthorized: Admin access required.');
  }

  const validUntil = input.validDays
    ? new Date(Date.now() + input.validDays * 24 * 60 * 60 * 1000)
    : null;

  const existingSub = await db
    .select()
    .from(tenantSubscriptions)
    .where(eq(tenantSubscriptions.userId, input.userId))
    .limit(1);

  const fromPlanId = existingSub[0]?.planId || 'free';
  const subId = existingSub[0]?.id || `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  if (existingSub.length > 0) {
    await db
      .update(tenantSubscriptions)
      .set({
        planId: input.planId,
        status: 'active',
        paymentStatus: input.paymentStatus || existingSub[0].paymentStatus || 'NOT_RECORDED',
        amountInr: input.amountInr || existingSub[0].amountInr,
        validUntil,
        assignedBy: adminActor.userId,
        notes: input.notes || existingSub[0].notes,
        updatedAt: new Date(),
      })
      .where(eq(tenantSubscriptions.id, existingSub[0].id));
  } else {
    await db.insert(tenantSubscriptions).values({
      id: subId,
      userId: input.userId,
      planId: input.planId,
      status: 'active',
      paymentStatus: input.paymentStatus || 'NOT_RECORDED',
      amountInr: input.amountInr,
      validUntil,
      assignedBy: adminActor.userId,
      notes: input.notes,
    });
  }

  // Record plan assignment history
  await db.insert(planAssignmentHistory).values({
    id: `pah_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    subscriptionId: subId,
    userId: input.userId,
    fromPlanId,
    toPlanId: input.planId,
    assignedBy: adminActor.userId,
    action: fromPlanId === input.planId ? 'RENEW' : 'ASSIGN',
    paymentStatus: input.paymentStatus || 'NOT_RECORDED',
    amountInr: input.amountInr,
    validUntil,
    notes: input.notes,
  });

  // Re-synchronize all PUBLISHED profiles of this user with the new plan entitlements!
  // If upgraded to Max, previously entered gallery/products become automatically visible!
  const userProfiles = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.ownerId, input.userId), eq(profiles.status, 'PUBLISHED')));

  const { entitlements } = await getEntitlements({ userId: input.userId });

  for (const prof of userProfiles) {
    const fullProfile = await getProfileWithDetails(adminActor, prof.id);
    const newSnapshot = filterProfileForPublicDisplay(fullProfile, entitlements, input.planId);

    await db
      .update(profiles)
      .set({
        publishedJson: newSnapshot,
        version: sql`${profiles.version} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, prof.id));

    try {
      if (redis && typeof redis.set === 'function') {
        await redis.set(`cache:profile:slug:${prof.slug}`, JSON.stringify(newSnapshot), 'EX', 86400);
      }
    } catch {}
  }

  logger.info({ userId: input.userId, planId: input.planId, profilesUpdated: userProfiles.length }, 'Plan assigned and public profiles recalculated');

  return {
    success: true,
    userId: input.userId,
    planId: input.planId,
    validUntil,
    paymentStatus: input.paymentStatus || 'NOT_RECORDED',
    profilesRefreshed: userProfiles.length,
  };
}
