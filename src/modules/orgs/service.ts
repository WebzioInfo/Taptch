import { eq, and, desc, sql } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { db } from '@/db';
import { organizations, members, invitations, users, sessions } from '@/db/schema/auth';
import { auditLogs } from '@/db/schema/audit';
import { qrCodes } from '@/db/schema/qr';
import { profiles } from '@/db/schema/profiles';
import { leads } from '@/db/schema/leads';
import { logger } from '@/lib/logger';
import {
  OrgRole,
  StaffMemberRecord,
  InvitationRecord,
  StaffDashboardSummary,
} from './types';

export class OrganizationNotFoundError extends Error {
  constructor(identifier: string) {
    super(`Organization "${identifier}" was not found.`);
    this.name = 'OrganizationNotFoundError';
  }
}

export class StaffNotFoundError extends Error {
  constructor(memberId: string) {
    super(`Staff member with ID "${memberId}" was not found.`);
    this.name = 'StaffNotFoundError';
  }
}

export class PrivilegeEscalationError extends Error {
  constructor(message: string = 'You do not have sufficient privileges to perform this role or permission change.') {
    super(message);
    this.name = 'PrivilegeEscalationError';
  }
}

export class InvitationNotFoundError extends Error {
  constructor() {
    super('Invitation was not found or has already been processed.');
    this.name = 'InvitationNotFoundError';
  }
}

export class InvitationExpiredError extends Error {
  constructor() {
    super('This invitation has expired.');
    this.name = 'InvitationExpiredError';
  }
}

export class UserAlreadyMemberError extends Error {
  constructor(email: string) {
    super(`User with email "${email}" is already a member of this organization.`);
    this.name = 'UserAlreadyMemberError';
  }
}

/**
 * Creates a new organization with the creator designated as 'owner'.
 */
export async function createOrganization(params: {
  name: string;
  slug?: string;
  logo?: string | null;
  ownerUserId: string;
}) {
  const orgId = `org_${Date.now()}_${randomBytes(4).toString('hex')}`;
  const baseSlug = (params.slug || params.name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || `org-${randomBytes(3).toString('hex')}`;

  let finalSlug = baseSlug;
  let attempts = 0;
  while (attempts < 5) {
    const [existing] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, finalSlug))
      .limit(1);

    if (!existing) break;
    attempts++;
    finalSlug = `${baseSlug}-${randomBytes(2).toString('hex')}`;
  }

  const [org] = await db
    .insert(organizations)
    .values({
      id: orgId,
      name: params.name.trim(),
      slug: finalSlug,
      logo: params.logo || null,
    })
    .returning();

  // Create owner member record
  const memberId = `mem_${Date.now()}_${randomBytes(4).toString('hex')}`;
  await db.insert(members).values({
    id: memberId,
    organizationId: orgId,
    userId: params.ownerUserId,
    role: 'owner',
    status: 'active',
    permissions: [],
  });

  // Log activity
  await logStaffActivity({
    organizationId: orgId,
    actorId: params.ownerUserId,
    action: 'org:create',
    resourceType: 'organization',
    resourceId: orgId,
    metadata: { name: org.name, slug: org.slug },
  });

  return org;
}

/**
 * Lists all organizations a user belongs to with their active role.
 */
export async function listUserOrganizations(userId: string) {
  const userMemberships = await db
    .select({
      memberId: members.id,
      role: members.role,
      status: members.status,
      permissions: members.permissions,
      orgId: organizations.id,
      orgName: organizations.name,
      orgSlug: organizations.slug,
      orgLogo: organizations.logo,
      joinedAt: members.createdAt,
    })
    .from(members)
    .innerJoin(organizations, eq(members.organizationId, organizations.id))
    .where(and(eq(members.userId, userId), eq(members.status, 'active')));

  return userMemberships;
}

/**
 * Gets organization details by ID.
 */
export async function getOrganizationById(orgId: string) {
  const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
  if (!org) {
    throw new OrganizationNotFoundError(orgId);
  }
  return org;
}

/**
 * Resolves an actor's membership and verified role within an organization.
 */
export async function getActorOrgMembership(organizationId: string, userId: string) {
  const [membership] = await db
    .select()
    .from(members)
    .where(and(eq(members.organizationId, organizationId), eq(members.userId, userId)))
    .limit(1);

  return membership || null;
}

/**
 * Lists all staff members in an organization.
 */
