import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { activeProfiles } from '../../database/scopes';
import * as schema from '../../database/schema';
import { eq, desc, or, ilike, sql, and } from 'drizzle-orm';
import type { ActorContext } from '../../common/types';
import * as crypto from 'crypto';

@Injectable()
export class SupportService {
  constructor(private dbService: DatabaseService) { }

  async getDashboardStats(actor: ActorContext) {
    this.assertSupportAccess(actor);

    const [userCount] = await this.dbService.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.users);
    const [profileCount] = await this.dbService.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.profiles)
      .where(activeProfiles());
    const [orderCount] = await this.dbService.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.orders);
    const [leadCount] = await this.dbService.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.leads);

    const pendingOrders = await this.dbService.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.orders)
      .where(eq(schema.orders.orderStatus, 'requested'));

    return {
      totalUsers: Number(userCount?.count || 0),
      totalProfiles: Number(profileCount?.count || 0),
      totalOrders: Number(orderCount?.count || 0),
      pendingOrders: Number(pendingOrders[0]?.count || 0),
      totalLeadsCaptured: Number(leadCount?.count || 0),
      timestamp: new Date().toISOString(),
    };
  }

  async searchUsers(query: string, actor: ActorContext) {
    this.assertSupportAccess(actor);

    if (!query || !query.trim()) {
      return this.dbService.db
        .select({
          id: schema.users.id,
          name: schema.users.name,
          email: schema.users.email,
          systemRole: schema.users.systemRole,
          status: schema.users.status,
          createdAt: schema.users.createdAt,
        })
        .from(schema.users)
        .orderBy(desc(schema.users.createdAt))
        .limit(25);
    }

    const q = `%${query.trim()}%`;
    return this.dbService.db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        systemRole: schema.users.systemRole,
        status: schema.users.status,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(
        or(
          ilike(schema.users.name, q),
          ilike(schema.users.email, q),
          ilike(schema.users.phoneNumber, q),
        ),
      )
      .limit(50);
  }

  async getProfilesForAudit(actor: ActorContext) {
    this.assertSupportAccess(actor);

    return this.dbService.db
      .select({
        id: schema.profiles.id,
        slug: schema.profiles.slug,
        displayName: schema.profiles.displayName,
        profileType: schema.profiles.profileType,
        status: schema.profiles.status,
        ownerId: schema.profiles.ownerId,
        templateId: schema.profiles.templateId,
        createdAt: schema.profiles.createdAt,
        updatedAt: schema.profiles.updatedAt,
      })
      .from(schema.profiles)
      .where(activeProfiles())
      .orderBy(desc(schema.profiles.updatedAt))
      .limit(50);
  }

  async reviewProfile(
    profileId: string,
    action: 'approve' | 'flag' | 'suspend',
    reason: string,
    actor: ActorContext,
  ) {
    this.assertSupportAccess(actor);

    const [profile] = await this.dbService.db
      .select()
      .from(schema.profiles)
      .where(and(eq(schema.profiles.id, profileId), activeProfiles()))
      .limit(1);

    if (!profile) {
      throw new NotFoundException(`Profile ${profileId} not found.`);
    }

    let newStatus = profile.status;
    if (action === 'approve') newStatus = 'PUBLISHED';
    if (action === 'suspend') newStatus = 'SUSPENDED';
    if (action === 'flag') newStatus = 'UNDER_REVIEW';

    await this.dbService.db
      .update(schema.profiles)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(schema.profiles.id, profileId));

    // Write immutable audit log
    await this.dbService.db.insert(schema.auditLogs).values({
      id: crypto.randomUUID(),
      actorId: actor.userId,
      action: `support:profile_${action}`,
      resourceType: 'profile',
      resourceId: profileId,
      metadata: {
        reason: reason || 'Routine operational moderation review',
        previousStatus: profile.status,
        newStatus,
      },
      createdAt: new Date(),
    });

    return { success: true, profileId, newStatus };
  }

  async getAuditTrail(actor: ActorContext) {
    this.assertSupportAccess(actor);

    return this.dbService.db
      .select({
        id: schema.auditLogs.id,
        actorId: schema.auditLogs.actorId,
        actorName: schema.users.name,
        actorEmail: schema.users.email,
        action: schema.auditLogs.action,
        resourceType: schema.auditLogs.resourceType,
        resourceId: schema.auditLogs.resourceId,
        metadata: schema.auditLogs.metadata,
        createdAt: schema.auditLogs.createdAt,
      })
      .from(schema.auditLogs)
      .leftJoin(schema.users, eq(schema.auditLogs.actorId, schema.users.id))
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(50);
  }

  async createUserTicket(
    actor: ActorContext,
    input: {
      subject: string;
      category?: string;
      priority?: string;
      message: string;
    },
  ) {
    const ticketId = crypto.randomUUID();
    const ticketNumber = `TKT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const [ticket] = await this.dbService.db
      .insert(schema.supportTickets)
      .values({
        id: ticketId,
        ticketNumber,
        userId: actor.userId,
        subject: input.subject.trim(),
        category: input.category || 'card',
        priority: input.priority || 'high',
        status: 'open',
      })
      .returning();

    await this.dbService.db.insert(schema.supportTicketMessages).values({
      id: crypto.randomUUID(),
      ticketId,
      senderId: actor.userId,
      senderRole: actor.role || 'user',
      message: input.message.trim(),
    });

    return { ticket };
  }

  async getNotificationsForActor(actor: ActorContext) {
    return this.dbService.db
      .select()
      .from(schema.userNotifications)
      .where(eq(schema.userNotifications.userId, actor.userId))
      .orderBy(desc(schema.userNotifications.createdAt))
      .limit(30);
  }

  async markNotificationRead(actor: ActorContext, notificationId: string) {
    await this.dbService.db
      .update(schema.userNotifications)
      .set({ isRead: true })
      .where(
        and(
          eq(schema.userNotifications.id, notificationId),
          eq(schema.userNotifications.userId, actor.userId),
        ),
      );
    return { success: true };
  }

  async markAllNotificationsRead(actor: ActorContext) {
    await this.dbService.db
      .update(schema.userNotifications)
      .set({ isRead: true })
      .where(eq(schema.userNotifications.userId, actor.userId));
    return { success: true };
  }

  private assertSupportAccess(actor: ActorContext) {
    if (!actor.isAdmin && actor.role !== 'support_admin') {
      throw new ForbiddenException('Access restricted to Support and Administrator staff.');
    }
  }
}

