import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';
import { eq, desc } from 'drizzle-orm';
import type { ActorContext } from '@taptch/shared';
import * as crypto from 'crypto';

@Injectable()
export class OrdersService {
  constructor(private dbService: DatabaseService) {}

  async findAllForActor(actor: ActorContext) {
    return this.dbService.withActor(actor, async (tx) => {
      return tx
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.userId, actor.userId))
        .orderBy(desc(schema.orders.createdAt));
    });
  }

  async createOrder(actor: ActorContext, data: any) {
    if (!data.shippingAddress) {
      throw new BadRequestException('Shipping address is required.');
    }

    const orderId = crypto.randomUUID();

    const [order] = await this.dbService.withActor(actor, async (tx) => {
      return tx
        .insert(schema.orders)
        .values({
          id: orderId,
          userId: actor.userId,
          profileId: data.profileId || null,
          material: data.cardMaterial || 'pvc',
          quantity: data.quantity || 1,
          shippingAddress: {
            recipientName: data.shippingAddress.fullName || data.shippingAddress.recipientName || 'Valued Customer',
            street: data.shippingAddress.addressLine1 || data.shippingAddress.street || '',
            city: data.shippingAddress.city || '',
            state: data.shippingAddress.state || '',
            postalCode: data.shippingAddress.postalCode || '',
            country: data.shippingAddress.country || 'India',
            phone: data.shippingAddress.phone || '',
          },
          orderStatus: 'requested',
          paymentStatus: 'unpaid', // Phase 2 payments deferred
          notes: data.notes || null,
        })
        .returning();
    });

    return order;
  }
}
