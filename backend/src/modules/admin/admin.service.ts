import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnprocessableEntityException,
  Optional,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { activeProfiles } from '../../database/scopes';
import { isReservedSlug } from '../../common/reserved-slugs';
import { buildCardUrl } from '../cards/card-serializer';
import { RedisService } from '../../database/redis.service';
import { ActivityLogService } from './activity-log.service';
import { getPermissionsForRole, hasRolePermission } from '../../common/rbac/permissions';
import * as schema from '../../database/schema';
import { eq, desc, sql, or, ilike, and, inArray, ne } from 'drizzle-orm';
import type { ActorContext, PlanTier } from '../../common/types';
import * as crypto from 'crypto';

const UNIT_COGS_BY_MATERIAL: Record<string, number> = {
  metal: 450,
  wood: 250,
  pvc: 150,
  matte: 150,
};

const ORDER_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  ORDER_PLACED: ['PAYMENT_PENDING', 'ORDER_CONFIRMED', 'DESIGN_REVIEW', 'CARD_PRODUCTION', 'ON_HOLD', 'CANCELLED'],
  PAYMENT_PENDING: ['ORDER_CONFIRMED', 'DESIGN_REVIEW', 'CARD_PRODUCTION', 'ON_HOLD', 'CANCELLED'],
  ON_HOLD: ['ORDER_CONFIRMED', 'DESIGN_REVIEW', 'CARD_PRODUCTION', 'CARD_READY', 'CANCELLED'],
  ORDER_CONFIRMED: ['DESIGN_REVIEW', 'CARD_PRODUCTION', 'CARD_READY', 'ON_HOLD', 'CANCELLED'],
  DESIGN_REVIEW: ['CARD_PRODUCTION', 'CARD_READY', 'ON_HOLD', 'CANCELLED'],
  CARD_PRODUCTION: ['CARD_READY', 'DISPATCHED', 'ON_HOLD', 'CANCELLED'],
  CARD_READY: ['DISPATCHED', 'ON_HOLD', 'CANCELLED'],
  DISPATCHED: ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY', 'DELIVERED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

const SHIPPING_REQUIRED_STATUSES = new Set(['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY']);

const PAYMENT_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  PENDING: ['PAID', 'FAILED', 'WAIVED', 'COD_PENDING', 'COD_COLLECTED'],
  COD_PENDING: ['COD_COLLECTED', 'PAID', 'FAILED', 'WAIVED'],
  COD_COLLECTED: ['PAID', 'REFUNDED'],
  PAID: ['REFUNDED'],
  WAIVED: ['REFUNDED'],
  FAILED: ['PENDING', 'WAIVED'],
  REFUNDED: [],
};
const PRODUCTION_OR_FULFILLMENT_STATUSES = new Set([
  'ORDER_CONFIRMED',
  'DESIGN_REVIEW',
  'CARD_PRODUCTION',
  'CARD_READY',
  'DISPATCHED',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
]);

const ONLINE_PAYMENT_METHODS = new Set(['razorpay', 'upi']);
const COD_ELIGIBLE_PAYMENT_STATUSES = new Set(['COD_PENDING', 'COD_COLLECTED', 'PAID', 'WAIVED']);
const VERIFIED_PAYMENT_STATUSES = new Set(['PAID', 'WAIVED']);

function assertPaymentEligibleForOrderProgression(order: {
  paymentMethod?: string | null;
  paymentStatus?: string | null;
}) {
  const method = (order.paymentMethod || '').trim().toLowerCase();
  const status = (order.paymentStatus || '').trim().toUpperCase();

  if (status === 'REFUNDED' || status === 'FAILED') {
    throw new BadRequestException(
      `Cannot advance unpaid online order (paymentMethod=${method}, paymentStatus=${status}) into production or fulfillment.`,
      `Cannot advance order with terminal/reversed payment status (paymentMethod=${method || 'unknown'}, paymentStatus=${status}).`,
    );
  }

  if (method === 'cod') {
    if (!COD_ELIGIBLE_PAYMENT_STATUSES.has(status)) {
      throw new BadRequestException(
        `Cannot advance COD order with paymentStatus=${status || 'UNKNOWN'}.`,
      );
    }
    return;
  }

  if (ONLINE_PAYMENT_METHODS.has(method) || method === 'offline') {
    if (!VERIFIED_PAYMENT_STATUSES.has(status)) {
      throw new BadRequestException(
        `Cannot advance ${method} order with unverified paymentStatus=${status || 'UNKNOWN'}.`,
      );
    }
    return;
  }

  throw new BadRequestException(
    `Cannot advance order with unsupported or missing paymentMethod=${method || 'unknown'}.`,
  );
}

@Injectable()
export class AdminService {
  constructor(
    private dbService: DatabaseService,
    @Optional() private redisService?: RedisService,
    @Optional() private activityLogService?: ActivityLogService,
  ) { }