export async function listOrganizationStaff(organizationId: string): Promise<StaffMemberRecord[]> {
  const rows = await db
    .select({
      id: members.id,
      organizationId: members.organizationId,
      userId: members.userId,
      name: users.name,
      email: users.email,
      phoneNumber: users.phoneNumber,
      role: members.role,
      status: members.status,
      permissions: members.permissions,
      assignedResponsibilities: members.assignedResponsibilities,
      createdAt: members.createdAt,
      updatedAt: members.updatedAt,
    })
    .from(members)
    .innerJoin(users, eq(members.userId, users.id))
    .where(eq(members.organizationId, organizationId))
    .orderBy(desc(members.createdAt));

  return rows.map((r: {
    id: string;
    organizationId: string;
    userId: string;
    name: string;
    email: string;
    phoneNumber: string | null;
    role: string;
    status: string;
    permissions: string[] | null;
    assignedResponsibilities: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) => ({
    ...r,
    role: r.role as OrgRole,
    status: r.status as StaffMemberRecord['status'],
    permissions: (r.permissions as string[]) || [],
  }));
}

/**
 * Lists pending invitations for an organization.
 */
export async function listOrganizationInvitations(organizationId: string): Promise<InvitationRecord[]> {
  const rows = await db
    .select({
      id: invitations.id,
      organizationId: invitations.organizationId,
      email: invitations.email,
      phoneNumber: invitations.phoneNumber,
      role: invitations.role,
      permissions: invitations.permissions,
      status: invitations.status,
      expiresAt: invitations.expiresAt,
      inviterId: invitations.inviterId,
      inviterName: users.name,
      createdAt: invitations.createdAt,
    })
    .from(invitations)
    .innerJoin(users, eq(invitations.inviterId, users.id))
    .where(and(eq(invitations.organizationId, organizationId), eq(invitations.status, 'pending')))
    .orderBy(desc(invitations.createdAt));

  return rows.map((r: {
    id: string;
    organizationId: string;
    email: string;
    phoneNumber: string | null;
    role: string;
    permissions: string[] | null;
    status: string;
    expiresAt: Date;
    inviterId: string;
    inviterName: string;
    createdAt: Date;
  }) => ({
    ...r,
    role: (r.role as OrgRole) || 'staff',
    status: r.status as InvitationRecord['status'],
    permissions: (r.permissions as string[]) || [],
  }));
}

/**
 * Invites a new staff member by email or phone.
 */
export async function inviteStaff(params: {
  organizationId: string;
  inviterUserId: string;
  email: string;
  phoneNumber?: string | null;
  role: 'admin' | 'manager' | 'staff' | 'viewer';
  permissions?: string[];
  assignedResponsibilities?: string | null;
}) {
  const cleanEmail = params.email.toLowerCase().trim();

  // Verify inviter privileges (only Owner and Admin can invite)
  const inviter = await getActorOrgMembership(params.organizationId, params.inviterUserId);
  if (!inviter || (inviter.role !== 'owner' && inviter.role !== 'admin')) {
    throw new PrivilegeEscalationError('You do not have permission to invite staff to this organization.');
  }

  // Admin can only invite 'manager', 'staff', or 'viewer'
  if (inviter.role === 'admin' && params.role === 'admin') {
    throw new PrivilegeEscalationError('Only the organization owner can invite administrators.');
  }

  // Check if already a member
  const [existingUser] = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
  if (existingUser) {
    const existingMembership = await getActorOrgMembership(params.organizationId, existingUser.id);
    if (existingMembership) {
      throw new UserAlreadyMemberError(cleanEmail);
    }
  }

  // Check if pending invitation exists; if so, expire previous
  await db
    .update(invitations)
    .set({ status: 'revoked' })
    .where(
      and(
        eq(invitations.organizationId, params.organizationId),
        eq(invitations.email, cleanEmail),
        eq(invitations.status, 'pending')
      )
    );

  const inviteId = `inv_${Date.now()}_${randomBytes(8).toString('hex')}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiration

  const [createdInvite] = await db
    .insert(invitations)
    .values({
      id: inviteId,
      organizationId: params.organizationId,
      email: cleanEmail,
      phoneNumber: params.phoneNumber || null,
      role: params.role,
      permissions: params.permissions || [],
      status: 'pending',
      expiresAt,
      inviterId: params.inviterUserId,
    })
    .returning();

  await logStaffActivity({
    organizationId: params.organizationId,
    actorId: params.inviterUserId,
    action: 'staff:invite',
    resourceType: 'invitation',
    resourceId: inviteId,
    metadata: { email: cleanEmail, role: params.role },
  });

  return createdInvite;
}

/**
 * Updates a staff member's role, status, permissions, or responsibilities with strict privilege escalation barriers.
 */
export async function updateStaffMember(params: {
  organizationId: string;
  actorUserId: string;
  memberId: string;
  role?: 'admin' | 'manager' | 'staff' | 'viewer';
  status?: 'active' | 'suspended' | 'deactivated';
  permissions?: string[];
  assignedResponsibilities?: string | null;
}) {
  const actorMembership = await getActorOrgMembership(params.organizationId, params.actorUserId);
  if (!actorMembership || (actorMembership.role !== 'owner' && actorMembership.role !== 'admin')) {
    throw new PrivilegeEscalationError('Administrative privileges required to edit staff members.');
  }

  const [targetMember] = await db
    .select()
    .from(members)
    .where(and(eq(members.id, params.memberId), eq(members.organizationId, params.organizationId)))
    .limit(1);

  if (!targetMember) {
    throw new StaffNotFoundError(params.memberId);
  }

  // Owner protection: nobody can modify the owner except the owner themselves
  if (targetMember.role === 'owner' && actorMembership.role !== 'owner') {
    throw new PrivilegeEscalationError('Only the organization owner can modify their own account.');
  }

  // Admin cannot promote someone to admin or modify another admin unless they are the owner
  if (actorMembership.role === 'admin') {
    if (targetMember.role === 'admin' && targetMember.id !== actorMembership.id) {
      throw new PrivilegeEscalationError('Admins cannot modify other administrators.');
    }
    if (params.role === 'admin') {
      throw new PrivilegeEscalationError('Only the owner can assign the Administrator role.');
    }
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (params.role) updates.role = params.role;
  if (params.status) updates.status = params.status;
  if (params.permissions !== undefined) updates.permissions = params.permissions;
  if (params.assignedResponsibilities !== undefined) updates.assignedResponsibilities = params.assignedResponsibilities;

  const [updated] = await db
    .update(members)
    .set(updates)
    .where(eq(members.id, params.memberId))
    .returning();

  // If suspended or deactivated, revoke any active session cookies targeting this org
  if (params.status === 'suspended' || params.status === 'deactivated') {
    await db
      .update(sessions)
      .set({ activeOrganizationId: null })
      .where(and(eq(sessions.userId, targetMember.userId), eq(sessions.activeOrganizationId, params.organizationId)));
  }

  await logStaffActivity({
    organizationId: params.organizationId,
    actorId: params.actorUserId,
    action: 'staff:update',
    resourceType: 'member',
    resourceId: params.memberId,
    metadata: { updates },
  });

  return updated;
}

/**
 * Removes a staff member from the organization.
 */
export async function removeStaffMember(params: {
  organizationId: string;
  actorUserId: string;
  memberId: string;
}) {
  const actorMembership = await getActorOrgMembership(params.organizationId, params.actorUserId);
  if (!actorMembership || (actorMembership.role !== 'owner' && actorMembership.role !== 'admin')) {
    throw new PrivilegeEscalationError('Administrative privileges required to remove staff.');
  }

  const [targetMember] = await db
    .select()
    .from(members)
    .where(and(eq(members.id, params.memberId), eq(members.organizationId, params.organizationId)))
    .limit(1);

  if (!targetMember) {
    throw new StaffNotFoundError(params.memberId);
  }

  // Cannot remove owner
  if (targetMember.role === 'owner') {
    throw new PrivilegeEscalationError('The organization owner cannot be removed. Transfer ownership first.');
  }

  // Admins cannot remove other admins
  if (actorMembership.role === 'admin' && targetMember.role === 'admin') {
    throw new PrivilegeEscalationError('Administrators cannot remove other administrators.');
  }

  await db.delete(members).where(eq(members.id, params.memberId));

  // Revoke active session pointer
  await db
    .update(sessions)
    .set({ activeOrganizationId: null })
    .where(and(eq(sessions.userId, targetMember.userId), eq(sessions.activeOrganizationId, params.organizationId)));

  await logStaffActivity({
    organizationId: params.organizationId,
    actorId: params.actorUserId,
    action: 'staff:remove',
    resourceType: 'member',
    resourceId: params.memberId,
    metadata: { removedUserId: targetMember.userId },
  });

  return { success: true };
}

/**
 * Accepts an invitation and establishes organization membership.
 */
export async function acceptInvitation(invitationId: string, userId: string) {
  const [invite] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.id, invitationId))
    .limit(1);

  if (!invite || invite.status !== 'pending') {
    throw new InvitationNotFoundError();
  }

  if (new Date() > new Date(invite.expiresAt)) {
    await db.update(invitations).set({ status: 'expired' }).where(eq(invitations.id, invitationId));
    throw new InvitationExpiredError();
  }

  // Check if user is already a member
  const existingMembership = await getActorOrgMembership(invite.organizationId, userId);
  if (existingMembership) {
    await db.update(invitations).set({ status: 'accepted' }).where(eq(invitations.id, invitationId));
    return { membership: existingMembership, alreadyMember: true };
  }

  const memberId = `mem_${Date.now()}_${randomBytes(4).toString('hex')}`;
  const [newMember] = await db
    .insert(members)
    .values({
      id: memberId,
      organizationId: invite.organizationId,
      userId,
      role: invite.role || 'staff',
      status: 'active',
      permissions: invite.permissions || [],
    })
    .returning();

  await db.update(invitations).set({ status: 'accepted' }).where(eq(invitations.id, invitationId));

  await logStaffActivity({
    organizationId: invite.organizationId,
    actorId: userId,
    action: 'staff:accept_invite',
    resourceType: 'member',
    resourceId: memberId,
    metadata: { invitationId },
  });

  return { membership: newMember, alreadyMember: false };
}

/**
 * Rejects an invitation.
 */
export async function rejectInvitation(invitationId: string, userId: string) {
  const [invite] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.id, invitationId))
    .limit(1);

  if (!invite || invite.status !== 'pending') {
    throw new InvitationNotFoundError();
  }

  await db.update(invitations).set({ status: 'rejected' }).where(eq(invitations.id, invitationId));

  await logStaffActivity({
    organizationId: invite.organizationId,
    actorId: userId,
    action: 'staff:reject_invite',
    resourceType: 'invitation',
    resourceId: invitationId,
  });

  return { success: true };
}

/**
 * Gets personalized staff dashboard data showing assigned assets, permissions, and recent actions.
 */
export async function getStaffDashboardData(params: {
  organizationId: string;
  userId: string;
}): Promise<StaffDashboardSummary> {
  const org = await getOrganizationById(params.organizationId);
  const membership = await getActorOrgMembership(params.organizationId, params.userId);

  if (!membership || membership.status !== 'active') {
    throw new StaffNotFoundError(params.userId);
  }

  // Count assigned QRs
  const [qrCountResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(qrCodes)
    .where(
      and(
        eq(qrCodes.organizationId, params.organizationId),
        eq(qrCodes.assignedBy, params.userId)
      )
    );

  // Count organization profiles
  const [profileCountResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(profiles)
    .where(and(eq(profiles.ownerId, params.userId)));

  // Count leads captured
  const [leadCountResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(leads);

  // Fetch recent activities
  const recentLogs = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      resourceType: auditLogs.resourceType,
      resourceId: auditLogs.resourceId,
      createdAt: auditLogs.createdAt,
      metadata: auditLogs.metadata,
    })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.organizationId, params.organizationId),
        eq(auditLogs.actorId, params.userId)
      )
    )
    .orderBy(desc(auditLogs.createdAt))
    .limit(10);

  return {
    organization: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logo: org.logo,
    },
    membership: {
      role: membership.role as OrgRole,
      status: membership.status as StaffMemberRecord['status'],
      permissions: (membership.permissions as string[]) || [],
      assignedResponsibilities: membership.assignedResponsibilities,
      joinedAt: membership.createdAt,
    },
    assignedAssets: {
      totalQRs: qrCountResult?.count || 0,
      activeProfiles: profileCountResult?.count || 0,
      capturedLeads: leadCountResult?.count || 0,
    },
    recentActivities: recentLogs.map((log: {
      id: string;
      action: string;
      resourceType: string;
      resourceId: string | null;
      createdAt: Date;
      metadata: unknown;
    }) => ({
      ...log,
      metadata: (log.metadata as Record<string, unknown>) || {},
    })),
  };
}

/**
 * Logs staff or organization activities into the immutable audit ledger.
 */
export async function logStaffActivity(params: {
  organizationId?: string | null;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  try {
    const id = `aud_${Date.now()}_${randomBytes(4).toString('hex')}`;
    await db.insert(auditLogs).values({
      id,
      actorId: params.actorId,
      organizationId: params.organizationId || null,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId || null,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
      metadata: params.metadata || {},
    });
  } catch (err) {
    logger.error({ err }, 'Failed to record audit log');
  }
}

/**
 * Retrieves organization audit logs for administrative oversight.
 */
export async function getOrganizationAuditLogs(params: {
  organizationId: string;
  limit?: number;
  offset?: number;
  action?: string;
}) {
  const limit = Math.min(params.limit || 50, 100);
  const offset = params.offset || 0;

  const conditions = [eq(auditLogs.organizationId, params.organizationId)];
  if (params.action) {
    conditions.push(eq(auditLogs.action, params.action));
  }

  const logs = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      resourceType: auditLogs.resourceType,
      resourceId: auditLogs.resourceId,
      ipAddress: auditLogs.ipAddress,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
      actorName: users.name,
      actorEmail: users.email,
    })
    .from(auditLogs)
    .innerJoin(users, eq(auditLogs.actorId, users.id))
    .where(and(...conditions))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(auditLogs)
    .where(and(...conditions));

  return {
    items: logs,
    total: countResult?.count || 0,
    limit,
    offset,
  };
}
