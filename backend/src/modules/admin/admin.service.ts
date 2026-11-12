import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';
import { eq, desc, sql } from 'drizzle-orm';
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

    return {
      users: Number(userCount?.count || 0),
      profiles: Number(profileCount?.count || 0),
      cards: Number(cardCount?.count || 0),
      orders: Number(orderCount?.count || 0),
      timestamp: new Date().toISOString(),
    };
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
