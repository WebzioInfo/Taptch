import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';
import { eq, desc } from 'drizzle-orm';
import type { ActorContext } from '../../common/types';
import * as crypto from 'crypto';

@Injectable()
export class OrdersService {
  constructor(private dbService: DatabaseService) { }

  async findAllForActor(actor: ActorContext) {
    return this.dbService.withActor(actor, async (tx) => {
      const userOrders = await tx
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.userId, actor.userId))
        .orderBy(desc(schema.orders.createdAt));

      // Attach order items if present
      const results = [];
      for (const ord of userOrders) {
        try {
          const items = await tx
            .select()
            .from(schema.orderItems)
            .where(eq(schema.orderItems.orderId, ord.id));
          results.push({ ...ord, items });
        } catch (e) {
          results.push(ord);
        }
      }

      return results;
    });
  }

  async createOrder(actor: ActorContext, data: any) {
    if (!data.shippingAddress) {
      throw new BadRequestException('Shipping address is required.');
    }

    const orderId = crypto.randomUUID();

      const order = await this.dbService.withActor(actor, async (tx) => {
        // 1. Insert primary order record
        const [newOrder] = await tx
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

        // 2. If a customized designId is provided, freeze an immutable manufacturing snapshot
        if (data.designId) {
          try {
            const designRows = await tx
              .select()
              .from(schema.cardDesigns)
              .where(eq(schema.cardDesigns.id, data.designId));

            const design = Array.isArray(designRows) && designRows.length > 0 ? designRows[0] : null;

            if (design) {
              const snapshotPayload = JSON.stringify({
                designId: design.id,
                name: design.name,
                frontCanvasJson: design.frontCanvasJson,
                backCanvasJson: design.backCanvasJson,
                capturedAt: new Date().toISOString(),
              });

              await tx.insert(schema.orderItems).values({
                id: crypto.randomUUID(),
                orderId,
                productId: design.productId || 'prod_classic_pvc',
                productName: data.productName || 'Customized Physical NFC Card',
                variantName: data.variantName || 'Matte Finish',
                unitPrice: data.unitPrice || 1499,
                quantity: data.quantity || 1,
                total: (data.unitPrice || 1499) * (data.quantity || 1),
                designSnapshotJson: snapshotPayload,
                designPreviewUrl: design.previewUrl,
                backPreviewUrl: design.backPreviewUrl,
              });
            }
          } catch (itemErr) {
            console.warn('[OrdersService] Could not freeze orderItem design snapshot:', itemErr);
          }
        }

        // 3. Clean customer cart items if checkout from cart
        try {
          await tx.delete(schema.cartItems).where(eq(schema.cartItems.customerId, actor.userId));
        } catch (e) { }

        return newOrder;
      });

      return order;
    }
}
