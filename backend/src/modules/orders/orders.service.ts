import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import type { ActorContext } from '../../common/types';
import * as crypto from 'crypto';

export interface CreateOrderDto {
  designId?: string;
  designSnapshot?: any;
  productId?: string;
  variantId?: string;
  quantity?: number;
  cardMaterial?: 'pvc' | 'metal' | 'wood';
  profileId?: string | null;
  requestProfileAssistance?: boolean;
  profileAssistanceNotes?: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    email?: string;
    whatsappNumber?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    deliveryInstructions?: string;
  };
  paymentMethod?: 'razorpay' | 'upi' | 'cod' | 'offline';
  notes?: string;
  idempotencyKey?: string;
}

export interface VerifyPaymentDto {
  paymentMethod: 'razorpay' | 'upi' | 'cod' | 'offline';
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  upiRef?: string;
  simulationStatus?: 'SUCCESS' | 'FAILED' | 'CANCELLED';
}

@Injectable()
export class OrdersService {
  constructor(private dbService: DatabaseService) { }

  /**
   * List all orders placed by the authenticated actor
   */
  async findAllForActor(actor: ActorContext) {
    return this.dbService.withActor(actor, async (tx) => {
      const userOrders = await tx
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.userId, actor.userId))
        .orderBy(desc(schema.orders.createdAt));

      const enrichedOrders = [];
      for (const ord of userOrders) {
        // 1. Fetch order items (including frozen design snapshot)
        const items = await tx
          .select()
          .from(schema.orderItems)
          .where(eq(schema.orderItems.orderId, ord.id));

        // 2. Fetch attached profile if any
        let attachedProfile = null;
        if (ord.profileId) {
          try {
            const [prof] = await tx
              .select({
                id: schema.profiles.id,
                name: schema.profiles.displayName,
                slug: schema.profiles.slug,
                profileType: schema.profiles.profileType,
                avatarUrl: schema.profiles.avatarUrl,
                status: schema.profiles.status,
              })
              .from(schema.profiles)
              .where(eq(schema.profiles.id, ord.profileId));
            attachedProfile = prof || null;
          } catch (e) {
            // ignore
          }
        }

        // 3. Fetch latest payment record
        const paymentRecords = await tx
          .select()
          .from(schema.payments)
          .where(eq(schema.payments.orderId, ord.id))
          .orderBy(desc(schema.payments.createdAt))
          .limit(1);

        enrichedOrders.push({
          ...ord,
          items,
          attachedProfile,
          payment: paymentRecords[0] || null,
        });
      }

      return enrichedOrders;
    });
  }

  /**
   * Get single order by ID with items, design snapshot, attached profile, and tracking timeline
   */
  async findOneForActor(orderId: string, actor: ActorContext) {
    return this.dbService.withActor(actor, async (tx) => {
      const [order] = await tx
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, orderId))
        .limit(1);

      if (!order) {
        throw new NotFoundException(`Order ${orderId} not found.`);
      }

      // Authorization: must be order owner or admin/support
      const isOwner = order.userId === actor.userId;
      const isAdminOrSupport = actor.role === 'admin' || actor.role === 'super_admin' || actor.role === 'support_admin';

      if (!isOwner && !isAdminOrSupport) {
        throw new ForbiddenException('You do not have permission to view this order.');
      }

      // Fetch items
      const items = await tx
        .select()
        .from(schema.orderItems)
        .where(eq(schema.orderItems.orderId, order.id));

      // Fetch attached profile
      let attachedProfile = null;
      if (order.profileId) {
        try {
          const [prof] = await tx
            .select({
              id: schema.profiles.id,
              name: schema.profiles.displayName,
              slug: schema.profiles.slug,
              profileType: schema.profiles.profileType,
              avatarUrl: schema.profiles.avatarUrl,
              status: schema.profiles.status,
            })
            .from(schema.profiles)
            .where(eq(schema.profiles.id, order.profileId));
          attachedProfile = prof || null;
        } catch (e) { }
      }

      // Fetch status timeline
      const statusHistory = await tx
        .select()
        .from(schema.orderStatusHistory)
        .where(eq(schema.orderStatusHistory.orderId, order.id))
        .orderBy(asc(schema.orderStatusHistory.createdAt));

      // Fetch payment records
      const paymentRecords = await tx
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.orderId, order.id))
        .orderBy(desc(schema.payments.createdAt));

      return {
        ...order,
        items,
        attachedProfile,
        statusHistory,
        payment: paymentRecords[0] || null,
        allPayments: paymentRecords,
      };
    });
  }

  /**
   * Create a new NFC Card Order with backend pricing, immutable design snapshot, and idempotency protection
   */
  async createOrder(actor: ActorContext, data: CreateOrderDto) {
    if (!data.shippingAddress) {
      throw new BadRequestException('Shipping address is required.');
    }
    if (!data.shippingAddress.fullName || !data.shippingAddress.phone || !data.shippingAddress.addressLine1) {
      throw new BadRequestException('Recipient name, phone number, and address are required.');
    }

    return this.dbService.withActor(actor, async (tx) => {
      // 1. Idempotency Check: prevent duplicate orders on double click
      if (data.idempotencyKey) {
        const [existingOrder] = await tx
          .select()
          .from(schema.orders)
          .where(
            and(
              eq(schema.orders.userId, actor.userId),
              eq(schema.orders.idempotencyKey, data.idempotencyKey)
            )
          )
          .limit(1);

        if (existingOrder) {
          const items = await tx
            .select()
            .from(schema.orderItems)
            .where(eq(schema.orderItems.orderId, existingOrder.id));
          return { ...existingOrder, items, isDuplicate: true };
        }
      }

      // 2. Profile Validation: If profile attached, verify ownership
      let attachedProfileId: string | null = null;
      let profileAssistanceStatus = data.requestProfileAssistance ? 'REQUESTED' : 'NOT_REQUIRED';

      if (data.profileId) {
        const [profile] = await tx
          .select()
          .from(schema.profiles)
          .where(
            and(
              eq(schema.profiles.id, data.profileId),
              eq(schema.profiles.ownerId, actor.userId)
            )
          )
          .limit(1);

        if (!profile) {
          throw new BadRequestException('The selected digital profile does not exist or belongs to another user.');
        }
        attachedProfileId = profile.id;
        profileAssistanceStatus = 'PROFILE_SELECTED';
      }

      // 3. Resolve Product & Pricing on Backend (Never trust client-side prices)
      const productId = data.productId || 'prod_matte_pvc_01';
      let product: any = null;
      try {
        const [p] = await tx
          .select()
          .from(schema.cardProducts)
          .where(eq(schema.cardProducts.id, productId))
          .limit(1);
        product = p;
      } catch (e) { }

      let unitPrice = product?.discountPrice || product?.basePrice;
      if (!unitPrice) {
        if (data.cardMaterial === 'metal') unitPrice = 2499;
        else if (data.cardMaterial === 'wood') unitPrice = 1999;
        else unitPrice = 1499;
      }
      const quantity = Math.max(1, data.quantity || 1);
      const subtotal = unitPrice * quantity;
      const shippingCost = subtotal >= 2000 ? 0 : 99; // Free shipping above ₹2,000
      const taxAmount = Math.round(subtotal * 0.18); // 18% GST calculation
      const totalAmount = subtotal + shippingCost + taxAmount;

      // 4. Generate Unique Order ID and User-Facing Order Number
      const orderId = crypto.randomUUID();
      const orderYear = new Date().getFullYear();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `TAP-${orderYear}-${randomSuffix}`;

      const paymentMethod = data.paymentMethod || 'razorpay';
      let orderStatus = 'ORDER_PLACED';
      let paymentStatus = 'PENDING';

      if (paymentMethod === 'cod') {
        orderStatus = 'ORDER_CONFIRMED';
        paymentStatus = 'COD_PENDING';
      } else if (paymentMethod === 'razorpay' || paymentMethod === 'upi') {
        orderStatus = 'PAYMENT_PENDING';
        paymentStatus = 'PENDING';
      }

      // 5. Insert Primary Order Record
      const [newOrder] = await tx
        .insert(schema.orders)
        .values({
          id: orderId,
          orderNumber,
          userId: actor.userId,
          profileId: attachedProfileId,
          material: data.cardMaterial || 'pvc',
          quantity,
          shippingAddress: {
            recipientName: data.shippingAddress.fullName,
            phone: data.shippingAddress.phone,
            email: data.shippingAddress.email || '',
            whatsappNumber: data.shippingAddress.whatsappNumber || data.shippingAddress.phone,
            street: data.shippingAddress.addressLine1,
            addressLine2: data.shippingAddress.addressLine2 || '',
            city: data.shippingAddress.city,
            state: data.shippingAddress.state,
            postalCode: data.shippingAddress.postalCode,
            country: data.shippingAddress.country || 'India',
            deliveryInstructions: data.shippingAddress.deliveryInstructions || '',
          },
          orderStatus,
          paymentStatus,
          paymentMethod,
          profileAssistanceStatus,
          profileAssistanceNotes: data.profileAssistanceNotes || null,
          subtotal,
          shippingCost,
          taxAmount,
          totalAmount,
          currency: 'INR',
          notes: data.notes || null,
          idempotencyKey: data.idempotencyKey || null,
        })
        .returning();

      // 6. Freeze Immutable Manufacturing Snapshot in Order Items
      let designSnapshotPayload = '';
      let designPreviewUrl = '/branding/cards/default-card-preview.png';
      let backPreviewUrl = '';

      if (data.designId) {
        try {
          const [design] = await tx
            .select()
            .from(schema.cardDesigns)
            .where(
              and(
                eq(schema.cardDesigns.id, data.designId),
                eq(schema.cardDesigns.customerId, actor.userId)
              )
            )
            .limit(1);

          if (design) {
            designSnapshotPayload = JSON.stringify({
              designId: design.id,
              name: design.name,
              cardType: data.cardMaterial || 'pvc',
              productId: design.productId,
              templateId: design.templateId,
              variantId: design.variantId,
              frontCanvasJson: design.frontCanvasJson,
              backCanvasJson: design.backCanvasJson,
              previewUrl: design.previewUrl,
              backPreviewUrl: design.backPreviewUrl,
              capturedAt: new Date().toISOString(),
              version: '1.0-immutable',
            });
            designPreviewUrl = (design as any).previewFrontUrl || design.previewUrl || designPreviewUrl;
            backPreviewUrl = (design as any).previewBackUrl || design.backPreviewUrl || '';
          }
        } catch (err) {
          console.warn('[OrdersService] Could not resolve design from database, using fallback:', err);
        }
      } else if (data.designSnapshot) {
        designSnapshotPayload = JSON.stringify({
          ...data.designSnapshot,
          capturedAt: new Date().toISOString(),
          version: '1.0-immutable-direct',
        });
        designPreviewUrl = (data.designSnapshot as any).previewFrontUrl || data.designSnapshot.previewUrl || designPreviewUrl;
        backPreviewUrl = (data.designSnapshot as any).previewBackUrl || data.designSnapshot.backPreviewUrl || '';
      }

      await tx.insert(schema.orderItems).values({
        id: crypto.randomUUID(),
        orderId,
        productId,
        productName: product?.name || 'Custom Contactless NFC Card',
        variantName: data.cardMaterial === 'metal' ? 'Matte Titanium Metal' : 'Matte Obsidian PVC',
        unitPrice,
        quantity,
        total: subtotal,
        designSnapshotJson: designSnapshotPayload || JSON.stringify({ capturedAt: new Date().toISOString() }),
        designPreviewUrl,
        backPreviewUrl,
        previewFrontUrl: designPreviewUrl,
        previewBackUrl: backPreviewUrl,
      });

      // 7. Initial Status History Timeline Event
      const initialHistoryTitle =
        paymentMethod === 'cod'
          ? 'Order Placed (Cash on Delivery)'
          : paymentMethod === 'upi'
            ? 'Order Placed (Awaiting UPI Payment)'
            : 'Order Placed (Awaiting Razorpay Payment)';

      const initialHistoryDesc =
        paymentMethod === 'cod'
          ? `Order #${orderNumber} confirmed. Total amount ₹${totalAmount} to be collected upon delivery.`
          : `Order #${orderNumber} created. Awaiting payment authorization of ₹${totalAmount}.`;

      await tx.insert(schema.orderStatusHistory).values({
        id: crypto.randomUUID(),
        orderId,
        status: orderStatus,
        title: initialHistoryTitle,
        description: initialHistoryDesc,
        updatedBy: actor.userId,
      });

      // 8. Payment Record Creation
      let gatewayOrderId = '';
      if (paymentMethod === 'razorpay') {
        // Razorpay test order generation
        gatewayOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
      } else if (paymentMethod === 'upi') {
        gatewayOrderId = `upi_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      }

      await tx.insert(schema.payments).values({
        id: crypto.randomUUID(),
        orderId,
        userId: actor.userId,
        paymentMethod,
        amount: totalAmount,
        currency: 'INR',
        status: paymentStatus,
        gatewayOrderId: gatewayOrderId || null,
        metadata: {
          subtotal,
          shippingCost,
          taxAmount,
          itemQuantity: quantity,
        },
      });

      // 9. Clean Cart Items
      try {
        await tx.delete(schema.cartItems).where(eq(schema.cartItems.customerId, actor.userId));
      } catch (e) { }

      return {
        ...newOrder,
        gatewayOrderId,
        currency: 'INR',
        amount: totalAmount,
      };
    });
  }

  /**
   * Verify online payment (Razorpay HMAC signature verification & UPI test simulation)
   */
  async verifyPayment(orderId: string, actor: ActorContext, data: VerifyPaymentDto) {
    return this.dbService.withActor(actor, async (tx) => {
      const [order] = await tx
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, orderId))
        .limit(1);

      if (!order) {
        throw new NotFoundException(`Order ${orderId} not found.`);
      }

      if (order.userId !== actor.userId && actor.role !== 'admin' && actor.role !== 'super_admin') {
        throw new ForbiddenException('Unauthorized to verify this order.');
      }

      const isRazorpay = data.paymentMethod === 'razorpay';
      const isUpi = data.paymentMethod === 'upi';

      if (isRazorpay) {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;

        if (!razorpay_payment_id) {
          throw new BadRequestException('Razorpay payment ID is required.');
        }

        // Test mode & production HMAC verification
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (keySecret && razorpay_order_id && razorpay_signature) {
          const expectedSig = crypto
            .createHmac('sha256', keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

          if (expectedSig !== razorpay_signature) {
            throw new BadRequestException('Invalid Razorpay payment signature.');
          }
        }

        // Update Order to Confirmed and Paid
        const [updatedOrder] = await tx
          .update(schema.orders)
          .set({
            paymentStatus: 'PAID',
            orderStatus: 'ORDER_CONFIRMED',
            paymentReference: razorpay_payment_id,
            updatedAt: new Date(),
          })
          .where(eq(schema.orders.id, orderId))
          .returning();

        // Update Payment Record
        await tx
          .update(schema.payments)
          .set({
            status: 'PAID',
            gatewayPaymentId: razorpay_payment_id,
            gatewaySignature: razorpay_signature || null,
            updatedAt: new Date(),
          })
          .where(eq(schema.payments.orderId, orderId));

        // Add to Timeline History
        await tx.insert(schema.orderStatusHistory).values({
          id: crypto.randomUUID(),
          orderId,
          status: 'ORDER_CONFIRMED',
          title: 'Payment Confirmed (Razorpay)',
          description: `Payment of ₹${order.totalAmount} verified via Razorpay ID: ${razorpay_payment_id}. Order sent to production preparation.`,
          updatedBy: 'system:razorpay',
        });

        return updatedOrder;
      }

      if (isUpi) {
        const isSuccess = data.simulationStatus === 'SUCCESS';
        const upiRef = data.upiRef || `UPI-${Date.now()}`;

        if (isSuccess) {
          const [updatedOrder] = await tx
            .update(schema.orders)
            .set({
              paymentStatus: 'PAID',
              orderStatus: 'ORDER_CONFIRMED',
              paymentReference: upiRef,
              updatedAt: new Date(),
            })
            .where(eq(schema.orders.id, orderId))
            .returning();

          await tx
            .update(schema.payments)
            .set({
              status: 'PAID',
              gatewayPaymentId: upiRef,
              updatedAt: new Date(),
            })
            .where(eq(schema.payments.orderId, orderId));

          await tx.insert(schema.orderStatusHistory).values({
            id: crypto.randomUUID(),
            orderId,
            status: 'ORDER_CONFIRMED',
            title: 'Payment Confirmed (UPI Simulator)',
            description: `UPI Test Payment ₹${order.totalAmount} approved. Reference: ${upiRef}.`,
            updatedBy: 'system:upi_simulator',
          });

          return updatedOrder;
        } else {
          // Failed or Cancelled Simulation
          const [updatedOrder] = await tx
            .update(schema.orders)
            .set({
              paymentStatus: 'FAILED',
              orderStatus: 'PAYMENT_PENDING',
              updatedAt: new Date(),
            })
            .where(eq(schema.orders.id, orderId))
            .returning();

          await tx
            .update(schema.payments)
            .set({
              status: 'FAILED',
              errorMessage: `UPI simulation ended with status ${data.simulationStatus}`,
              updatedAt: new Date(),
            })
            .where(eq(schema.payments.orderId, orderId));

          await tx.insert(schema.orderStatusHistory).values({
            id: crypto.randomUUID(),
            orderId,
            status: 'PAYMENT_PENDING',
            title: 'Payment Failed (UPI)',
            description: `Payment authorization attempt failed or cancelled. Customer may retry checkout.`,
            updatedBy: 'system:upi_simulator',
          });

          return updatedOrder;
        }
      }

      throw new BadRequestException('Unsupported payment method for verification.');
    });
  }

  /**
   * Cancel an order if it is still in pre-production stage
   */
  async cancelOrder(orderId: string, actor: ActorContext, reason?: string) {
    return this.dbService.withActor(actor, async (tx) => {
      const [order] = await tx
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, orderId))
        .limit(1);

      if (!order) {
        throw new NotFoundException(`Order ${orderId} not found.`);
      }

      if (order.userId !== actor.userId && actor.role !== 'admin' && actor.role !== 'super_admin') {
        throw new ForbiddenException('Unauthorized to cancel this order.');
      }

      if (
        order.orderStatus === 'CARD_PRODUCTION' ||
        order.orderStatus === 'DISPATCHED' ||
        order.orderStatus === 'DELIVERED'
      ) {
        throw new BadRequestException('Order cannot be cancelled once manufacturing has commenced.');
      }

      const [cancelledOrder] = await tx
        .update(schema.orders)
        .set({
          orderStatus: 'CANCELLED',
          updatedAt: new Date(),
        })
        .where(eq(schema.orders.id, orderId))
        .returning();

      await tx.insert(schema.orderStatusHistory).values({
        id: crypto.randomUUID(),
        orderId,
        status: 'CANCELLED',
        title: 'Order Cancelled',
        description: reason || 'Order was cancelled by the customer.',
        updatedBy: actor.userId,
      });

      return cancelledOrder;
    });
  }
}
