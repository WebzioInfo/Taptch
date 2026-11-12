import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';
import { eq, desc, sql, or, ilike } from 'drizzle-orm';
import type { ActorContext, PlanTier } from '../../common/types';
import * as crypto from 'crypto';

@Injectable()
export class AdminService {
  constructor(private dbService: DatabaseService) {}

  async getPlatformStats() {
    const [userCount] = await this.dbService.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.users);
    const [profileCount] = await this.dbService.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.profiles);
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
      .where(eq(schema.profiles.profileType, 'personal'));

    const [businessCount] = await this.dbService.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.profiles)
      .where(eq(schema.profiles.profileType, 'business'));

    const [publishedCount] = await this.dbService.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.profiles)
      .where(eq(schema.profiles.status, 'PUBLISHED'));

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
   * Complete Platform Financial Management & P&L
   */
  async getFinancialSummary() {
    const allOrders = await this.dbService.db
      .select()
      .from(schema.orders);

    let totalOrderValue = 0;
    let collectedRevenue = 0;
    let outstandingRevenue = 0;
    let totalCogs = 0;

    // Unit economics:
    // PVC: ₹999 price, ₹150 unit COGS
    // Metal: ₹2499 price, ₹450 unit COGS
    for (const ord of allOrders) {
      const isMetal = ord.material === 'metal';
      const unitPrice = isMetal ? 2499 : 999;
      const unitCogs = isMetal ? 450 : 150;
      const qty = ord.quantity || 1;

      const orderTotal = unitPrice * qty;
      const orderCogs = unitCogs * qty;

      totalOrderValue += orderTotal;

      if (ord.paymentStatus === 'paid_offline') {
        collectedRevenue += orderTotal;
        totalCogs += orderCogs;
      } else if (ord.paymentStatus === 'unpaid') {
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

    const grossProfit = collectedRevenue - totalCogs;
    const netProfit = grossProfit - totalExpenses;
    const profitMargin = collectedRevenue > 0 ? ((netProfit / collectedRevenue) * 100).toFixed(1) : '0';

    return {
      totalOrderValue,
      collectedRevenue,
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

    const [expense] = await this.dbService.db
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

    return expense;
  }

  async getAllUsers(search?: string, role?: string, status?: string) {
    const conditions = [];
    if (role && role !== 'ALL') conditions.push(eq(schema.users.systemRole, role));
    if (status && status !== 'ALL') conditions.push(eq(schema.users.status, status));
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(schema.users.name, q),
          ilike(schema.users.email, q),
          ilike(schema.users.phoneNumber, q),
        ),
      );
    }

    return this.dbService.db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        systemRole: schema.users.systemRole,
        status: schema.users.status,
        emailVerified: schema.users.emailVerified,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined)
      .orderBy(desc(schema.users.createdAt))
      .limit(100);
  }

  async updateUserStatus(userId: string, newStatus: string, actor: ActorContext) {
    const [user] = await this.dbService.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (!user) throw new NotFoundException(`User ${userId} not found.`);

    await this.dbService.db
      .update(schema.users)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(schema.users.id, userId));

    await this.dbService.db.insert(schema.auditLogs).values({
      id: crypto.randomUUID(),
      actorId: actor.userId,
      action: `admin:user_status_${newStatus}`,
      resourceType: 'user',
      resourceId: userId,
      metadata: { previousStatus: user.status, newStatus },
      createdAt: new Date(),
    });

    return { success: true, userId, status: newStatus };
  }

  async getAllOrders() {
    return this.dbService.db
      .select()
      .from(schema.orders)
      .orderBy(desc(schema.orders.createdAt));
  }

  async updateOrderStatus(orderId: string, status: string, paymentStatus?: string) {
    const [updated] = await this.dbService.db
      .update(schema.orders)
      .set({
        orderStatus: status,
        paymentStatus: (paymentStatus as any) || undefined,
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, orderId))
      .returning();

    if (!updated) {
      throw new NotFoundException(`Order ${orderId} not found.`);
    }

    return updated;
  }

  async assignSubscription(userId: string, planTier: PlanTier, assignedBy: ActorContext) {
    const user = await this.dbService.db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (user.length === 0) {
      throw new NotFoundException(`User ${userId} not found.`);
    }

    await this.dbService.db.insert(schema.tenantSubscriptions).values({
      id: crypto.randomUUID(),
      userId,
      planId: planTier,
      assignedBy: assignedBy.userId,
      status: 'active',
      paymentStatus: 'WAIVED',
      notes: 'Manual Super Admin Assignment',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { success: true, userId, planTier };
  }
}
