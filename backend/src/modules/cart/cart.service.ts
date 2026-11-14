import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { ActorContext } from '../../common/types';
import * as crypto from 'crypto';

@Injectable()
export class CartService {
  constructor(private dbService: DatabaseService) { }

  async getCart(actor: ActorContext) {
    return this.dbService.withActor(actor, async (tx) => {
      const rawItems = await tx
        .select()
        .from(schema.cartItems)
        .where(eq(schema.cartItems.customerId, actor.userId))
        .orderBy(desc(schema.cartItems.createdAt));

      const items = Array.isArray(rawItems) ? rawItems : [];
      let subtotal = 0;
      const enrichedItems = [];

      for (const item of items) {
        // Fetch product
        let product: any = null;
        try {
          const [p] = await tx
            .select()
            .from(schema.cardProducts)
            .where(eq(schema.cardProducts.id, item.productId));
          product = p;
        } catch (e) { }

        // Fetch design
        let design: any = null;
        if (item.designId) {
          try {
            const [d] = await tx
              .select()
              .from(schema.cardDesigns)
              .where(eq(schema.cardDesigns.id, item.designId));
            design = d;
          } catch (e) { }
        }

        const unitPrice = product?.basePrice || 1499;
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;

        enrichedItems.push({
          ...item,
          product: product || { name: 'Customized Physical NFC Card', basePrice: unitPrice },
          design: design || { name: 'Untitled Design', previewUrl: '/branding/cards/default-card-preview.png' },
          unitPrice,
          lineTotal,
        });
      }

      const shippingCost = subtotal > 2000 ? 0 : 99;
      const total = subtotal + shippingCost;

      return {
        items: enrichedItems,
        itemCount: items.length,
        subtotal,
        shippingCost,
        total,
      };
    });
  }

  async addItem(actor: ActorContext, data: any) {
    const productId = data.productId || 'prod_classic_pvc';
    const variantId = data.variantId || null;
    const designId = data.designId || null;
    const quantity = Math.max(1, parseInt(data.quantity) || 1);

    return this.dbService.withActor(actor, async (tx) => {
      // Check if identical item already in cart
      const conditions = [
        eq(schema.cartItems.customerId, actor.userId),
        eq(schema.cartItems.productId, productId),
      ];
      if (designId) {
        conditions.push(eq(schema.cartItems.designId, designId));
      }

      const [existing] = await tx
        .select()
        .from(schema.cartItems)
        .where(and(...conditions))
        .limit(1);

      if (existing) {
        const [updated] = await tx
          .update(schema.cartItems)
          .set({
            quantity: existing.quantity + quantity,
            updatedAt: new Date(),
          })
          .where(eq(schema.cartItems.id, existing.id))
          .returning();

        return updated;
      }

      const id = crypto.randomUUID();
      const [created] = await tx
        .insert(schema.cartItems)
        .values({
          id,
          customerId: actor.userId,
          productId,
          variantId,
          designId,
          quantity,
        })
        .returning();

      return created;
    });
  }

  async removeItem(actor: ActorContext, id: string) {
    return this.dbService.withActor(actor, async (tx) => {
      await tx
        .delete(schema.cartItems)
        .where(and(eq(schema.cartItems.id, id), eq(schema.cartItems.customerId, actor.userId)));

      return { success: true, message: 'Item removed from cart' };
    });
  }

  async clearCart(actor: ActorContext) {
    return this.dbService.withActor(actor, async (tx) => {
      await tx
        .delete(schema.cartItems)
        .where(eq(schema.cartItems.customerId, actor.userId));

      return { success: true };
    });
  }
}