  async getPlatformStats() {
    const [userCount] = await this.dbService.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.users);
    const [profileCount] = await this.dbService.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.profiles)
      .where(activeProfiles());
    const [cardCount] = await this.dbService.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.cards);
    const [orderCount] = await this.dbService.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.orders);
    const [leadCount] = await this.dbService.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.leads);

    const [personalCount] = await this.dbService.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.profiles)
      .where(and(eq(schema.profiles.profileType, 'personal'), activeProfiles()));

    const [businessCount] = await this.dbService.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.profiles)
      .where(and(eq(schema.profiles.profileType, 'business'), activeProfiles()));

    const [publishedCount] = await this.dbService.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.profiles)
      .where(and(eq(schema.profiles.status, 'PUBLISHED'), activeProfiles()));

    return {
      users: Number(userCount?.count || 0),
      profiles: Number(profileCount?.count || 0),
      personalProfiles: Number(personalCount?.count || 0),
      businessProfiles: Number(businessCount?.count || 0),
      publishedProfiles: Number(publishedCount?.count || 0),
      cards: Number(cardCount?.count || 0),
      orders: Number(orderCount?.count || 0),
      leads: Number(leadCount?.count || 0),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Phase 2 Admin Dashboard: single-pass aggregate queries for users & profiles,
   * recent registrations, and permission-gated recent administrative activity.
   */
  async getDashboardOverview(actor: ActorContext) {
    const [userAgg] = await this.dbService.db
      .select({
        totalUsers: sql<number>`count(*)`,
        activeUsers: sql<number>`count(*) filter (where ${schema.users.status} = 'active')`,
        suspendedUsers: sql<number>`count(*) filter (where ${schema.users.status} = 'suspended')`,
      })
      .from(schema.users);

    const [profileAgg] = await this.dbService.db
      .select({
        totalProfiles: sql<number>`count(*)`,
        publishedProfiles: sql<number>`count(*) filter (where ${schema.profiles.status} = 'PUBLISHED')`,
        unpublishedProfiles: sql<number>`count(*) filter (where ${schema.profiles.status} <> 'PUBLISHED')`,
      })
      .from(schema.profiles)
      .where(activeProfiles());

    const recentRegistrations = await this.dbService.db
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
      .limit(8);

    const canViewActivity =
      actor.role === 'super_admin' || hasRolePermission(actor.role, 'activity_logs.view');

    const recentActivity = canViewActivity
      ? await this.dbService.db
        .select({
          id: schema.auditLogs.id,
          actorId: schema.auditLogs.actorId,
          action: schema.auditLogs.action,
          resourceType: schema.auditLogs.resourceType,
          resourceId: schema.auditLogs.resourceId,
          createdAt: schema.auditLogs.createdAt,
        })
        .from(schema.auditLogs)
        .orderBy(desc(schema.auditLogs.createdAt))
        .limit(10)
      : [];

    return {
      metrics: {
        totalUsers: Number(userAgg?.totalUsers || 0),
        activeUsers: Number(userAgg?.activeUsers || 0),
        suspendedUsers: Number(userAgg?.suspendedUsers || 0),
        totalProfiles: Number(profileAgg?.totalProfiles || 0),
        publishedProfiles: Number(profileAgg?.publishedProfiles || 0),
        unpublishedProfiles: Number(profileAgg?.unpublishedProfiles || 0),
      },
      recentRegistrations,
      recentActivity,
      permissions: {
        canViewActivity,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Complete Platform Financial Management & P&L
   * Uses persisted order totals and actual payment/order statuses.
   * Excludes CANCELLED orders from active sales and keeps refunds separate from collected revenue.
   */
  async getFinancialSummary() {
    const allOrders = await this.dbService.db
      .select()
      .from(schema.orders);

    let grossSales = 0;
    let refundedAmount = 0;
    let collectedRevenue = 0;
    let outstandingRevenue = 0;
    let totalCogs = 0;
    let cancelledOrderValue = 0;

    for (const ord of allOrders) {
      const orderTotal = Number(ord.totalAmount ?? 0);
      const qty = Math.max(1, Number(ord.quantity ?? 1));
      const materialKey = (ord.material || 'pvc').toLowerCase();
      const unitCogs = UNIT_COGS_BY_MATERIAL[materialKey] ?? 150;
      const orderCogs = unitCogs * qty;

      if (ord.orderStatus === 'CANCELLED') {
        cancelledOrderValue += orderTotal;
        if (ord.paymentStatus === 'REFUNDED') {
          refundedAmount += orderTotal;
        }
        continue;
      }

      if (ord.paymentStatus === 'REFUNDED') {
        grossSales += orderTotal;
        refundedAmount += orderTotal;
        continue;
      }

      if (ord.paymentStatus === 'FAILED') {
        continue;
      }

      grossSales += orderTotal;

      if (ord.paymentStatus === 'PAID' || ord.paymentStatus === 'COD_COLLECTED') {
        collectedRevenue += orderTotal;
        totalCogs += orderCogs;
      } else if (ord.paymentStatus === 'COD_PENDING' || ord.paymentStatus === 'PENDING') {
        outstandingRevenue += orderTotal;
      }
    }

    // Operating expenses from expenses table
    const allExpenses = await this.dbService.db
      .select()
      .from(schema.expenses)
      .orderBy(desc(schema.expenses.incurredAt));

    let totalExpenses = 0;
    const expenseBreakdown: Record<string, number> = {};

    for (const exp of allExpenses) {
      totalExpenses += exp.amount;
      expenseBreakdown[exp.category] = (expenseBreakdown[exp.category] || 0) + exp.amount;
    }

    const netCollectedRevenue = collectedRevenue;
    const grossProfit = netCollectedRevenue - totalCogs;
    const netProfit = grossProfit - totalExpenses;
    const profitMargin =
      netCollectedRevenue > 0 ? ((netProfit / netCollectedRevenue) * 100).toFixed(1) : '0';

    return {
      totalOrderValue: grossSales,
      grossSales,
      refundedAmount,
      cancelledOrderValue,
      collectedRevenue: netCollectedRevenue,
      outstandingRevenue,
      totalCogs,
      grossProfit,
      totalExpenses,
      netProfit,
      profitMargin: `${profitMargin}%`,
      expenseBreakdown,
      recentExpenses: allExpenses.slice(0, 10),
      currency: 'INR',
    };
  }

  async recordExpense(
    data: { category: string; title: string; amount: number; notes?: string; receiptUrl?: string },
    actor: ActorContext,
  ) {
    if (!data.title || !data.amount) {
      throw new BadRequestException('Expense title and amount are required.');
    }

    return this.dbService.db.transaction(async (tx: any) => {
      const [expense] = await tx
        .insert(schema.expenses)
        .values({
          id: crypto.randomUUID(),
          category: data.category || 'operations',
          title: data.title.trim(),
          amount: Math.round(Number(data.amount)),
          currency: 'INR',
          recordedBy: actor.userId,
          notes: data.notes || null,
          receiptUrl: data.receiptUrl || null,
          incurredAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (this.activityLogService) {
        await this.activityLogService.record(
          {
            actorId: actor.userId,
            actorRole: actor.role,
            action: 'admin:expense_record',
            resourceType: 'expense',
            resourceId: expense.id,
            after: {
              category: expense.category,
              title: expense.title,
              amount: expense.amount,
              currency: expense.currency,
            },
          },
          tx,
        );
      } else {
        await tx.insert(schema.auditLogs).values({
          id: crypto.randomUUID(),
          actorId: actor.userId,
          action: 'admin:expense_record',
          resourceType: 'expense',
          resourceId: expense.id,
          metadata: { actorRole: actor.role, after: { category: expense.category, amount: expense.amount } },
          createdAt: new Date(),
        });
      }

      return expense;
    });
  }

  async getAllUsers(
    search?: string,
    role?: string,
    status?: string,
    options?: { fromDate?: string; toDate?: string; page?: number; pageSize?: number },
  ) {
    const page = Math.max(1, Number(options?.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(options?.pageSize || 25)));
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (role && role !== 'ALL') conditions.push(eq(schema.users.systemRole, role));
    if (status && status !== 'ALL') conditions.push(eq(schema.users.status, status));
    if (options?.fromDate) {
      const from = new Date(options.fromDate);
      if (!Number.isNaN(from.getTime())) {
        conditions.push(sql`${schema.users.createdAt} >= ${from}`);
      }
    }
    if (options?.toDate) {
      const to = new Date(options.toDate);
      if (!Number.isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
        conditions.push(sql`${schema.users.createdAt} <= ${to}`);
      }
    }
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(schema.users.name, q),
          ilike(schema.users.email, q),
          ilike(schema.users.phoneNumber, q),
          sql`exists (select 1 from ${schema.profiles} p where p.owner_id = ${schema.users.id} and p.slug ilike ${q} and p.status <> 'deleted' and p.deleted_at is null)`,
        ),
      );
    }

    const whereClause = conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined;

    const [countRow] = await this.dbService.db
      .select({ total: sql<number>`count(*)` })
      .from(schema.users)
      .where(whereClause);

    const items = await this.dbService.db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        phoneNumber: schema.users.phoneNumber,
        systemRole: schema.users.systemRole,
        status: schema.users.status,
        emailVerified: schema.users.emailVerified,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(whereClause)
      .orderBy(desc(schema.users.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      items,
      total: Number(countRow?.total || 0),
      page,
      pageSize,
    };
  }

  async getUserDetails(userId: string) {
    const [user] = await this.dbService.db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        phoneNumber: schema.users.phoneNumber,
        systemRole: schema.users.systemRole,
        status: schema.users.status,
        emailVerified: schema.users.emailVerified,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
      })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException(`User ${userId} not found.`);
    }

    const profiles = await this.dbService.db
      .select({
        id: schema.profiles.id,
        slug: schema.profiles.slug,
        displayName: schema.profiles.displayName,
        profileType: schema.profiles.profileType,
        status: schema.profiles.status,
        createdAt: schema.profiles.createdAt,
        updatedAt: schema.profiles.updatedAt,
      })
      .from(schema.profiles)
      .where(and(eq(schema.profiles.ownerId, userId), activeProfiles()))
      .orderBy(desc(schema.profiles.createdAt));

    const activityLogs = await this.dbService.db
      .select({
        id: schema.auditLogs.id,
        actorId: schema.auditLogs.actorId,
        action: schema.auditLogs.action,
        resourceType: schema.auditLogs.resourceType,
        resourceId: schema.auditLogs.resourceId,
        createdAt: schema.auditLogs.createdAt,
      })
      .from(schema.auditLogs)
      .where(or(eq(schema.auditLogs.resourceId, userId), eq(schema.auditLogs.actorId, userId)))
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(20);

    return {
      user,
      profiles,
      activityLogs,
    };
  }

  async updateUserStatus(userId: string, newStatus: string, actor: ActorContext) {
    const ALLOWED_USER_STATUSES = new Set(['active', 'suspended', 'deactivated']);
    if (!ALLOWED_USER_STATUSES.has(newStatus)) {
      throw new BadRequestException(
        `Invalid user status "${newStatus}". Must be one of: active, suspended, deactivated.`,
      );
    }

    if (userId === actor.userId && (newStatus === 'suspended' || newStatus === 'deactivated')) {
      throw new BadRequestException('Administrators cannot suspend or deactivate their own account.');
    }

    const result = await this.dbService.db.transaction(async (tx: any) => {
      const [user] = await tx
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, userId))
        .for('update')
        .limit(1);

      if (!user) throw new NotFoundException(`User ${userId} not found.`);

      if (
        user.systemRole === 'super_admin' &&
        (newStatus === 'suspended' || newStatus === 'deactivated')
      ) {
        const activeSuperAdmins = await tx
          .select({ id: schema.users.id })
          .from(schema.users)
          .where(
            and(
              eq(schema.users.systemRole, 'super_admin'),
              eq(schema.users.status, 'active'),
            ),
          )
          .for('update');
        if (activeSuperAdmins.length <= 1 && user.status === 'active') {
          throw new BadRequestException('Cannot suspend or deactivate the last active super administrator.');
        }
      }

      await tx
        .update(schema.users)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(schema.users.id, userId));

      // Revoke all active sessions when suspending or deactivating
      if (newStatus === 'suspended' || newStatus === 'deactivated') {
        await tx
          .delete(schema.sessions)
          .where(eq(schema.sessions.userId, userId));
      }

      const userProfiles = await tx
        .select({ slug: schema.profiles.slug })
        .from(schema.profiles)
        .where(and(eq(schema.profiles.ownerId, userId), activeProfiles()));

      if (this.activityLogService) {
        await this.activityLogService.record(
          {
            actorId: actor.userId,
            actorRole: actor.role,
            action: `admin:user_status_${newStatus}`,
            resourceType: 'user',
            resourceId: userId,
            before: { status: user.status },
            after: { status: newStatus },
          },
          tx,
        );
      } else {
        await tx.insert(schema.auditLogs).values({
          id: crypto.randomUUID(),
          actorId: actor.userId,
          action: `admin:user_status_${newStatus}`,
          resourceType: 'user',
          resourceId: userId,
          metadata: { previousStatus: user.status, newStatus },
          createdAt: new Date(),
        });
      }

      return { userProfiles };
    });

    // Invalidate Redis profile caches across all instances without mutating original profile.status
    if (this.redisService) {
      for (const p of result.userProfiles) {
        if (p?.slug) {
          const cleanSlug = p.slug.toLowerCase();
          await Promise.all([
            this.redisService.del(`profile:slug:${cleanSlug}`),
            this.redisService.del(`profile:notfound:${cleanSlug}`),
          ]);
        }
      }
    }

    return { success: true, userId, status: newStatus };
  }

  async getAllOrders(filters?: {
    q?: string;
    orderStatus?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    profileAssistanceStatus?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    pageSize?: number;
  }) {
    const paginated = filters?.page !== undefined || filters?.pageSize !== undefined;
    const page = Math.max(1, Number(filters?.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(filters?.pageSize || 25)));
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (filters?.orderStatus && filters.orderStatus !== 'ALL') {
      conditions.push(eq(schema.orders.orderStatus, filters.orderStatus));
    }
    if (filters?.paymentStatus && filters.paymentStatus !== 'ALL') {
      conditions.push(eq(schema.orders.paymentStatus, filters.paymentStatus as any));
    }
    if (filters?.paymentMethod && filters.paymentMethod !== 'ALL') {
      conditions.push(eq(schema.orders.paymentMethod, filters.paymentMethod as any));
    }
    if (filters?.profileAssistanceStatus && filters.profileAssistanceStatus !== 'ALL') {
      conditions.push(eq(schema.orders.profileAssistanceStatus, filters.profileAssistanceStatus as any));
    }
    if (filters?.fromDate) {
      const from = new Date(filters.fromDate);
      if (!Number.isNaN(from.getTime())) {
        conditions.push(sql`${schema.orders.createdAt} >= ${from}`);
      }
    }
    if (filters?.toDate) {
      const to = new Date(filters.toDate);
      if (!Number.isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
        conditions.push(sql`${schema.orders.createdAt} <= ${to}`);
      }
    }
    if (filters?.q && filters.q.trim()) {
      const searchTerm = `%${filters.q.trim()}%`;
      conditions.push(
        or(
          ilike(schema.orders.id, searchTerm),
          ilike(schema.orders.orderNumber, searchTerm),
          ilike(schema.orders.trackingNumber, searchTerm),
          ilike(schema.orders.paymentReference, searchTerm),
          sql`exists (select 1 from ${schema.users} u where u.id = ${schema.orders.userId} and (u.name ilike ${searchTerm} or u.email ilike ${searchTerm} or u.phone_number ilike ${searchTerm}))`,
        ),
      );
    }

    const whereClause = conditions.length > 0
      ? conditions.length === 1
        ? conditions[0]
        : sql`${sql.join(conditions, sql` and `)}`
      : undefined;

    const [countRow] = await this.dbService.db
      .select({ total: sql<number>`count(*)` })
      .from(schema.orders)
      .where(whereClause);

    const query = whereClause
      ? this.dbService.db.select().from(schema.orders).where(whereClause).orderBy(desc(schema.orders.createdAt))
      : this.dbService.db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt));

    const rawOrders = paginated
      ? await query.limit(pageSize).offset(offset)
      : await query.limit(100);

    const enrichedOrders = [];
    for (const ord of rawOrders) {
      // 1. Fetch user
      const [user] = await this.dbService.db
        .select({
          id: schema.users.id,
          name: schema.users.name,
          email: schema.users.email,
          phoneNumber: schema.users.phoneNumber,
        })
        .from(schema.users)
        .where(eq(schema.users.id, ord.userId))
        .limit(1);

      const assignedCards = await this.dbService.db
        .select({
          id: schema.purchasedCards.id,
          cardCode: schema.purchasedCards.cardCode,
          status: schema.purchasedCards.status,
        })
        .from(schema.purchasedCards)
        .where(eq(schema.purchasedCards.orderId, ord.id));

      // 2. Fetch items
      const items = await this.dbService.db
        .select()
        .from(schema.orderItems)
        .where(eq(schema.orderItems.orderId, ord.id));

      // 3. Fetch profile if attached
      let attachedProfile = null;
      if (ord.profileId) {
        const [prof] = await this.dbService.db
          .select({
            id: schema.profiles.id,
            name: schema.profiles.displayName,
            slug: schema.profiles.slug,
            profileType: schema.profiles.profileType,
          })
          .from(schema.profiles)
          .where(and(eq(schema.profiles.id, ord.profileId), activeProfiles()))
          .limit(1);
        attachedProfile = prof || null;
      }

      // 4. Fetch latest payment
      const [latestPayment] = await this.dbService.db
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.orderId, ord.id))
        .orderBy(desc(schema.payments.createdAt))
        .limit(1);

      enrichedOrders.push({
        ...ord,
        user: user || { id: ord.userId, name: 'Unknown User', email: '', phoneNumber: null },
        items,
        assignedCards,
        attachedProfile,
        payment: latestPayment || null,
      });
    }

    return paginated
      ? {
        items: enrichedOrders,
        total: Number(countRow?.total || 0),
        page,
        pageSize,
      }
      : enrichedOrders;
  }

  async getOrderById(orderId: string) {
    const [order] = await this.dbService.db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found.`);
    }

    const [user] = await this.dbService.db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
      })
      .from(schema.users)
      .where(eq(schema.users.id, order.userId))
      .limit(1);

    const items = await this.dbService.db
      .select()
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, order.id));

    let attachedProfile = null;
    if (order.profileId) {
      const [prof] = await this.dbService.db
        .select({
          id: schema.profiles.id,
          name: schema.profiles.displayName,
          slug: schema.profiles.slug,
          profileType: schema.profiles.profileType,
          avatarUrl: schema.profiles.avatarUrl,
        })
        .from(schema.profiles)
        .where(and(eq(schema.profiles.id, order.profileId), activeProfiles()))
        .limit(1);
      attachedProfile = prof || null;
    }

    const statusHistory = await this.dbService.db
      .select()
      .from(schema.orderStatusHistory)
      .where(eq(schema.orderStatusHistory.orderId, order.id))
      .orderBy(desc(schema.orderStatusHistory.createdAt));

    const paymentsList = await this.dbService.db
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.orderId, order.id))
      .orderBy(desc(schema.payments.createdAt));

    return {
      ...order,
      user: user || { id: order.userId, name: 'Unknown User', email: '' },
      items,
      attachedProfile,
      statusHistory,
      payment: paymentsList[0] || null,
      allPayments: paymentsList,
    };
  }

  async updateOrderFulfillment(
    orderId: string,
    data: {
      orderStatus?: string;
      courierName?: string;
      trackingNumber?: string;
      trackingUrl?: string;
      internalNotes?: string;
      title?: string;
      description?: string;
    },
    actor: ActorContext,
  ) {
    return this.dbService.db.transaction(async (tx: any) => {
      const [order] = await tx
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, orderId))
        .for('update')
        .limit(1);

      if (!order) {
        throw new NotFoundException(`Order ${orderId} not found.`);
      }

      const nextStatus = data.orderStatus || order.orderStatus;
      if (data.orderStatus && data.orderStatus !== order.orderStatus) {
        const allowed = ORDER_STATUS_TRANSITIONS[order.orderStatus] || [];
        if (!allowed.includes(data.orderStatus)) {
          throw new BadRequestException(
            `Invalid order status transition from ${order.orderStatus} to ${data.orderStatus}.`,
          );
        }
        if (PRODUCTION_OR_FULFILLMENT_STATUSES.has(data.orderStatus)) {
          assertPaymentEligibleForOrderProgression(order);
        }
      }

      const effectiveCourier = data.courierName !== undefined ? data.courierName : order.courierName;
      const effectiveTracking = data.trackingNumber !== undefined ? data.trackingNumber : order.trackingNumber;
      if (
        SHIPPING_REQUIRED_STATUSES.has(nextStatus) &&
        (!effectiveCourier?.trim() || !effectiveTracking?.trim())
      ) {
        throw new BadRequestException(
          `Courier name and tracking number are required when setting status to ${nextStatus}.`,
        );
      }

      const updateFields: any = {
        updatedAt: new Date(),
      };

      if (data.orderStatus) updateFields.orderStatus = data.orderStatus;
      if (data.courierName !== undefined) updateFields.courierName = data.courierName;
      if (data.trackingNumber !== undefined) updateFields.trackingNumber = data.trackingNumber;
      if (data.trackingUrl !== undefined) updateFields.trackingUrl = data.trackingUrl;
      if (data.internalNotes !== undefined) updateFields.internalNotes = data.internalNotes;

      const [updatedOrder] = await tx
        .update(schema.orders)
        .set(updateFields)
        .where(eq(schema.orders.id, orderId))
        .returning();

      const historyTitle = data.title || `Status updated to ${nextStatus}`;
      let historyDesc = data.description || '';
      if (!historyDesc) {
        if (effectiveTracking) {
          historyDesc = `Dispatched with ${effectiveCourier || 'Courier'}. Tracking #${effectiveTracking}${data.trackingUrl ? ` (${data.trackingUrl})` : ''}.`;
        } else {
          historyDesc = `Fulfillment status changed from ${order.orderStatus} to ${nextStatus}.`;
        }
      }

      await tx.insert(schema.orderStatusHistory).values({
        id: crypto.randomUUID(),
        orderId,
        status: nextStatus,
        title: historyTitle,
        description: historyDesc,
        updatedBy: actor.userId,
      });

      if (this.activityLogService) {
        await this.activityLogService.record(
          {
            actorId: actor.userId,
            actorRole: actor.role,
            action: 'admin:order_fulfillment_update',
            resourceType: 'order',
            resourceId: orderId,
            before: {
              orderStatus: order.orderStatus,
              courierName: order.courierName,
              trackingNumber: order.trackingNumber,
            },
            after: {
              orderStatus: nextStatus,
              courierName: effectiveCourier,
              trackingNumber: effectiveTracking,
            },
          },
          tx,
        );
      } else {
        await tx.insert(schema.auditLogs).values({
          id: crypto.randomUUID(),
          actorId: actor.userId,
          action: 'admin:order_fulfillment_update',
          resourceType: 'order',
          resourceId: orderId,
          metadata: {
            actorRole: actor.role,
            before: { orderStatus: order.orderStatus },
            after: { orderStatus: nextStatus, courierName: effectiveCourier, trackingNumber: effectiveTracking },
          },
          createdAt: new Date(),
        });
      }

      return updatedOrder;
    });
  }

  async updateOrderProfileAssistance(
    orderId: string,
    data: {
      profileAssistanceStatus: 'NOT_REQUIRED' | 'REQUESTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';
      profileAssistanceNotes?: string;
    },
    actor: ActorContext,
  ) {
    const [order] = await this.dbService.db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found.`);
    }

    const [updatedOrder] = await this.dbService.db
      .update(schema.orders)
      .set({
        profileAssistanceStatus: data.profileAssistanceStatus,
        profileAssistanceNotes: data.profileAssistanceNotes !== undefined ? data.profileAssistanceNotes : order.profileAssistanceNotes,
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, orderId))
      .returning();

    await this.dbService.db.insert(schema.orderStatusHistory).values({
      id: crypto.randomUUID(),
      orderId,
      status: order.orderStatus,
      title: `Profile Assistance: ${data.profileAssistanceStatus}`,
      description: data.profileAssistanceNotes
        ? `Support note: ${data.profileAssistanceNotes}`
        : `Customer profile assistance status set to ${data.profileAssistanceStatus}.`,
      updatedBy: actor.userId,
    });

    return updatedOrder;
  }

  async updateOrderPayment(
    orderId: string,
    data: {
      paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'WAIVED' | 'COD_PENDING' | 'COD_COLLECTED';
      paymentReference?: string;
      notes?: string;
    },
    actor: ActorContext,
  ) {
    return this.dbService.db.transaction(async (tx: any) => {
      const [order] = await tx
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, orderId))
        .for('update')
        .limit(1);

      if (!order) {
        throw new NotFoundException(`Order ${orderId} not found.`);
      }

      if (order.paymentStatus === data.paymentStatus) {
        return order;
      }

      const allowed = PAYMENT_STATUS_TRANSITIONS[order.paymentStatus] || [];
      if (!allowed.includes(data.paymentStatus)) {
        throw new BadRequestException(
          `Invalid payment status transition from ${order.paymentStatus} to ${data.paymentStatus}.`,
        );
      }

      const [updatedOrder] = await tx
        .update(schema.orders)
        .set({
          paymentStatus: data.paymentStatus,
          paymentReference: data.paymentReference || order.paymentReference,
          updatedAt: new Date(),
        })
        .where(eq(schema.orders.id, orderId))
        .returning();

      // Check if payment record exists
      const [existingPayment] = await tx
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.orderId, orderId))
        .orderBy(desc(schema.payments.createdAt))
        .limit(1);

      if (existingPayment) {
        await tx
          .update(schema.payments)
          .set({
            status: data.paymentStatus,
            gatewayPaymentId: data.paymentReference || existingPayment.gatewayPaymentId,
            updatedAt: new Date(),
          })
          .where(eq(schema.payments.id, existingPayment.id));
      } else {
        await tx.insert(schema.payments).values({
          id: crypto.randomUUID(),
          orderId,
          userId: order.userId,
          paymentMethod: order.paymentMethod,
          amount: order.totalAmount,
          currency: 'INR',
          status: data.paymentStatus,
          gatewayPaymentId: data.paymentReference || null,
        });
      }

      await tx.insert(schema.orderStatusHistory).values({
        id: crypto.randomUUID(),
        orderId,
        status: order.orderStatus,
        title: `Payment Updated: ${data.paymentStatus}`,
        description: data.notes || `Admin marked payment status as ${data.paymentStatus} (Ref: ${data.paymentReference || 'N/A'}).`,
        updatedBy: actor.userId,
      });
      if (this.activityLogService) {
        await this.activityLogService.record(
          {
            actorId: actor.userId,
            actorRole: actor.role,
            action: 'admin:order_payment_update',
            resourceType: 'order',
            resourceId: orderId,
            before: { paymentStatus: order.paymentStatus },
            after: { paymentStatus: data.paymentStatus, paymentReference: data.paymentReference || null },
          },
          tx,
        );
      } else {
        await tx.insert(schema.auditLogs).values({
          id: crypto.randomUUID(),
          actorId: actor.userId,
          action: 'admin:order_payment_update',
          resourceType: 'order',
          resourceId: orderId,
          metadata: { actorRole: actor.role, before: { paymentStatus: order.paymentStatus }, after: { paymentStatus: data.paymentStatus } },
          createdAt: new Date(),
        });
      }

      // If refunded pre-fulfillment, safely revoke associated purchased_cards without deleting history.
      // Post-fulfillment (DISPATCHED / IN_TRANSIT / OUT_FOR_DELIVERY / DELIVERED) cards are NOT auto-revoked
      // because the physical card is already in the customer's possession.
      const POST_FULFILLMENT_STATUSES = new Set([
        'DISPATCHED',
        'IN_TRANSIT',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
      ]);
      if (data.paymentStatus === 'REFUNDED' && !POST_FULFILLMENT_STATUSES.has(order.orderStatus)) {
        await this.dbService.db
        await tx
          .update(schema.purchasedCards)
          .set({
            profileId: null,
            destinationType: null,
            profileAssignmentStatus: 'REVOKED',
            updatedAt: new Date(),
          })
          .where(eq(schema.purchasedCards.orderId, orderId));
      }

      return updatedOrder;
    });
  }

  async updateOrderStatus(
    orderId: string,
    status: string,
    actor?: ActorContext,
  ) {
    const ALLOWED_ORDER_STATUSES = new Set([
      'ORDER_PLACED',
      'PAYMENT_PENDING',
      'ORDER_CONFIRMED',
      'DESIGN_REVIEW',
      'CARD_PRODUCTION',
      'CARD_READY',
      'DISPATCHED',
      'IN_TRANSIT',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
      'shipped',
    ]);
    const ALLOWED_PAYMENT_STATUSES = new Set([
      'PENDING',
      'PAID',
      'FAILED',
      'REFUNDED',
      'WAIVED',
      'COD_PENDING',
      'COD_COLLECTED',
      'paid_offline',
    ]);

    if (!ALLOWED_ORDER_STATUSES.has(status)) {
      throw new BadRequestException(`Unsupported order status: ${status}`);
    }

    return this.dbService.db.transaction(async (tx: any) => {
      const [existing] = await tx
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, orderId))
        .for('update')
        .limit(1);

      if (!existing) {
        throw new NotFoundException(`Order ${orderId} not found.`);
      }

      if (status !== existing.orderStatus) {
        const allowed = ORDER_STATUS_TRANSITIONS[existing.orderStatus] || [];
        if (!allowed.includes(status)) {
          throw new BadRequestException(
            `Invalid order status transition from ${existing.orderStatus} to ${status}.`,
          );
        }
        if (PRODUCTION_OR_FULFILLMENT_STATUSES.has(status)) {
          assertPaymentEligibleForOrderProgression(existing);
        }
      }

      const [updated] = await tx
        .update(schema.orders)
        .set({
          orderStatus: status,
          updatedAt: new Date(),
        })
        .where(eq(schema.orders.id, orderId))
        .returning();

      if (actor) {
        await tx.insert(schema.orderStatusHistory).values({
          id: crypto.randomUUID(),
          orderId,
          status,
          title: `Order status updated to ${status}`,
          description: `Status changed from ${existing.orderStatus} to ${status}.`,
          updatedBy: actor.userId,
        });

        if (this.activityLogService) {
          await this.activityLogService.record(
            {
              actorId: actor.userId,
              actorRole: actor.role,
              action: 'admin:order_status_update',
              resourceType: 'order',
              resourceId: orderId,
              before: { orderStatus: existing.orderStatus },
              after: { orderStatus: status },
            },
            tx,
          );
        } else {
          await tx.insert(schema.auditLogs).values({
            id: crypto.randomUUID(),
            actorId: actor.userId,
            action: 'admin:order_status_update',
            resourceType: 'order',
            resourceId: orderId,
            metadata: { orderStatus: status },
            createdAt: new Date(),
          });
        }
      }

      return updated;
    });
  }

  async assignSubscription(userId: string, planTier: PlanTier, assignedBy: ActorContext) {
    return this.dbService.db.transaction(async (tx: any) => {
      const user = await tx
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.id, userId))
        .limit(1);

      if (user.length === 0) {
        throw new NotFoundException(`User ${userId} not found.`);
      }

      const subscriptionId = crypto.randomUUID();
      await tx.insert(schema.tenantSubscriptions).values({
        id: subscriptionId,
        userId,
        planId: planTier,
        assignedBy: assignedBy.userId,
        status: 'active',
        paymentStatus: 'WAIVED',
        notes: 'Manual Super Admin Assignment',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (this.activityLogService) {
        await this.activityLogService.record(
          {
            actorId: assignedBy.userId,
            actorRole: assignedBy.role,
            action: 'admin:subscription_assign',
            resourceType: 'user',
            resourceId: userId,
            after: { planTier, subscriptionId },
          },
          tx,
        );
      }

      return { success: true, userId, planTier };
    });
  }

  async getAdminAccounts() {
    const rows = await this.dbService.db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        systemRole: schema.users.systemRole,
        status: schema.users.status,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(inArray(schema.users.systemRole, ['super_admin', 'admin', 'support_admin', 'staff']))
      .orderBy(desc(schema.users.createdAt));

    return rows.map((u) => ({
      ...u,
      permissions: getPermissionsForRole(u.systemRole),
    }));
  }

  async updateAdminRole(targetUserId: string, newRole: string, actor: ActorContext) {
    const ALLOWED_ROLES = new Set(['super_admin', 'admin', 'support_admin', 'staff', 'user']);
    if (!ALLOWED_ROLES.has(newRole)) {
      throw new BadRequestException(`Invalid role "${newRole}".`);
    }

    if (targetUserId === actor.userId) {
      throw new BadRequestException('Administrators cannot modify their own role.');
    }

    return this.dbService.db.transaction(async (tx: any) => {
      const [target] = await tx
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, targetUserId))
        .for('update')
        .limit(1);

      if (!target) {
        throw new NotFoundException(`User ${targetUserId} not found.`);
      }

      if ((newRole === 'super_admin' || target.systemRole === 'super_admin') && actor.role !== 'super_admin') {
        throw new ForbiddenException('Only a super_admin can assign or modify the super_admin role.');
      }

      if (target.systemRole === 'super_admin' && newRole !== 'super_admin') {
        const activeSuperAdmins = await tx
          .select({ id: schema.users.id })
          .from(schema.users)
          .where(
            and(
              eq(schema.users.systemRole, 'super_admin'),
              eq(schema.users.status, 'active'),
            ),
          )
          .for('update');
        if (activeSuperAdmins.length <= 1 && target.status === 'active') {
          throw new BadRequestException('Cannot demote the last active super administrator.');
        }
      }

      const previousRole = target.systemRole;
      await tx
        .update(schema.users)
        .set({ systemRole: newRole, updatedAt: new Date() })
        .where(eq(schema.users.id, targetUserId));

      if (this.activityLogService) {
        await this.activityLogService.record(
          {
            actorId: actor.userId,
            actorRole: actor.role,
            action: 'admin:role_change',
            resourceType: 'user',
            resourceId: targetUserId,
            before: { systemRole: previousRole },
            after: { systemRole: newRole },
          },
          tx,
        );
      } else {
        await tx.insert(schema.auditLogs).values({
          id: crypto.randomUUID(),
          actorId: actor.userId,
          action: 'admin:role_change',
          resourceType: 'user',
          resourceId: targetUserId,
          metadata: { actorRole: actor.role, before: { systemRole: previousRole }, after: { systemRole: newRole } },
          createdAt: new Date(),
        });
      }

      return {
        success: true,
        userId: targetUserId,
        previousRole,
        systemRole: newRole,
        permissions: getPermissionsForRole(newRole),
      };
    });
  }

  async getAllProfiles(options?: {
    q?: string;
    status?: string;
    type?: string;
    template?: string;
    plan?: string;
    hasCard?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, Number(options?.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(options?.pageSize || 25)));
    const offset = (page - 1) * pageSize;

    const conditions: any[] = [activeProfiles()];
    if (options?.status && options.status !== 'ALL') {
      conditions.push(eq(schema.profiles.status, options.status));
    }
    if (options?.type && options.type !== 'ALL') {
      conditions.push(eq(schema.profiles.profileType, options.type));
    }
    if (options?.template && options.template !== 'ALL') {
      conditions.push(eq(schema.profiles.templateId, options.template));
    }
    if (options?.q && options.q.trim()) {
      const q = `%${options.q.trim()}%`;
      conditions.push(
        or(
          ilike(schema.profiles.displayName, q),
          ilike(schema.profiles.slug, q),
          ilike(schema.users.name, q),
          ilike(schema.users.email, q),
          sql`exists (select 1 from purchased_cards pc left join orders o on o.id = pc.order_id where pc.profile_id = ${schema.profiles.id} and (pc.card_code ilike ${q} or o.order_number ilike ${q} or pc.order_id ilike ${q}))`,
        ),
      );
    }
    if (options?.hasCard === 'yes') {
      conditions.push(
        sql`exists (select 1 from purchased_cards pc where pc.profile_id = ${schema.profiles.id})`,
      );
    } else if (options?.hasCard === 'no') {
      conditions.push(
        sql`not exists (select 1 from purchased_cards pc where pc.profile_id = ${schema.profiles.id})`,
      );
    }
    if (options?.plan && options.plan !== 'ALL') {
      conditions.push(
        sql`exists (select 1 from tenant_subscriptions ts where ts.user_id = ${schema.profiles.ownerId} and ts.status = 'active' and ts.plan_id = ${options.plan})`,
      );
    }

    const whereClause = conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined;

    const [countRow] = await this.dbService.db
      .select({ total: sql<number>`count(*)` })
      .from(schema.profiles)
      .leftJoin(schema.users, eq(schema.profiles.ownerId, schema.users.id))
      .where(whereClause);

    const rows = await this.dbService.db
      .select({
        id: schema.profiles.id,
        slug: schema.profiles.slug,
        displayName: schema.profiles.displayName,
        avatarUrl: schema.profiles.avatarUrl,
        profileType: schema.profiles.profileType,
        status: schema.profiles.status,
        templateId: schema.profiles.templateId,
        createdAt: schema.profiles.createdAt,
        updatedAt: schema.profiles.updatedAt,
        ownerId: schema.profiles.ownerId,
        ownerName: schema.users.name,
        ownerEmail: schema.users.email,
        ownerPhone: schema.users.phoneNumber,
        ownerStatus: schema.users.status,
      })
      .from(schema.profiles)
      .leftJoin(schema.users, eq(schema.profiles.ownerId, schema.users.id))
      .where(whereClause)
      .orderBy(desc(schema.profiles.createdAt))
      .limit(pageSize)
      .offset(offset);

    const profileIds = rows.map((r: any) => r.id);
    const ownerIds = [...new Set(rows.map((r: any) => r.ownerId).filter(Boolean))];

    const attachedCards =
      profileIds.length > 0
        ? await this.dbService.db
          .select({
            id: schema.purchasedCards.id,
            profileId: schema.purchasedCards.profileId,
            cardCode: schema.purchasedCards.cardCode,
            status: schema.purchasedCards.status,
            tapCount: schema.purchasedCards.tapCount,
            orderId: schema.purchasedCards.orderId,
            orderNumber: schema.orders.orderNumber,
          })
          .from(schema.purchasedCards)
          .leftJoin(schema.orders, eq(schema.purchasedCards.orderId, schema.orders.id))
          .where(inArray(schema.purchasedCards.profileId, profileIds))
        : [];

    const subs =
      ownerIds.length > 0
        ? await this.dbService.db
          .select({
            userId: schema.tenantSubscriptions.userId,
            planId: schema.tenantSubscriptions.planId,
          })
          .from(schema.tenantSubscriptions)
          .where(
            and(
              inArray(schema.tenantSubscriptions.userId, ownerIds),
              eq(schema.tenantSubscriptions.status, 'active'),
            ),
          )
        : [];

    const eventStats =
      profileIds.length > 0
        ? await this.dbService.db
          .select({
            profileId: schema.cardEvents.profileId,
            views: sql<number>`count(*) filter (where ${schema.cardEvents.eventType} = 'profile_view')`,
            taps: sql<number>`count(*) filter (where ${schema.cardEvents.eventType} in ('nfc_open', 'qr_scan'))`,
          })
          .from(schema.cardEvents)
          .where(inArray(schema.cardEvents.profileId, profileIds))
          .groupBy(schema.cardEvents.profileId)
        : [];

    const items = rows.map((r: any) => {
      const cards = attachedCards.filter((c: any) => c.profileId === r.id);
      const sub = subs.find((s: any) => s.userId === r.ownerId);
      const evt = eventStats.find((e: any) => e.profileId === r.id);
      const cardTapSum = cards.reduce((sum: number, c: any) => sum + Number(c.tapCount || 0), 0);
      return {
        ...r,
        plan: sub?.planId || 'nano',
        attachedCards: cards,
        views: Number(evt?.views || 0),
        taps: Math.max(Number(evt?.taps || 0), cardTapSum),
      };
    });

    return {
      items,
      total: Number(countRow?.total || 0),
      page,
      pageSize,
    };
  }

  async getProfileDetails(profileId: string) {
    const [row] = await this.dbService.db
      .select({
        id: schema.profiles.id,
        slug: schema.profiles.slug,
        displayName: schema.profiles.displayName,
        headline: schema.profiles.headline,
        bio: schema.profiles.bio,
        profileType: schema.profiles.profileType,
        status: schema.profiles.status,
        templateId: schema.profiles.templateId,
        socialLinks: schema.profiles.socialLinks,
        createdAt: schema.profiles.createdAt,
        updatedAt: schema.profiles.updatedAt,
        ownerId: schema.profiles.ownerId,
        ownerName: schema.users.name,
        ownerEmail: schema.users.email,
        ownerStatus: schema.users.status,
        ownerRole: schema.users.systemRole,
      })
      .from(schema.profiles)
      .leftJoin(schema.users, eq(schema.profiles.ownerId, schema.users.id))
      .where(eq(schema.profiles.id, profileId))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Profile ${profileId} not found.`);
    }

    const businesses = await this.dbService.db
      .select({
        id: schema.profileBusinesses.id,
        name: schema.profileBusinesses.name,
        category: schema.profileBusinesses.tagline,
        website: schema.profileBusinesses.website,
      })
      .from(schema.profileBusinesses)
      .where(eq(schema.profileBusinesses.profileId, profileId));

    const cards = await this.dbService.db
      .select({
        id: schema.cards.id,
        serialNumber: schema.cards.serialNumber,
        status: schema.cards.status,
        createdAt: schema.cards.createdAt,
      })
      .from(schema.cards)
      .where(eq(schema.cards.profileId, profileId));

    const activityLogs = await this.dbService.db
      .select({
        id: schema.auditLogs.id,
        actorId: schema.auditLogs.actorId,
        action: schema.auditLogs.action,
        resourceType: schema.auditLogs.resourceType,
        resourceId: schema.auditLogs.resourceId,
        createdAt: schema.auditLogs.createdAt,
      })
      .from(schema.auditLogs)
      .where(eq(schema.auditLogs.resourceId, profileId))
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(20);

    return {
      profile: {
        id: row.id,
        slug: row.slug,
        displayName: row.displayName,
        headline: row.headline,
        bio: row.bio,
        profileType: row.profileType,
        status: row.status,
        templateId: row.templateId,
        socialLinks: row.socialLinks,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      owner: {
        id: row.ownerId,
        name: row.ownerName,
        email: row.ownerEmail,
        status: row.ownerStatus,
        systemRole: row.ownerRole,
      },
      businesses,
      cards,
      activityLogs,
    };
  }

  async updateProfileStatus(
    profileId: string,
    newStatus: 'PUBLISHED' | 'DRAFT' | 'SUSPENDED',
    actor: ActorContext,
  ) {
    const result = await this.dbService.db.transaction(async (tx: any) => {
      const [existing] = await tx
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.id, profileId))
        .for('update')
        .limit(1);

      if (!existing) {
        throw new NotFoundException(`Profile ${profileId} not found.`);
      }

      const [updated] = await tx
        .update(schema.profiles)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(schema.profiles.id, profileId))
        .returning();

      if (this.activityLogService) {
        await this.activityLogService.record(
          {
            actorId: actor.userId,
            actorRole: actor.role,
            action: 'admin:profile_status_update',
            resourceType: 'profile',
            resourceId: profileId,
            before: { status: existing.status },
            after: { status: newStatus },
          },
          tx,
        );
      } else {
        await tx.insert(schema.auditLogs).values({
          id: crypto.randomUUID(),
          actorId: actor.userId,
          action: 'admin:profile_status_update',
          resourceType: 'profile',
          resourceId: profileId,
          metadata: { actorRole: actor.role, before: { status: existing.status }, after: { status: newStatus } },
          createdAt: new Date(),
        });
      }

      return updated;
    });

    if (this.redisService && result?.slug) {
      const cleanSlug = String(result.slug).toLowerCase();
      await Promise.all([
        this.redisService.del(`profile:slug:${cleanSlug}`),
        this.redisService.del(`profile:notfound:${cleanSlug}`),
      ]);
    }

    return {
      success: true,
      profileId,
      status: result.status,
    };
  }

  async getAllCards(options?: {
    q?: string;
    status?: string;
    productId?: string;
    assigned?: string;
    orderId?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, Number(options?.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(options?.pageSize || 25)));
    const offset = (page - 1) * pageSize;

    const conditions: any[] = [];
    if (options?.status && options.status !== 'ALL') {
      conditions.push(eq(schema.purchasedCards.status, options.status.toUpperCase()));
    }
    if (options?.productId && options.productId !== 'ALL') {
      conditions.push(eq(schema.purchasedCards.productId, options.productId));
    }
    if (options?.assigned === 'assigned') {
      conditions.push(sql`${schema.purchasedCards.profileId} is not null`);
    } else if (options?.assigned === 'unassigned') {
      conditions.push(sql`${schema.purchasedCards.profileId} is null`);
    }
    if (options?.orderId && options.orderId.trim()) {
      const oq = `%${options.orderId.trim()}%`;
      conditions.push(or(ilike(schema.purchasedCards.orderId, oq), ilike(schema.orders.orderNumber, oq)));
    }
    if (options?.q && options.q.trim()) {
      const q = `%${options.q.trim()}%`;
      conditions.push(
        or(
          ilike(schema.purchasedCards.cardCode, q),
          ilike(schema.purchasedCards.id, q),
          ilike(schema.profiles.displayName, q),
          ilike(schema.profiles.slug, q),
          ilike(schema.users.name, q),
          ilike(schema.users.email, q),
          ilike(schema.orders.orderNumber, q),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined;
    const [countRow] = await this.dbService.db
      .select({ total: sql<number>`count(*)` })
      .from(schema.purchasedCards)
      .leftJoin(
        schema.profiles,
        and(eq(schema.purchasedCards.profileId, schema.profiles.id), activeProfiles()),
      )
      .leftJoin(schema.users, eq(schema.purchasedCards.userId, schema.users.id))
      .leftJoin(schema.orders, eq(schema.purchasedCards.orderId, schema.orders.id))
      .where(whereClause);

    const rawItems = await this.dbService.db
      .select({
        id: schema.purchasedCards.id,
        cardCode: schema.purchasedCards.cardCode,
        productId: schema.purchasedCards.productId,
        productName: schema.purchasedCards.productName,
        variantName: schema.purchasedCards.variantName,
        material: schema.purchasedCards.material,
        status: schema.purchasedCards.status,
        statusChangedAt: schema.purchasedCards.statusChangedAt,
        statusReason: schema.purchasedCards.statusReason,
        profileId: schema.purchasedCards.profileId,
        profileName: schema.profiles.displayName,
        profileSlug: schema.profiles.slug,
        profileType: schema.profiles.profileType,
        ownerId: sql<string | null>`coalesce(${schema.purchasedCards.userId}, ${schema.orders.userId})`,
        ownerName: schema.users.name,
        ownerEmail: schema.users.email,
        ownerPhone: schema.users.phoneNumber,
        orderId: schema.purchasedCards.orderId,
        orderNumber: schema.orders.orderNumber,
        nfcUrl: schema.purchasedCards.nfcUrl,
        redirectToken: schema.purchasedCards.redirectToken,
        tapCount: schema.purchasedCards.tapCount,
        lastTappedAt: schema.purchasedCards.lastTappedAt,
        issuedAt: schema.purchasedCards.issuedAt,
        assignedAt: schema.purchasedCards.assignedAt,
        createdAt: schema.purchasedCards.createdAt,
      })
      .from(schema.purchasedCards)
      .leftJoin(
        schema.profiles,
        and(eq(schema.purchasedCards.profileId, schema.profiles.id), activeProfiles()),
      )
      .leftJoin(schema.orders, eq(schema.purchasedCards.orderId, schema.orders.id))
      .leftJoin(
        schema.users,
        eq(
          sql`coalesce(${schema.purchasedCards.userId}, ${schema.orders.userId})`,
          schema.users.id,
        ),
      )
      .where(whereClause)
      .orderBy(desc(schema.purchasedCards.createdAt))
      .limit(pageSize)
      .offset(offset);

    const items = rawItems.map((row: any) => ({
      ...row,
      status: this.deriveCardStatus(row.status, row.profileId),
    }));

    return { items, total: Number(countRow?.total || 0), page, pageSize };
  }

  private deriveCardStatus(rawStatus: string | null | undefined, profileId: string | null | undefined): string {
    const upper = (rawStatus || '').toUpperCase();
    if (upper === 'ACTIVE' || upper === 'SUSPENDED' || upper === 'LOST') {
      return upper;
    }
    return profileId ? 'ASSIGNED' : 'UNASSIGNED';
  }

  private generateShortCardCode(): string {
    return `TPZ${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const bytes = crypto.randomBytes(7);
    let code = 'TPZ';
    for (let i = 0; i < 7; i++) {
      code += alphabet[bytes[i] % alphabet.length];
    }
    return code;
  }

  private generatePermanentUrlId(): string {
    const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
    const bytes = crypto.randomBytes(10);
    let out = '';
    for (let i = 0; i < 10; i++) {
      out += alphabet[bytes[i] % alphabet.length];
    }
    return out;
  }

  private generateRandomCardId(): string {
    const alphabet = '23456789abcdefghjkmnpqrstuvwxyz';
    const bytes = crypto.randomBytes(10);
    let out = '';
    for (let i = 0; i < 10; i++) {
      out += alphabet[bytes[i] % alphabet.length];
    }
    return out;
  }

  private async generateUniqueCardIdentifiers(tx: any): Promise<{ cardCode: string; urlId: string }> {
      const reserved = new Set([
        'admin', 'api', 'dashboard', 'login', 'register', 'signup', 'logout', 'orders',
        'p', 'b', 'c', 'cards', 'profiles', 'analytics', 'leads', 'settings', 'billing',
        'pricing', 'templates', 'studio', 'checkout', 'support', 'help', 'about', 'terms',
        'privacy', 'nfc', 'qr', 'app', 'static', 'assets', 'health', 'metrics',
      ]);
      for (let attempt = 0; attempt < 12; attempt++) {
        const cardCode = this.generateRandomCardId();
        if (reserved.has(cardCode)) continue;
        const [collision] = await tx
          .select({ id: schema.purchasedCards.id })
          .from(schema.purchasedCards)
          .where(sql`lower(${schema.purchasedCards.cardCode}) = ${cardCode}`)
          .limit(1);
        if (!collision) {
          return { cardCode, urlId: cardCode };
        }
      }
      throw new BadRequestException('Could not generate unique card identifier. Please retry.');
    }

  private validateChipUidFormat(chipUid: string): string {
    const trimmed = chipUid.trim().toUpperCase();
    if (!/^([0-9A-F]{2}:){3,9}[0-9A-F]{2}$/.test(trimmed)) {
      throw new BadRequestException(
        `Invalid Chip UID "${chipUid}". Expected hex pairs separated by colons (e.g. 04:A1:B2:C3:D4:E5:F6).`,
      );
    }
    return trimmed;
  }

  async getIssueCardContext(userId: string) {
    const [customer] = await this.dbService.db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        phoneNumber: schema.users.phoneNumber,
        status: schema.users.status,
      })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (!customer) {
      throw new NotFoundException(`Customer ${userId} not found.`);
    }

    const [orders, profiles] = await Promise.all([
      this.dbService.db
        .select({
          id: schema.orders.id,
          orderNumber: schema.orders.orderNumber,
          orderType: schema.orders.orderType,
          orderStatus: schema.orders.orderStatus,
          quantity: schema.orders.quantity,
          createdAt: schema.orders.createdAt,
        })
        .from(schema.orders)
        .where(eq(schema.orders.userId, userId))
        .orderBy(desc(schema.orders.createdAt))
        .limit(30),
      this.dbService.db
        .select({
          id: schema.profiles.id,
          displayName: schema.profiles.displayName,
          slug: schema.profiles.slug,
          profileType: schema.profiles.profileType,
          status: schema.profiles.status,
        })
        .from(schema.profiles)
        .where(and(eq(schema.profiles.ownerId, userId), activeProfiles()))
        .orderBy(desc(schema.profiles.createdAt)),
    ]);

    return { customer, orders, profiles };
  }

  private async resolveOrCreateIssueOrder(
    tx: any,
    customer: { id: string; name: string; phoneNumber: string | null },
    orderId?: string | null,
    quantity = 1,
    material = 'pvc',
    profileId?: string | null,
  ) {
    if (orderId) {
      const [existingOrder] = await tx
        .select({
          id: schema.orders.id,
          orderNumber: schema.orders.orderNumber,
          userId: schema.orders.userId,
        })
        .from(schema.orders)
        .where(eq(schema.orders.id, orderId))
        .limit(1);

      if (!existingOrder) {
        throw new NotFoundException(`Order ${orderId} not found.`);
      }
      if (existingOrder.userId !== customer.id) {
        throw new UnprocessableEntityException('Selected order does not belong to this customer.');
      }
      return existingOrder;
    }

    const newOrderId = `ord-${crypto.randomUUID().slice(0, 12)}`;
    const orderNumber = `ADM-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const [createdOrder] = await tx
      .insert(schema.orders)
      .values({
        id: newOrderId,
        orderNumber,
        orderType: 'admin_issued',
        userId: customer.id,
        profileId: profileId || null,
        material,
        quantity,
        shippingAddress: {
          recipientName: customer.name || 'Customer',
          phone: customer.phoneNumber || 'N/A',
          street: 'Admin Issued',
          city: 'N/A',
          state: 'N/A',
          postalCode: '000000',
          country: 'IN',
        },
        orderStatus: 'ORDER_CONFIRMED',
        paymentStatus: 'not_applicable',
        paymentMethod: 'offline',
        subtotal: 0,
        shippingCost: 0,
        taxAmount: 0,
        totalAmount: 0,
        currency: 'INR',
      })
      .returning({
        id: schema.orders.id,
        orderNumber: schema.orders.orderNumber,
      });

    return createdOrder;
  }

  async registerCard(
    body: {
      userId: string;
      productId: string;
      quantity?: number;
      orderId?: string | null;
      chipUid?: string | null;
      profileId?: string | null;
      note?: string | null;
    },
    actor: ActorContext,
  ) {
    const quantity = Math.min(50, Math.max(1, Number(body.quantity || 1)));
    if (quantity > 1 && body.chipUid?.trim()) {
      throw new BadRequestException('Chip UID can only be specified when issuing a single card.');
    }

    const cleanChipUid = body.chipUid?.trim()
      ? this.validateChipUidFormat(body.chipUid)
      : null;

    return this.dbService.db.transaction(async (tx: any) => {
      const [customer] = await tx
        .select({
          id: schema.users.id,
          name: schema.users.name,
          email: schema.users.email,
          phoneNumber: schema.users.phoneNumber,
          status: schema.users.status,
        })
        .from(schema.users)
        .where(eq(schema.users.id, body.userId))
        .limit(1);

      if (!customer) {
        throw new NotFoundException(`Customer ${body.userId} not found.`);
      }
      if ((customer.status || '').toLowerCase() !== 'active') {
        throw new UnprocessableEntityException('Cards can only be issued to active customers.');
      }

      const [product] = await tx
        .select()
        .from(schema.cardProducts)
        .where(eq(schema.cardProducts.id, body.productId))
        .limit(1);

      if (!product || !product.isActive) {
        throw new UnprocessableEntityException('Selected product is not active.');
      }

      const id = `card-${crypto.randomUUID().slice(0, 12)}`;
      const cardCode = this.generateShortCardCode();
      const redirectToken = crypto.randomBytes(8).toString('hex');
      const nfcUrl = `https://taptch.com/c/${cardCode}`;
      if (body.profileId) {
        const [profile] = await tx
          .select({
            id: schema.profiles.id,
            ownerId: schema.profiles.ownerId,
            status: schema.profiles.status,
            deletedAt: schema.profiles.deletedAt,
          })
          .from(schema.profiles)
          .where(eq(schema.profiles.id, body.profileId))
          .limit(1);

        if (!profile || profile.status?.toUpperCase() === 'DELETED' || profile.deletedAt) {
          throw new NotFoundException(`Profile ${body.profileId} not found.`);
        }
        if (profile.ownerId !== customer.id) {
          throw new UnprocessableEntityException(
            'This profile belongs to a different user than the card owner.',
          );
        }
      }

      const order = await this.resolveOrCreateIssueOrder(
        tx,
        customer,
        body.orderId,
        quantity,
        product.material || 'pvc',
        body.profileId,
      );

      const now = new Date();
      const isAssigned = Boolean(body.profileId);
      const createdItems: any[] = [];

      for (let i = 0; i < quantity; i++) {
        const id = `card-${crypto.randomUUID().slice(0, 12)}`;
        const { cardCode } = await this.generateUniqueCardIdentifiers(tx);
        const nfcUrl = buildCardUrl(cardCode);

        const [created] = await tx
          .insert(schema.purchasedCards)
          .values({
            id,
            userId: customer.id,
            orderId: order.id,
            unitIndex: i + 1,
            cardCode,
            urlId: cardCode,
            redirectToken: cardCode,
            nfcUrl,
            chipUid: i === 0 ? cleanChipUid : null,
            productId: product.id,
            productName: product.name,
            variantName: product.colorName || 'Standard',
            material: product.material || 'pvc',
            colorName: product.colorName || 'Black',
            color: product.color || '#000000',
            status: isAssigned ? 'ASSIGNED' : 'UNASSIGNED',
            profileId: body.profileId || null,
            profileAssignmentStatus: isAssigned ? 'PROFILE_ATTACHED' : 'AWAITING_PROFILE',
            assignedAt: isAssigned ? now : null,
            issuedBy: actor.userId,
            issuedAt: now,
            note: body.note?.trim() || null,
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        createdItems.push(created);
      }

      const codesLabel = createdItems.map((c) => c.cardCode).join(', ');
      const noteSuffix = body.note?.trim() ? ` Note: ${body.note.trim()}` : '';
      await tx.insert(schema.userNotifications).values({
        id: crypto.randomUUID(),
        userId: customer.id,
        type: 'card_issued',
        title: `A new NFC card ${createdItems[0].cardCode} has been added to your account`,
        message: `${createdItems.length > 1 ? `${createdItems.length} NFC cards (${codesLabel}) have` : `NFC card ${codesLabel} has`} been issued to your account.${noteSuffix}`,
        resourceType: 'purchased_card',
        resourceId: createdItems[0].id,
        isRead: false,
      });

      if (this.activityLogService) {
        await this.activityLogService.record(
          {
            actorId: actor.userId,
            actorRole: actor.role,
            action: 'admin:card_issue',
            resourceType: 'purchased_card',
            resourceId: createdItems[0].id,
            after: {
              customerId: customer.id,
              customerEmail: customer.email,
              orderId: order.id,
              cardCodes: createdItems.map((c) => c.cardCode),
              quantity,
            },
          },
          tx,
        );
      }

      return {
        count: createdItems.length,
        orderId: order.id,
        orderNumber: order.orderNumber,
        customer: { id: customer.id, name: customer.name, email: customer.email },
        items: createdItems,
      };
    });
  }

  async bulkRegisterCards(
    body: {
      userId: string;
      productId: string;
      orderId?: string | null;
      note?: string | null;
      rows: Array<{ chipUid?: string; profileUsername?: string }>;
    },
    actor: ActorContext,
  ) {
    const rows = body.rows || [];
    if (rows.length === 0 || rows.length > 50) {
      throw new BadRequestException('Bulk issue requires between 1 and 50 rows.');
    }

    return this.dbService.db.transaction(async (tx: any) => {
      const [customer] = await tx
        .select({
          id: schema.users.id,
          name: schema.users.name,
          email: schema.users.email,
          phoneNumber: schema.users.phoneNumber,
          status: schema.users.status,
        })
        .from(schema.users)
        .where(eq(schema.users.id, body.userId))
        .limit(1);

      if (!customer) {
        throw new NotFoundException(`Customer ${body.userId} not found.`);
      }
      if ((customer.status || '').toLowerCase() !== 'active') {
        throw new UnprocessableEntityException('Cards can only be issued to active customers.');
      }

      const [product] = await tx
        .select()
        .from(schema.cardProducts)
        .where(eq(schema.cardProducts.id, body.productId))
        .limit(1);

      if (!product || !product.isActive) {
        throw new UnprocessableEntityException('Selected product is not active.');
      }

      const customerProfiles = await tx
        .select({
          id: schema.profiles.id,
          slug: schema.profiles.slug,
        })
        .from(schema.profiles)
        .where(and(eq(schema.profiles.ownerId, customer.id), activeProfiles()));
      const profileBySlug = new Map<string, string>(
        customerProfiles.map((p: any) => [String(p.slug).toLowerCase(), p.id]),
      );

      const rowErrors: string[] = [];
      const preparedRows: Array<{ profileId: string | null }> = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 1;
        let profileId: string | null = null;

        if (row.profileUsername && row.profileUsername.trim()) {
          const slug = row.profileUsername.trim().replace(/^@/, '').toLowerCase();
          const matchedProfileId = profileBySlug.get(slug);
          if (!matchedProfileId) {
            rowErrors.push(
              `Row ${rowNum}: Profile "@${slug}" does not exist or does not belong to ${customer.name}.`,
            );
          } else {
            profileId = matchedProfileId;
          }
        }

        preparedRows.push({ profileId });
      }

      if (rowErrors.length > 0) {
        throw new BadRequestException(rowErrors.join(' '));
      }

      const order = await this.resolveOrCreateIssueOrder(
        tx,
        customer,
        body.orderId,
        preparedRows.length,
        product.material || 'pvc',
        null,
      );

      const now = new Date();
      const createdItems: any[] = [];

      for (let i = 0; i < preparedRows.length; i++) {
        const id = `card-${crypto.randomUUID().slice(0, 12)}`;
        const { cardCode } = await this.generateUniqueCardIdentifiers(tx);
        const nfcUrl = buildCardUrl(cardCode);
        const prep = preparedRows[i];
        const isAssigned = Boolean(prep.profileId);

        const [created] = await tx
          .insert(schema.purchasedCards)
          .values({
            id,
            userId: customer.id,
            orderId: order.id,
            unitIndex: i + 1,
            cardCode,
            redirectToken: cardCode,
            nfcUrl,
            productId: product.id,
            productName: product.name,
            variantName: product.colorName || 'Standard',
            material: product.material || 'pvc',
            colorName: product.colorName || 'Black',
            color: product.color || '#000000',
            status: isAssigned ? 'ASSIGNED' : 'UNASSIGNED',
            profileId: prep.profileId,
            profileAssignmentStatus: isAssigned ? 'PROFILE_ATTACHED' : 'AWAITING_PROFILE',
            assignedAt: isAssigned ? now : null,
            issuedBy: actor.userId,
            issuedAt: now,
            note: body.note?.trim() || null,
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        createdItems.push(created);
      }

      const codesLabel = createdItems.map((c) => c.cardCode).join(', ');
      await tx.insert(schema.userNotifications).values({
        id: crypto.randomUUID(),
        userId: customer.id,
        type: 'card_issued',
        title: `A new NFC card ${createdItems[0].cardCode} has been added to your account`,
        message: `${createdItems.length} NFC cards (${codesLabel}) have been issued to your account.`,
        resourceType: 'purchased_card',
        resourceId: createdItems[0].id,
        isRead: false,
      });

      if (this.activityLogService) {
        await this.activityLogService.record(
          {
            actorId: actor.userId,
            actorRole: actor.role,
            action: 'admin:card_bulk_issue',
            resourceType: 'purchased_card',
            resourceId: `bulk-${createdItems.length}`,
            after: {
              customerId: customer.id,
              orderId: order.id,
              cardCodes: createdItems.map((c) => c.cardCode),
              count: createdItems.length,
            },
          },
          tx,
        );
      }

      return {
        count: createdItems.length,
        orderId: order.id,
        orderNumber: order.orderNumber,
        customer: { id: customer.id, name: customer.name, email: customer.email },
        items: createdItems,
      };
    });
  }

  async getCardDetails(cardId: string) {
    const [rawCard] = await this.dbService.db
      .select({
        id: schema.purchasedCards.id,
        cardCode: schema.purchasedCards.cardCode,
        productId: schema.purchasedCards.productId,
        productName: schema.purchasedCards.productName,
        variantName: schema.purchasedCards.variantName,
        material: schema.purchasedCards.material,
        status: schema.purchasedCards.status,
        statusChangedAt: schema.purchasedCards.statusChangedAt,
        statusChangedBy: schema.purchasedCards.statusChangedBy,
        statusReason: schema.purchasedCards.statusReason,
        profileId: schema.purchasedCards.profileId,
        profileName: schema.profiles.displayName,
        profileSlug: schema.profiles.slug,
        profileType: schema.profiles.profileType,
        ownerId: sql<string | null>`coalesce(${schema.purchasedCards.userId}, ${schema.orders.userId})`,
        ownerName: schema.users.name,
        ownerEmail: schema.users.email,
        ownerPhone: schema.users.phoneNumber,
        orderId: schema.purchasedCards.orderId,
        orderNumber: schema.orders.orderNumber,
        nfcUrl: schema.purchasedCards.nfcUrl,
        redirectToken: schema.purchasedCards.redirectToken,
        tapCount: schema.purchasedCards.tapCount,
        lastTappedAt: schema.purchasedCards.lastTappedAt,
        issuedAt: schema.purchasedCards.issuedAt,
        assignedAt: schema.purchasedCards.assignedAt,
        createdAt: schema.purchasedCards.createdAt,
      })
      .from(schema.purchasedCards)
      .leftJoin(
        schema.profiles,
        and(eq(schema.purchasedCards.profileId, schema.profiles.id), activeProfiles()),
      )
      .leftJoin(schema.orders, eq(schema.purchasedCards.orderId, schema.orders.id))
      .leftJoin(
        schema.users,
        eq(
          sql`coalesce(${schema.purchasedCards.userId}, ${schema.orders.userId})`,
          schema.users.id,
        ),
      )
      .where(eq(schema.purchasedCards.id, cardId))
      .limit(1);

    if (!rawCard) {
      throw new NotFoundException(`Card ${cardId} not found.`);
    }

    const card = {
      ...rawCard,
      status: this.deriveCardStatus(rawCard.status, rawCard.profileId),
    };

    const now = Date.now();
    const d7 = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const d30 = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const d14 = new Date(now - 14 * 24 * 60 * 60 * 1000);

    const allEvents = card.profileId
      ? await this.dbService.db
        .select({
          id: schema.cardEvents.id,
          eventType: schema.cardEvents.eventType,
          deviceCategory: schema.cardEvents.deviceCategory,
          browser: schema.cardEvents.browser,
          os: schema.cardEvents.os,
          country: schema.cardEvents.country,
          city: schema.cardEvents.city,
          createdAt: schema.cardEvents.createdAt,
        })
        .from(schema.cardEvents)
        .where(eq(schema.cardEvents.profileId, card.profileId))
        .orderBy(desc(schema.cardEvents.createdAt))
        .limit(500)
      : [];

    const tapHistory = allEvents.slice(0, 20);
    const taps7d = allEvents.filter((e: any) => new Date(e.createdAt) >= d7).length;
    const taps30d = allEvents.filter((e: any) => new Date(e.createdAt) >= d30).length;
    const firstEv = allEvents.length > 0 ? allEvents[allEvents.length - 1] : null;
    const lastEv = allEvents.length > 0 ? allEvents[0] : null;

    const dailyMap = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const dt = new Date(now - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      dailyMap.set(dt, 0);
    }
    for (const ev of allEvents) {
      const dt = new Date(ev.createdAt);
      if (dt >= d14) {
        const key = dt.toISOString().slice(0, 10);
        if (dailyMap.has(key)) {
          dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
        }
      }
    }
    const dailyTaps14d = Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count }));

    const tapStats = {
      totalTaps: Math.max(Number(card.tapCount || 0), allEvents.length),
      taps7d,
      taps30d,
      firstTapAt: firstEv?.createdAt || null,
      lastTapAt: lastEv?.createdAt || card.lastTappedAt || null,
      lastTapLocation: lastEv ? lastEv.city || lastEv.country || null : null,
      lastTapDevice: lastEv ? [lastEv.deviceCategory, lastEv.os].filter(Boolean).join(' · ') || null : null,
      dailyTaps14d,
    };

    const blockedScans = await this.dbService.db
      .select({
        id: schema.blockedCardScans.id,
        cardStatus: schema.blockedCardScans.cardStatus,
        deviceCategory: schema.blockedCardScans.deviceCategory,
        country: schema.blockedCardScans.country,
        city: schema.blockedCardScans.city,
        createdAt: schema.blockedCardScans.createdAt,
      })
      .from(schema.blockedCardScans)
      .where(eq(schema.blockedCardScans.cardId, cardId))
      .orderBy(desc(schema.blockedCardScans.createdAt))
      .limit(50);

    return { card, tapHistory, tapStats, blockedScans };
  }

  async getAssignableProfilesForCard(cardId: string, search?: string) {
    const [card] = await this.dbService.db
      .select({
        id: schema.purchasedCards.id,
        userId: schema.purchasedCards.userId,
        orderUserId: schema.orders.userId,
      })
      .from(schema.purchasedCards)
      .leftJoin(schema.orders, eq(schema.purchasedCards.orderId, schema.orders.id))
      .where(eq(schema.purchasedCards.id, cardId))
      .limit(1);

    if (!card) {
      throw new NotFoundException(`Card ${cardId} not found.`);
    }

    const ownerId = card.userId || card.orderUserId;
    if (!ownerId) {
      return { owner: null, allowsMultipleCards: false, profiles: [] };
    }

    const [owner] = await this.dbService.db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
      })
      .from(schema.users)
      .where(eq(schema.users.id, ownerId))
      .limit(1);

    if (!owner) {
      return { owner: null, allowsMultipleCards: false, profiles: [] };
    }

    const [sub] = await this.dbService.db
      .select({ planId: schema.tenantSubscriptions.planId })
      .from(schema.tenantSubscriptions)
      .where(
        and(
          eq(schema.tenantSubscriptions.userId, ownerId),
          eq(schema.tenantSubscriptions.status, 'active'),
        ),
      )
      .limit(1);

    const plan = sub?.planId || 'nano';
    const allowsMultipleCards = plan === 'mini' || plan === 'max';

    const conditions: any[] = [eq(schema.profiles.ownerId, ownerId), activeProfiles()];
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push(or(ilike(schema.profiles.displayName, q), ilike(schema.profiles.slug, q)));
    }

    const profiles = await this.dbService.db
      .select({
        id: schema.profiles.id,
        displayName: schema.profiles.displayName,
        slug: schema.profiles.slug,
        profileType: schema.profiles.profileType,
        templateId: schema.profiles.templateId,
        status: schema.profiles.status,
      })
      .from(schema.profiles)
      .where(and(...conditions))
      .orderBy(desc(schema.profiles.createdAt));

    const profileIds = profiles.map((p: any) => p.id);
    const otherCards =
      profileIds.length > 0
        ? await this.dbService.db
          .select({
            id: schema.purchasedCards.id,
            profileId: schema.purchasedCards.profileId,
            cardCode: schema.purchasedCards.cardCode,
          })
          .from(schema.purchasedCards)
          .where(
            and(
              inArray(schema.purchasedCards.profileId, profileIds),
              ne(schema.purchasedCards.id, cardId),
            ),
          )
        : [];

    return {
      owner: { ...owner, plan },
      allowsMultipleCards,
      profiles: profiles.map((p: any) => {
        const attached = otherCards.find((c: any) => c.profileId === p.id);
        return {
          ...p,
          hasCard: Boolean(attached),
          attachedCardCode: attached?.cardCode || attached?.id || null,
        };
      }),
    };
  }

  async updateCardAdmin(
    cardId: string,
    body: {
      userId?: string | null;
      profileId?: string | null;
      status?: 'UNASSIGNED' | 'ASSIGNED' | 'ACTIVE' | 'SUSPENDED' | 'LOST';
      statusReason?: string | null;
      customDestinationUrl?: string | null;
      featureFlags?: Record<string, unknown>;
    },
    actor: ActorContext,
  ) {
    return this.dbService.db.transaction(async (tx: any) => {
      const [existing] = await tx
        .select()
        .from(schema.purchasedCards)
        .where(eq(schema.purchasedCards.id, cardId))
        .for('update')
        .limit(1);

      if (!existing) {
        throw new NotFoundException(`Card ${cardId} not found.`);
      }

      let orderOwnerId: string | null = null;
      if (existing.orderId) {
        const [ord] = await tx
          .select({ userId: schema.orders.userId })
          .from(schema.orders)
          .where(eq(schema.orders.id, existing.orderId))
          .limit(1);
        orderOwnerId = ord?.userId || null;
      }

      const nextOwnerId =
        body.userId !== undefined ? body.userId : existing.userId || orderOwnerId;

      if (body.userId !== undefined && body.userId) {
        const [ownerExists] = await tx
          .select({ id: schema.users.id })
          .from(schema.users)
          .where(eq(schema.users.id, body.userId))
          .limit(1);
        if (!ownerExists) {
          throw new NotFoundException(`User ${body.userId} not found.`);
        }
      }

      const ownerChanged =
        body.userId !== undefined && body.userId !== (existing.userId || orderOwnerId);

      let nextProfileId =
        body.profileId !== undefined
          ? body.profileId
          : ownerChanged
            ? null
            : existing.profileId;

      if (nextProfileId) {
        const [profile] = await tx
          .select({
            id: schema.profiles.id,
            ownerId: schema.profiles.ownerId,
            status: schema.profiles.status,
            deletedAt: schema.profiles.deletedAt,
          })
          .from(schema.profiles)
          .where(eq(schema.profiles.id, nextProfileId))
          .limit(1);

        if (!profile) {
          throw new NotFoundException(`Profile ${nextProfileId} not found.`);
        }

        if (profile.status?.toUpperCase() === 'DELETED' || profile.deletedAt) {
          throw new UnprocessableEntityException('Cannot assign a card to a deleted profile.');
        }

        if (!nextOwnerId || profile.ownerId !== nextOwnerId) {
          throw new UnprocessableEntityException(
            'This profile belongs to a different user than the card owner.',
          );
        }

        const [otherCard] = await tx
          .select({ id: schema.purchasedCards.id })
          .from(schema.purchasedCards)
          .where(
            and(
              eq(schema.purchasedCards.profileId, nextProfileId),
              ne(schema.purchasedCards.id, cardId),
            ),
          )
          .limit(1);

        if (otherCard) {
          const [sub] = await tx
            .select({ planId: schema.tenantSubscriptions.planId })
            .from(schema.tenantSubscriptions)
            .where(
              and(
                eq(schema.tenantSubscriptions.userId, nextOwnerId),
                eq(schema.tenantSubscriptions.status, 'active'),
              ),
            )
            .limit(1);
          const plan = sub?.planId || 'nano';
          if (plan !== 'mini' && plan !== 'max') {
            throw new UnprocessableEntityException(
              "This profile already has a card attached and the user's plan allows one card per profile.",
            );
          }
        }
      }

      const nextStatus = body.status
        ? body.status
        : ownerChanged || body.profileId !== undefined
          ? this.deriveCardStatus(
            body.profileId === null || ownerChanged ? 'UNASSIGNED' : existing.status,
            nextProfileId,
          )
          : this.deriveCardStatus(existing.status, nextProfileId);

      const statusChanged = nextStatus !== existing.status;

      const [updated] = await tx
        .update(schema.purchasedCards)
        .set({
          userId: nextOwnerId,
          profileId: nextProfileId,
          status: nextStatus,
          statusChangedAt: statusChanged ? new Date() : existing.statusChangedAt,
          statusChangedBy: statusChanged ? actor.userId : existing.statusChangedBy,
          statusReason:
            body.statusReason !== undefined
              ? body.statusReason || null
              : statusChanged && nextStatus === 'ACTIVE'
                ? null
                : existing.statusReason,
          assignedAt:
            nextProfileId && !existing.assignedAt
              ? new Date()
              : nextProfileId
                ? existing.assignedAt
                : null,
          customDestinationUrl:
            body.customDestinationUrl !== undefined
              ? body.customDestinationUrl || null
              : existing.customDestinationUrl,
          featureFlags: body.featureFlags
            ? { ...(existing.featureFlags || {}), ...body.featureFlags }
            : existing.featureFlags,
          updatedAt: new Date(),
        })
        .where(eq(schema.purchasedCards.id, cardId))
        .returning();

      if (statusChanged && nextOwnerId && (nextStatus === 'SUSPENDED' || nextStatus === 'LOST')) {
        const cardCodeLabel = updated.cardCode || updated.id;
        const notifTitle =
          nextStatus === 'LOST'
            ? `Your card ${cardCodeLabel} has been marked as lost`
            : `Your card ${cardCodeLabel} has been suspended`;
        const notifMessage =
          nextStatus === 'LOST'
            ? `Your NFC card (${cardCodeLabel}) was marked as lost and has been disabled. Contact support if you need a replacement.`
            : `Your NFC card (${cardCodeLabel}) has been suspended and cannot be used until reactivated.${body.statusReason ? ` Reason: ${body.statusReason}` : ''}`;

        await tx.insert(schema.userNotifications).values({
          id: crypto.randomUUID(),
          userId: nextOwnerId,
          type: 'card_status_changed',
          title: notifTitle,
          message: notifMessage,
          resourceType: 'purchased_card',
          resourceId: cardId,
          isRead: false,
        });
      }

      if (this.activityLogService) {
        await this.activityLogService.record(
          {
            actorId: actor.userId,
            actorRole: actor.role,
            action: 'admin:card_update',
            resourceType: 'purchased_card',
            resourceId: cardId,
            before: {
              userId: existing.userId,
              status: existing.status,
              profileId: existing.profileId,
            },
            after: {
              userId: updated.userId,
              status: updated.status,
              profileId: updated.profileId,
            },
          },
          tx,
        );
      }

      return updated;
    });
  }

  async regenerateCardUrl(cardId: string, actor: ActorContext) {
    if (actor.role !== 'super_admin') {
      throw new ForbiddenException('Only super_admin can regenerate a permanent card URL.');
    }
    return this.dbService.db.transaction(async (tx: any) => {
      const [existing] = await tx
        .select()
        .from(schema.purchasedCards)
        .where(eq(schema.purchasedCards.id, cardId))
        .for('update')
        .limit(1);

      if (!existing) {
        throw new NotFoundException(`Card ${cardId} not found.`);
      }

      const { cardCode } = await this.generateUniqueCardIdentifiers(tx);
      const newUrl = buildCardUrl(cardCode);

      const [updated] = await tx
        .update(schema.purchasedCards)
        .set({
          cardCode,
          urlId: cardCode,
          redirectToken: cardCode,
          nfcUrl: newUrl,
          updatedAt: new Date(),
        })
        .where(eq(schema.purchasedCards.id, cardId))
        .returning();

      if (this.activityLogService) {
        await this.activityLogService.record(
          {
            actorId: actor.userId,
            actorRole: actor.role,
            action: 'admin:card_url_regenerate',
            resourceType: 'purchased_card',
            resourceId: cardId,
            before: { cardCode: existing.cardCode, urlId: existing.urlId, nfcUrl: existing.nfcUrl },
            after: { cardCode, nfcUrl: newUrl },
          },
          tx,
        );
      }

      return updated;
    });
  }

  async getAllProductsAdmin(options?: { q?: string; material?: string; sort?: string }) {
    const conditions: any[] = [];
    if (options?.material && options.material !== 'ALL') {
      conditions.push(eq(schema.cardProducts.material, options.material.toLowerCase()));
    }
    if (options?.q?.trim()) {
      const q = `%${options.q.trim()}%`;
      conditions.push(
        or(
          ilike(schema.cardProducts.name, q),
          ilike(schema.cardProducts.colorName, q),
          ilike(schema.cardProducts.description, q),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    let orderByClause: any = desc(schema.cardProducts.createdAt);
    if (options?.sort === 'price-asc') orderByClause = schema.cardProducts.basePrice;
    else if (options?.sort === 'price-desc') orderByClause = desc(schema.cardProducts.basePrice);
    else if (options?.sort === 'name-asc') orderByClause = schema.cardProducts.name;

    const items = await this.dbService.db
      .select()
      .from(schema.cardProducts)
      .where(whereClause)
      .orderBy(orderByClause);

    return { items, total: items.length };
  }

  async createProductAdmin(
    body: {
      name: string;
      material: 'pvc' | 'metal';
      finish?: string;
      colorName: string;
      color: string;
      basePrice: number;
      description: string;
      imageUrl?: string;
      stockStatus?: 'IN_STOCK' | 'OUT_OF_STOCK';
      isActive?: boolean;
    },
    actor: ActorContext,
  ) {
    return this.dbService.db.transaction(async (tx: any) => {
      const id = `prod_${crypto.randomUUID().slice(0, 8)}`;
      const slug = `${body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${id.slice(-4)}`;
      const [created] = await tx
        .insert(schema.cardProducts)
        .values({
          id,
          name: body.name.trim(),
          slug,
          description: body.description.trim(),
          basePrice: body.basePrice,
          material: body.material,
          finish: body.finish || 'solid-matte',
          colorName: body.colorName.trim(),
          color: body.color.trim(),
          imageUrl: body.imageUrl?.trim() || null,
          stockStatus: body.stockStatus || 'IN_STOCK',
          isActive: body.isActive !== undefined ? body.isActive : true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (this.activityLogService) {
        await this.activityLogService.record(
          {
            actorId: actor.userId,
            actorRole: actor.role,
            action: 'admin:product_create',
            resourceType: 'card_product',
            resourceId: id,
            after: created,
          },
          tx,
        );
      }

      return created;
    });
  }

  async updateProductAdmin(
    productId: string,
    body: {
      name?: string;
      material?: 'pvc' | 'metal';
      finish?: string;
      colorName?: string;
      color?: string;
      basePrice?: number;
      description?: string;
      imageUrl?: string | null;
      stockStatus?: 'IN_STOCK' | 'OUT_OF_STOCK';
      isActive?: boolean;
    },
    actor: ActorContext,
  ) {
    return this.dbService.db.transaction(async (tx: any) => {
      const [existing] = await tx
        .select()
        .from(schema.cardProducts)
        .where(eq(schema.cardProducts.id, productId))
        .limit(1);

      if (!existing) {
        throw new NotFoundException(`Product ${productId} not found.`);
      }

      const [updated] = await tx
        .update(schema.cardProducts)
        .set({
          name: body.name !== undefined ? body.name.trim() : existing.name,
          material: body.material ?? existing.material,
          finish: body.finish ?? existing.finish,
          colorName: body.colorName !== undefined ? body.colorName.trim() : existing.colorName,
          color: body.color !== undefined ? body.color.trim() : existing.color,
          basePrice: body.basePrice !== undefined ? body.basePrice : existing.basePrice,
          description: body.description !== undefined ? body.description.trim() : existing.description,
          imageUrl: body.imageUrl !== undefined ? body.imageUrl : existing.imageUrl,
          stockStatus: body.stockStatus ?? existing.stockStatus,
          isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
          updatedAt: new Date(),
        })
        .where(eq(schema.cardProducts.id, productId))
        .returning();

      if (this.activityLogService) {
        await this.activityLogService.record(
          {
            actorId: actor.userId,
            actorRole: actor.role,
            action: 'admin:product_update',
            resourceType: 'card_product',
            resourceId: productId,
            after: updated,
          },
          tx,
        );
      }

      return updated;
    });
  }

  async deleteProductAdmin(productId: string, actor: ActorContext) {
    return this.dbService.db.transaction(async (tx: any) => {
      const [existing] = await tx
        .select()
        .from(schema.cardProducts)
        .where(eq(schema.cardProducts.id, productId))
        .limit(1);

      if (!existing) {
        throw new NotFoundException(`Product ${productId} not found.`);
      }

      await tx.delete(schema.cardProducts).where(eq(schema.cardProducts.id, productId));

      if (this.activityLogService) {
        await this.activityLogService.record(
          {
            actorId: actor.userId,
            actorRole: actor.role,
            action: 'admin:product_delete',
            resourceType: 'card_product',
            resourceId: productId,
            before: { name: existing.name },
          },
          tx,
        );
      }

      return { success: true, id: productId };
    });
  }

  async getAllPaymentsAdmin(options?: { status?: string; page?: number; pageSize?: number }) {
    const page = Math.max(1, Number(options?.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(options?.pageSize || 25)));
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (options?.status && options.status !== 'ALL') {
      conditions.push(eq(schema.payments.status, options.status as any));
    }
    const whereClause = conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined;

    const [countRow] = await this.dbService.db
      .select({ total: sql<number>`count(*)` })
      .from(schema.payments)
      .where(whereClause);

    const items = await this.dbService.db
      .select({
        id: schema.payments.id,
        orderId: schema.payments.orderId,
        userId: schema.payments.userId,
        paymentMethod: schema.payments.paymentMethod,
        amount: schema.payments.amount,
        currency: schema.payments.currency,
        status: schema.payments.status,
        gatewayOrderId: schema.payments.gatewayOrderId,
        gatewayPaymentId: schema.payments.gatewayPaymentId,
        createdAt: schema.payments.createdAt,
      })
      .from(schema.payments)
      .where(whereClause)
      .orderBy(desc(schema.payments.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      items: items.map((p) => ({
        ...p,
        isSimulated: Boolean(p.gatewayPaymentId?.startsWith('SIM_TEST_')),
      })),
      total: Number(countRow?.total || 0),
      page,
      pageSize,
    };
  }

  async getAnalyticsOverview() {
    const [orderAgg] = await this.dbService.db
      .select({
        totalOrders: sql<number>`count(*)`,
        paidOrders: sql<number>`count(*) filter (where ${schema.orders.paymentStatus} = 'PAID' and (${schema.orders.paymentReference} is null or ${schema.orders.paymentReference} not like 'SIM_TEST_%'))`,
        simulatedOrders: sql<number>`count(*) filter (where ${schema.orders.paymentReference} like 'SIM_TEST_%')`,
        realRevenue: sql<number>`coalesce(sum(${schema.orders.totalAmount}) filter (where ${schema.orders.paymentStatus} = 'PAID' and ${schema.orders.orderStatus} <> 'CANCELLED' and (${schema.orders.paymentReference} is null or ${schema.orders.paymentReference} not like 'SIM_TEST_%')), 0)`,
      })
      .from(schema.orders);

    return {
      totalOrders: Number(orderAgg?.totalOrders || 0),
      paidOrders: Number(orderAgg?.paidOrders || 0),
      simulatedOrders: Number(orderAgg?.simulatedOrders || 0),
      realRevenue: Number(orderAgg?.realRevenue || 0),
      timestamp: new Date().toISOString(),
    };
  }

  async getPlatformSettings() {
    const [row] = await this.dbService.db
      .select()
      .from(schema.systemSettings)
      .where(eq(schema.systemSettings.id, 'default'))
      .limit(1);

    return {
      paymentSimulatorEnabled:
        process.env.NODE_ENV !== 'production' || process.env.ALLOW_PAYMENT_SIMULATOR === 'true',
      environment: process.env.NODE_ENV || 'development',
      razorpayConfigured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
      brandName: row?.brandName ?? 'TAPTCH',
      brandTagline: row?.brandTagline ?? 'Intelligent Digital Identity & Smart Networking',
      contactEmail: row?.contactEmail ?? 'support@taptch.com',
      customDomainCname: row?.customDomainCname ?? 'domains.taptch.com',
      featuresEnabled: row?.featuresEnabled ?? {
        enablePublicRegistration: true,
        enableGoogleAuth: false,
        enablePhoneOtp: true,
        enableWalletPasses: false,
        enableCustomDomains: true,
      },
    };
  }

  async updatePlatformSettings(
    body: {
      brandName?: string;
      brandTagline?: string;
      contactEmail?: string;
      customDomainCname?: string;
      featuresEnabled?: {
        enablePublicRegistration: boolean;
        enableGoogleAuth: boolean;
        enablePhoneOtp: boolean;
        enableWalletPasses: boolean;
        enableCustomDomains: boolean;
      };
    },
    actor: ActorContext,
  ) {
    return this.dbService.db.transaction(async (tx: any) => {
      const [existing] = await tx
        .select()
        .from(schema.systemSettings)
        .where(eq(schema.systemSettings.id, 'default'))
        .limit(1);

      const nextValues = {
        brandName: body.brandName ?? existing?.brandName ?? 'TAPTCH',
        brandTagline: body.brandTagline ?? existing?.brandTagline ?? 'Intelligent Digital Identity & Smart Networking',
        contactEmail: body.contactEmail ?? existing?.contactEmail ?? 'support@taptch.com',
        customDomainCname: body.customDomainCname ?? existing?.customDomainCname ?? 'domains.taptch.com',
        featuresEnabled: body.featuresEnabled ?? existing?.featuresEnabled ?? {
          enablePublicRegistration: true,
          enableGoogleAuth: false,
          enablePhoneOtp: true,
          enableWalletPasses: false,
          enableCustomDomains: true,
        },
        updatedAt: new Date(),
      };

      if (existing) {
        await tx
          .update(schema.systemSettings)
          .set(nextValues)
          .where(eq(schema.systemSettings.id, 'default'));
      } else {
        await tx.insert(schema.systemSettings).values({
          id: 'default',
          ...nextValues,
        });
      }

      if (this.activityLogService) {
        await this.activityLogService.record(
          {
            actorId: actor.userId,
            actorRole: actor.role,
            action: 'admin:settings_update',
            resourceType: 'system_settings',
            resourceId: 'default',
            after: nextValues,
          },
          tx,
        );
      }

      return this.getPlatformSettings();
    });
  }

  async getOverviewStats() {
    const [userAgg] = await this.dbService.db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(*) filter (where ${schema.users.status} = 'active')`,
      })
      .from(schema.users);

    const [orderAgg] = await this.dbService.db
      .select({
        total: sql<number>`count(*)`,
        pending: sql<number>`count(*) filter (where ${schema.orders.orderStatus} in ('ORDER_PLACED', 'PAYMENT_PENDING', 'ORDER_CONFIRMED', 'DESIGN_REVIEW', 'CARD_PRODUCTION', 'CARD_READY'))`,
        revenue: sql<number>`coalesce(sum(${schema.orders.totalAmount}) filter (where ${schema.orders.paymentStatus} in ('PAID', 'COD_COLLECTED') and ${schema.orders.orderStatus} <> 'CANCELLED' and (${schema.orders.paymentReference} is null or ${schema.orders.paymentReference} not like 'SIM_TEST_%')), 0)`,
      })
      .from(schema.orders);

    const [cardAgg] = await this.dbService.db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(*) filter (where upper(${schema.purchasedCards.status}) = 'ACTIVE')`,
      })
      .from(schema.purchasedCards);

    const [ticketAgg] = await this.dbService.db
      .select({
        open: sql<number>`count(*) filter (where ${schema.supportTickets.status} in ('open', 'in_progress'))`,
      })
      .from(schema.supportTickets)
      .catch(() => [{ open: 0 }]);

    const recentOrders = await this.dbService.db
      .select({
        id: schema.orders.id,
        orderNumber: schema.orders.orderNumber,
        orderStatus: schema.orders.orderStatus,
        paymentStatus: schema.orders.paymentStatus,
        totalAmount: schema.orders.totalAmount,
        createdAt: schema.orders.createdAt,
        userName: schema.users.name,
        userEmail: schema.users.email,
      })
      .from(schema.orders)
      .leftJoin(schema.users, eq(schema.orders.userId, schema.users.id))
      .orderBy(desc(schema.orders.createdAt))
      .limit(5);

    const recentUsers = await this.dbService.db
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
      .limit(5);

    return {
      users: Number(userAgg?.total || 0),
      activeUsers: Number(userAgg?.active || 0),
      orders: Number(orderAgg?.total || 0),
      pendingOrders: Number(orderAgg?.pending || 0),
      cards: Number(cardAgg?.total || 0),
      activeCards: Number(cardAgg?.active || 0),
      revenue: Number(orderAgg?.revenue || 0),
      openTickets: Number(ticketAgg?.open || 0),
      recentOrders,
      recentUsers,
      timestamp: new Date().toISOString(),
    };
  }

  async getBatches(options?: { q?: string; material?: string; page?: number; pageSize?: number }) {
    const page = Math.max(1, options?.page || 1);
    const pageSize = Math.min(100, Math.max(1, options?.pageSize || 20));
    const offset = (page - 1) * pageSize;

    const conditions: any[] = [];
    if (options?.q?.trim()) {
      const q = `%${options.q.trim()}%`;
      conditions.push(ilike(schema.cardBatches.batchCode, q));
    }
    if (options?.material && options.material !== 'ALL') {
      conditions.push(eq(schema.cardBatches.material, options.material.toLowerCase()));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const items = await this.dbService.db
      .select()
      .from(schema.cardBatches)
      .where(whereClause)
      .orderBy(desc(schema.cardBatches.createdAt))
      .limit(pageSize)
      .offset(offset);

    const [countRow] = await this.dbService.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.cardBatches)
      .where(whereClause);

    return {
      items,
      total: Number(countRow?.count || 0),
      page,
      pageSize,
    };
  }

  async createBatch(
    body: { batchCode: string; quantity: number; material: string; chipType: string },
    actor: ActorContext,
  ) {
    return this.dbService.db.transaction(async (tx: any) => {
      const id = `batch-${crypto.randomUUID().slice(0, 8)}`;
      const [created] = await tx
        .insert(schema.cardBatches)
        .values({
          id,
          batchCode: body.batchCode.trim().toUpperCase(),
          quantity: body.quantity,
          material: body.material,
          chipType: body.chipType,
          createdAt: new Date(),
        })
        .returning();

      if (this.activityLogService) {
        await this.activityLogService.record(
          {
            actorId: actor.userId,
            actorRole: actor.role,
            action: 'admin:batch_create',
            resourceType: 'card_batch',
            resourceId: id,
            after: created,
          },
          tx,
        );
      }

      return created;
    });
  }

  async getPlansAndSubscriptions(options?: { q?: string; status?: string; page?: number; pageSize?: number }) {
    const allPlans = await this.dbService.db.select().from(schema.plans).orderBy(schema.plans.id);
    const allEntitlements = await this.dbService.db.select().from(schema.planEntitlements);

    const plansWithEntitlements = allPlans.map((p: any) => ({
      ...p,
      entitlements: allEntitlements.filter((e: any) => e.planId === p.id),
    }));

    const page = Math.max(1, options?.page || 1);
    const pageSize = Math.min(100, Math.max(1, options?.pageSize || 20));
    const offset = (page - 1) * pageSize;

    const conditions: any[] = [];
    if (options?.status && options.status !== 'ALL') {
      conditions.push(eq(schema.tenantSubscriptions.status, options.status));
    }
    if (options?.q?.trim()) {
      const q = `%${options.q.trim()}%`;
      conditions.push(
        or(
          ilike(schema.users.name, q),
          ilike(schema.users.email, q),
          ilike(schema.tenantSubscriptions.planId, q),
        ),
      );
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const subscriptions = await this.dbService.db
      .select({
        id: schema.tenantSubscriptions.id,
        userId: schema.tenantSubscriptions.userId,
        planId: schema.tenantSubscriptions.planId,
        status: schema.tenantSubscriptions.status,
        paymentStatus: schema.tenantSubscriptions.paymentStatus,
        validUntil: schema.tenantSubscriptions.validUntil,
        createdAt: schema.tenantSubscriptions.createdAt,
        userName: schema.users.name,
        userEmail: schema.users.email,
      })
      .from(schema.tenantSubscriptions)
      .leftJoin(schema.users, eq(schema.tenantSubscriptions.userId, schema.users.id))
      .where(whereClause)
      .orderBy(desc(schema.tenantSubscriptions.createdAt))
      .limit(pageSize)
      .offset(offset);

    const [countRow] = await this.dbService.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.tenantSubscriptions)
      .leftJoin(schema.users, eq(schema.tenantSubscriptions.userId, schema.users.id))
      .where(whereClause);

    return {
      plans: plansWithEntitlements,
      subscriptions: {
        items: subscriptions,
        total: Number(countRow?.count || 0),
        page,
        pageSize,
      },
    };
  }

  async getTemplates(options?: { q?: string; category?: string; page?: number; pageSize?: number }) {
    const page = Math.max(1, options?.page || 1);
    const pageSize = Math.min(100, Math.max(1, options?.pageSize || 20));
    const offset = (page - 1) * pageSize;

    const conditions: any[] = [];
    if (options?.q?.trim()) {
      const q = `%${options.q.trim()}%`;
      conditions.push(or(ilike(schema.cardDesignTemplates.name, q), ilike(schema.cardDesignTemplates.style, q)));
    }
    if (options?.category && options.category !== 'ALL') {
      conditions.push(eq(schema.cardDesignTemplates.category, options.category));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const items = await this.dbService.db
      .select({
        id: schema.cardDesignTemplates.id,
        name: schema.cardDesignTemplates.name,
        category: schema.cardDesignTemplates.category,
        style: schema.cardDesignTemplates.style,
        previewUrl: schema.cardDesignTemplates.previewUrl,
        isGlobal: schema.cardDesignTemplates.isGlobal,
        createdAt: schema.cardDesignTemplates.createdAt,
        updatedAt: schema.cardDesignTemplates.updatedAt,
      })
      .from(schema.cardDesignTemplates)
      .where(whereClause)
      .orderBy(desc(schema.cardDesignTemplates.createdAt))
      .limit(pageSize)
      .offset(offset);

    const [countRow] = await this.dbService.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.cardDesignTemplates)
      .where(whereClause);

    return {
      items,
      total: Number(countRow?.count || 0),
      page,
      pageSize,
    };
  }

  async updateTemplate(
    id: string,
    body: { isGlobal?: boolean; name?: string; category?: string },
    actor: ActorContext,
  ) {
    return this.dbService.db.transaction(async (tx: any) => {
      const [existing] = await tx
        .select()
        .from(schema.cardDesignTemplates)
        .where(eq(schema.cardDesignTemplates.id, id))
        .limit(1);

      if (!existing) {
        throw new NotFoundException(`Template ${id} not found.`);
      }

      const [updated] = await tx
        .update(schema.cardDesignTemplates)
        .set({
          isGlobal: body.isGlobal !== undefined ? body.isGlobal : existing.isGlobal,
          name: body.name ?? existing.name,
          category: body.category ?? existing.category,
          updatedAt: new Date(),
        })
        .where(eq(schema.cardDesignTemplates.id, id))
        .returning();

      if (this.activityLogService) {
        await this.activityLogService.record(
          {
            actorId: actor.userId,
            actorRole: actor.role,
            action: 'admin:template_update',
            resourceType: 'card_design_template',
            resourceId: id,
            before: { isGlobal: existing.isGlobal, name: existing.name },
            after: { isGlobal: updated.isGlobal, name: updated.name },
          },
          tx,
        );
      }

      return updated;
    });
  }

  async getTickets(options?: { q?: string; status?: string; priority?: string; page?: number; pageSize?: number }) {
    const page = Math.max(1, options?.page || 1);
    const pageSize = Math.min(100, Math.max(1, options?.pageSize || 20));
    const offset = (page - 1) * pageSize;

    const conditions: any[] = [];
    if (options?.status && options.status !== 'ALL') {
      conditions.push(eq(schema.supportTickets.status, options.status));
    }
    if (options?.priority && options.priority !== 'ALL') {
      conditions.push(eq(schema.supportTickets.priority, options.priority));
    }
    if (options?.q?.trim()) {
      const q = `%${options.q.trim()}%`;
      conditions.push(
        or(
          ilike(schema.supportTickets.subject, q),
          ilike(schema.supportTickets.ticketNumber, q),
          ilike(schema.users.email, q),
          ilike(schema.users.name, q),
        ),
      );
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const items = await this.dbService.db
      .select({
        id: schema.supportTickets.id,
        ticketNumber: schema.supportTickets.ticketNumber,
        userId: schema.supportTickets.userId,
        subject: schema.supportTickets.subject,
        category: schema.supportTickets.category,
        priority: schema.supportTickets.priority,
        status: schema.supportTickets.status,
        createdAt: schema.supportTickets.createdAt,
        updatedAt: schema.supportTickets.updatedAt,
        userName: schema.users.name,
        userEmail: schema.users.email,
      })
      .from(schema.supportTickets)
      .leftJoin(schema.users, eq(schema.supportTickets.userId, schema.users.id))
      .where(whereClause)
      .orderBy(desc(schema.supportTickets.updatedAt))
      .limit(pageSize)
      .offset(offset);

    const [countRow] = await this.dbService.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.supportTickets)
      .leftJoin(schema.users, eq(schema.supportTickets.userId, schema.users.id))
      .where(whereClause);

    return {
      items,
      total: Number(countRow?.count || 0),
      page,
      pageSize,
    };
  }

  async getTicketById(ticketId: string) {
    const [ticket] = await this.dbService.db
      .select({
        id: schema.supportTickets.id,
        ticketNumber: schema.supportTickets.ticketNumber,
        userId: schema.supportTickets.userId,
        subject: schema.supportTickets.subject,
        category: schema.supportTickets.category,
        priority: schema.supportTickets.priority,
        status: schema.supportTickets.status,
        createdAt: schema.supportTickets.createdAt,
        updatedAt: schema.supportTickets.updatedAt,
        userName: schema.users.name,
        userEmail: schema.users.email,
      })
      .from(schema.supportTickets)
      .leftJoin(schema.users, eq(schema.supportTickets.userId, schema.users.id))
      .where(eq(schema.supportTickets.id, ticketId))
      .limit(1);

    if (!ticket) {
      throw new NotFoundException(`Support ticket ${ticketId} not found.`);
    }

    const messages = await this.dbService.db
      .select({
        id: schema.supportTicketMessages.id,
        ticketId: schema.supportTicketMessages.ticketId,
        senderId: schema.supportTicketMessages.senderId,
        senderRole: schema.supportTicketMessages.senderRole,
        message: schema.supportTicketMessages.message,
        createdAt: schema.supportTicketMessages.createdAt,
        senderName: schema.users.name,
      })
      .from(schema.supportTicketMessages)
      .leftJoin(schema.users, eq(schema.supportTicketMessages.senderId, schema.users.id))
      .where(eq(schema.supportTicketMessages.ticketId, ticketId))
      .orderBy(schema.supportTicketMessages.createdAt);

    return { ticket, messages };
  }

  async createTicket(
    body: { subject: string; category?: string; priority?: string; message: string; userId?: string },
    actor: ActorContext,
  ) {
    return this.dbService.db.transaction(async (tx: any) => {
      const id = `tkt-${crypto.randomUUID().slice(0, 8)}`;
      const ticketNumber = `TKT-${Date.now().toString().slice(-6)}`;

      const [ticket] = await tx
        .insert(schema.supportTickets)
        .values({
          id,
          ticketNumber,
          userId: body.userId || actor.userId,
          subject: body.subject.trim(),
          category: body.category || 'general',
          priority: body.priority || 'medium',
          status: 'open',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      await tx.insert(schema.supportTicketMessages).values({
        id: `msg-${crypto.randomUUID().slice(0, 8)}`,
        ticketId: id,
        senderId: actor.userId,
        senderRole: actor.role || 'admin',
        message: body.message.trim(),
        createdAt: new Date(),
      });

      return ticket;
    });
  }

  async replyToTicket(ticketId: string, message: string, actor: ActorContext) {
    return this.dbService.db.transaction(async (tx: any) => {
      const [ticket] = await tx
        .select()
        .from(schema.supportTickets)
        .where(eq(schema.supportTickets.id, ticketId))
        .limit(1);

      if (!ticket) {
        throw new NotFoundException(`Support ticket ${ticketId} not found.`);
      }

      const [msg] = await tx
        .insert(schema.supportTicketMessages)
        .values({
          id: `msg-${crypto.randomUUID().slice(0, 8)}`,
          ticketId,
          senderId: actor.userId,
          senderRole: actor.role || 'support_admin',
          message: message.trim(),
          createdAt: new Date(),
        })
        .returning();

      await tx
        .update(schema.supportTickets)
        .set({
          status: ticket.status === 'open' ? 'in_progress' : ticket.status,
          updatedAt: new Date(),
        })
        .where(eq(schema.supportTickets.id, ticketId));

      return msg;
    });
  }

  async updateTicketStatus(
    ticketId: string,
    status: 'open' | 'in_progress' | 'resolved' | 'closed',
    actor: ActorContext,
  ) {
    return this.dbService.db.transaction(async (tx: any) => {
      const [ticket] = await tx
        .select()
        .from(schema.supportTickets)
        .where(eq(schema.supportTickets.id, ticketId))
        .limit(1);

      if (!ticket) {
        throw new NotFoundException(`Support ticket ${ticketId} not found.`);
      }

      const [updated] = await tx
        .update(schema.supportTickets)
        .set({ status, updatedAt: new Date() })
        .where(eq(schema.supportTickets.id, ticketId))
        .returning();

      if (this.activityLogService) {
        await this.activityLogService.record(
          {
            actorId: actor.userId,
            actorRole: actor.role,
            action: 'admin:ticket_status_update',
            resourceType: 'support_ticket',
            resourceId: ticketId,
            before: { status: ticket.status },
            after: { status },
          },
          tx,
        );
      }

      return updated;
    });
  }
}
