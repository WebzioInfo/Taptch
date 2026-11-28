import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ServiceUnavailableException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { buildCardUrl, serializePurchasedCardForUser } from '../cards/card-serializer';
import * as schema from '../../database/schema';
import { eq, and, desc, asc, or, sql } from 'drizzle-orm';
import type { ActorContext } from '../../common/types';
import * as crypto from 'crypto';

export interface CreateOrderDto {
  designId?: string;
  designSnapshot?: any;
  productId?: string;
  variantId?: string;
  quantity?: number;
  cardMaterial?: 'pvc' | 'metal' | 'wood' | 'matte';
  designTier?: 'standard' | 'premium';
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

        // 3. Fetch latest payment record & purchased card allocations
        const [paymentRecords, purchasedCards] = await Promise.all([
          tx
            .select()
            .from(schema.payments)
            .where(eq(schema.payments.orderId, ord.id))
            .orderBy(desc(schema.payments.createdAt))
            .limit(1),
          tx
            .select()
            .from(schema.purchasedCards)
            .where(eq(schema.purchasedCards.orderId, ord.id))
            .orderBy(asc(schema.purchasedCards.unitIndex)),
        ]);

        enrichedOrders.push({
          ...ord,
          items,
          attachedProfile,
          payment: paymentRecords[0] || null,
          purchasedCards: purchasedCards.map((pc: any) =>
            serializePurchasedCardForUser(pc, {
              order: { id: ord.id, orderNumber: ord.orderNumber },
              permanentNfcUrl: pc.nfcUrl || null,
            }),
          ),
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

      // Fetch payment records & purchased card allocations
      const [paymentRecords, purchasedCards] = await Promise.all([
        tx
          .select()
          .from(schema.payments)
          .where(eq(schema.payments.orderId, order.id))
          .orderBy(desc(schema.payments.createdAt)),
        tx
          .select()
          .from(schema.purchasedCards)
          .where(eq(schema.purchasedCards.orderId, order.id))
          .orderBy(asc(schema.purchasedCards.unitIndex)),
      ]);

      // Attach profile summary for each purchased card if linked
      const enrichedPurchasedCards = [];
      for (const pc of purchasedCards) {
        let linkedProfile = null;
        if (pc.profileId) {
          const [prof] = await tx
            .select({
              id: schema.profiles.id,
              displayName: schema.profiles.displayName,
              slug: schema.profiles.slug,
              profileType: schema.profiles.profileType,
              status: schema.profiles.status,
              templateId: schema.profiles.templateId,
            })
            .from(schema.profiles)
            .where(eq(schema.profiles.id, pc.profileId))
            .limit(1);
          linkedProfile = prof || null;
        }
        enrichedPurchasedCards.push(
          serializePurchasedCardForUser(pc, {
            order: { id: order.id, orderNumber: order.orderNumber },
            profile: linkedProfile,
            permanentNfcUrl: pc.nfcUrl || null,
          }),
        );
      }

      return {
        ...order,
        items,
        attachedProfile,
        statusHistory,
        payment: paymentRecords[0] || null,
        allPayments: paymentRecords,
        purchasedCards: enrichedPurchasedCards,
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

      // 2. Physical Card Order is strictly decoupled from Digital Profile Setup
      const attachedProfileId: string | null = null;
      const profileAssistanceStatus = 'NOT_REQUIRED';

      // 3. Resolve Product & Pricing on Backend (Never trust client-side prices)
      const productId = data.productId || 'prod_pvc_black';
      let product: any = null;
      let matchedVariant: any = null;
      try {
        const [p] = await tx
          .select()
          .from(schema.cardProducts)
          .where(eq(schema.cardProducts.id, productId))
          .limit(1);
        product = p;
      } catch (e) { }

      if (data.productId && !product) {
        const { SEEDED_CARD_PRODUCTS } = await import('../products/products.service');
        const seededMatch = SEEDED_CARD_PRODUCTS.find((p) => p.id === data.productId || p.slug === data.productId);
        if (seededMatch) {
          product = seededMatch;
        } else {
          throw new BadRequestException(`Selected NFC card product "${data.productId}" was not found.`);
        }
      }

      if (product && product.isActive === false) {
        throw new BadRequestException('The selected NFC card product is currently unavailable.');
      }

      if (product && data.variantId) {
        try {
          const [v] = await tx
            .select()
            .from(schema.cardProductVariants)
            .where(
              and(
                eq(schema.cardProductVariants.id, data.variantId),
                eq(schema.cardProductVariants.productId, product.id),
              ),
            )
            .limit(1);
          if (!v) {
            throw new BadRequestException('Selected variant does not belong to the chosen product.');
          }
          matchedVariant = v;
        } catch (err) {
          if (err instanceof BadRequestException) throw err;
        }
      }

      // 3. Resolve Product & Pricing on Backend (Variant/Product price -> Material Rate fallback)
      const materialRates: Record<string, number> = {
        pvc: 1099,
        matte: 1099,
        wood: 1499,
        metal: 1999,
      };
      const defaultDesignRates: Record<string, number> = {
        pvc: 400,
        matte: 400,
        wood: 500,
        metal: 500,
      };

      const selectedMaterial = data.cardMaterial || 'pvc';
      const materialRate = materialRates[selectedMaterial] ?? 1099;
      const designRate = defaultDesignRates[selectedMaterial] ?? 400;
      const fallbackUnitPrice = materialRate + designRate;
      const unitPrice =
        matchedVariant?.price ??
        product?.discountPrice ??
        product?.basePrice ??
        fallbackUnitPrice;
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
          profileAssistanceNotes: null,
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

      const [insertedItem] = await tx
        .insert(schema.orderItems)
        .values({
          id: crypto.randomUUID(),
          orderId,
          productId,
          productName: product?.name || 'Custom Contactless NFC Card',
          variantName:
            matchedVariant?.name ||
            product?.colorName ||
            (data.cardMaterial === 'metal'
              ? 'Metal NFC Card'
              : data.cardMaterial === 'wood'
                ? 'Wood NFC Card'
                : data.cardMaterial === 'matte'
                  ? 'Matte NFC Card'
                  : 'PVC NFC Card'),
          unitPrice,
          quantity,
          total: subtotal,
          designSnapshotJson: designSnapshotPayload || JSON.stringify({ capturedAt: new Date().toISOString() }),
          designPreviewUrl: designPreviewUrl || matchedVariant?.imageUrl || product?.imageUrl || null,
          backPreviewUrl,
          previewFrontUrl: designPreviewUrl || matchedVariant?.imageUrl || product?.imageUrl || null,
          previewBackUrl: backPreviewUrl,
          profileId: attachedProfileId,
          designId: data.designId || null,
        })
        .returning();

      // 6b. If COD (immediately confirmed), allocate purchased cards idempotently
      if (paymentMethod === 'cod') {
        await this.allocatePurchasedCards(tx, newOrder, insertedItem);
      }

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
        isDuplicate: false,
      };
    });
  }

  private generateCardCode(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let out = '';
    const bytes = crypto.randomBytes(10);
    for (let i = 0; i < 10; i++) {
      out += chars[bytes[i] % chars.length];
    }
    return out;
  }

  private async allocatePurchasedCards(tx: any, order: any, orderItem: any) {
    if (!order || !orderItem) return;
    const qty = Math.max(1, orderItem.quantity || order.quantity || 1);
    const hasProfile = Boolean(orderItem.profileId || order.profileId);
    const resolvedProfileId = orderItem.profileId || order.profileId || null;

    for (let unit = 1; unit <= qty; unit++) {
      let allocated = false;
      const MAX_ATTEMPTS = 5;

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        // Minimum 128 bits of cryptographically secure randomness (32 hex chars)
        const redirectToken = crypto.randomBytes(16).toString('hex');
        const cardCode = this.generateCardCode();

        const [existingPhysical, existingPurchased] = await Promise.all([
          tx
            .select({ id: schema.cards.id })
            .from(schema.cards)
            .where(eq(schema.cards.redirectToken, redirectToken))
            .limit(1),
          tx
            .select({ id: schema.purchasedCards.id })
            .from(schema.purchasedCards)
            .where(
              or(
                eq(schema.purchasedCards.redirectToken, redirectToken),
                eq(schema.purchasedCards.cardCode, cardCode),
              ),
            )
            .limit(1),
        ]);

        if (existingPhysical?.length > 0 || existingPurchased?.length > 0) {
          continue;
        }

        try {
          await tx
            .insert(schema.purchasedCards)
            .values({
              id: crypto.randomUUID(),
              orderId: order.id,
              orderItemId: orderItem.id,
              unitIndex: unit,
              userId: order.userId,
              organizationId: null,
              productId: orderItem.productId,
              productName: orderItem.productName,
              variantName: orderItem.variantName,
              material: order.material || 'pvc',
              colorName: orderItem.variantName || null,
              designId: orderItem.designId || null,
              previewFrontUrl: orderItem.previewFrontUrl || orderItem.designPreviewUrl || null,
              previewBackUrl: orderItem.previewBackUrl || orderItem.backPreviewUrl || null,
              cardCode,
              urlId: cardCode,
              redirectToken,
              nfcUrl: buildCardUrl(cardCode),
              destinationType: hasProfile ? 'profile' : null,
              customDestinationUrl: null,
              profileId: resolvedProfileId,
              status: hasProfile ? 'ASSIGNED' : 'UNASSIGNED',
              profileAssignmentStatus: hasProfile ? 'PROFILE_ATTACHED' : 'AWAITING_PROFILE',
            });
          allocated = true;
          break;
        } catch (err: any) {
          // Retry only on unique constraint violation (23505)
          if (err?.code === '23505') {
            continue;
          }
          throw err;
        }
      }

      if (!allocated) {
        throw new InternalServerErrorException(
          `Failed to allocate a unique NFC token for unit ${unit} of order ${order.id}.`,
        );
      }
    }
  }

  /**
   * Verify online payment (Razorpay HMAC signature verification & dev-only UPI simulator)
   */
  async verifyPayment(orderId: string, actor: ActorContext, data: VerifyPaymentDto) {
    return this.dbService.withActor(actor, async (tx) => {
      // Acquire row-level lock (SELECT ... FOR UPDATE) when supported by the DB driver
      const orderQuery: any = tx
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, orderId));
      const lockedRows =
        typeof orderQuery.for === 'function'
          ? await orderQuery.for('update').limit(1)
          : await orderQuery.limit(1);
      const [order] = lockedRows;

      if (!order) {
        throw new NotFoundException(`Order ${orderId} not found.`);
      }

      if (order.userId !== actor.userId && actor.role !== 'admin' && actor.role !== 'super_admin') {
        throw new ForbiddenException('Unauthorized to verify this order.');
      }

      if (order.orderStatus === 'CANCELLED') {
        throw new BadRequestException('Cannot verify payment for a cancelled order.');
      }

      if (order.paymentStatus === 'REFUNDED') {
        throw new BadRequestException('Cannot verify payment for a refunded order.');
      }

      // Idempotency guard: if already PAID, return without duplicating payments or history
      if (order.paymentStatus === 'PAID') {
        return order;
      }

      if (!order.totalAmount || Number(order.totalAmount) <= 0) {
        throw new BadRequestException('Order total amount is invalid for payment verification.');
      }

      const isRazorpay = data.paymentMethod === 'razorpay';
      const isUpi = data.paymentMethod === 'upi';

      if (isRazorpay) {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
          throw new BadRequestException(
            'Razorpay order ID, payment ID, and signature are required.',
          );
        }

        const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
        if (!keySecret) {
          throw new ServiceUnavailableException(
            'Razorpay payment verification is not configured on the server.',
          );
        }

        const expectedSig = crypto
          .createHmac('sha256', keySecret)
          .update(`${razorpay_order_id}|${razorpay_payment_id}`)
          .digest('hex');

        const expectedBuf = Buffer.from(expectedSig, 'utf8');
        const actualBuf = Buffer.from(razorpay_signature, 'utf8');
        if (
          expectedBuf.length !== actualBuf.length ||
          !crypto.timingSafeEqual(expectedBuf, actualBuf)
        ) {
          throw new BadRequestException('Invalid Razorpay payment signature.');
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

        // Update existing Payment Record (prevent duplicate payment rows)
        await tx
          .update(schema.payments)
          .set({
            status: 'PAID',
            gatewayOrderId: razorpay_order_id,
            gatewayPaymentId: razorpay_payment_id,
            gatewaySignature: razorpay_signature,
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

        const items = await tx
          .select()
          .from(schema.orderItems)
          .where(eq(schema.orderItems.orderId, orderId));
        if (Array.isArray(items)) {
          for (const it of items) {
            await this.allocatePurchasedCards(tx, updatedOrder, it);
          }
        }

        return updatedOrder;
      }

      if (isUpi) {
        const isDevSimulatorAllowed =
          process.env.NODE_ENV !== 'production' &&
          process.env.ALLOW_UPI_TEST_SIMULATOR === 'true';

        if (!isDevSimulatorAllowed) {
          throw new BadRequestException(
            'UPI test payment verification is disabled in this environment.',
          );
        }

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

          const items = await tx
            .select()
            .from(schema.orderItems)
            .where(eq(schema.orderItems.orderId, orderId));
          if (Array.isArray(items)) {
            for (const it of items) {
              await this.allocatePurchasedCards(tx, updatedOrder, it);
            }
          }

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

      if (order.orderStatus === 'CANCELLED') {
        throw new BadRequestException('Order is already cancelled.');
      }

      if (
        order.orderStatus === 'CARD_PRODUCTION' ||
        order.orderStatus === 'CARD_READY' ||
        order.orderStatus === 'DISPATCHED' ||
        order.orderStatus === 'IN_TRANSIT' ||
        order.orderStatus === 'OUT_FOR_DELIVERY' ||
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

      // Safely revoke pre-fulfillment purchased cards without deleting historical records
      await tx
        .update(schema.purchasedCards)
        .set({
          profileId: null,
          destinationType: null,
          profileAssignmentStatus: 'REVOKED',
          updatedAt: new Date(),
        })
        .where(eq(schema.purchasedCards.orderId, orderId));

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

  /**
   * Backend-controlled payment simulator for development/testing.
   * Disabled in production unless ALLOW_PAYMENT_SIMULATOR === 'true'.
   */
  async simulatePayment(
    orderId: string,
    actor: ActorContext,
    outcome: 'success' | 'failed' | 'cancelled' | 'pending',
  ) {
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.ALLOW_PAYMENT_SIMULATOR !== 'true'
    ) {
      throw new ForbiddenException('Payment simulator is disabled in production.');
    }

    const ALLOWED_OUTCOMES = new Set(['success', 'failed', 'cancelled', 'pending']);
    if (!ALLOWED_OUTCOMES.has(outcome)) {
      throw new BadRequestException(`Invalid simulation outcome: ${outcome}`);
    }

    return this.dbService.withActor(actor, async (tx) => {
      const orderQuery: any = tx
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, orderId));
      const [order] =
        typeof orderQuery.for === 'function'
          ? await orderQuery.for('update').limit(1)
          : await orderQuery.limit(1);

      if (!order) {
        throw new NotFoundException(`Order ${orderId} not found.`);
      }
      if (order.userId !== actor.userId && actor.role !== 'admin' && actor.role !== 'super_admin') {
        throw new ForbiddenException('Unauthorized to simulate payment for this order.');
      }
      if (order.orderStatus === 'CANCELLED') {
        throw new BadRequestException('Cannot simulate payment for a cancelled order.');
      }
      if (order.paymentStatus === 'REFUNDED') {
        throw new BadRequestException('Cannot simulate payment for a refunded order.');
      }
      if (order.paymentStatus === 'PAID') {
        return {
          simulated: true,
          testMode: true,
          outcome: 'success',
          order,
        };
      }

      const simPaymentId = `SIM_TEST_${crypto.randomUUID().slice(0, 12)}`;
      const simOrderId = `SIM_ORD_${crypto.randomUUID().slice(0, 12)}`;

      const nextPaymentStatus =
        outcome === 'success'
          ? 'PAID'
          : outcome === 'failed'
            ? 'FAILED'
            : 'PENDING';

      const nextOrderStatus =
        outcome === 'success'
          ? 'ORDER_CONFIRMED'
          : outcome === 'cancelled'
            ? 'CANCELLED'
            : 'PAYMENT_PENDING';

      const [updatedOrder] = await tx
        .update(schema.orders)
        .set({
          paymentStatus: nextPaymentStatus as any,
          orderStatus: nextOrderStatus,
          paymentReference: simPaymentId,
          updatedAt: new Date(),
        })
        .where(eq(schema.orders.id, orderId))
        .returning();

      await tx
        .update(schema.payments)
        .set({
          status: nextPaymentStatus as any,
          gatewayOrderId: simOrderId,
          gatewayPaymentId: simPaymentId,
          gatewaySignature: 'SIMULATED_TEST_SIGNATURE',
          updatedAt: new Date(),
        })
        .where(eq(schema.payments.orderId, orderId));

      await tx.insert(schema.orderStatusHistory).values({
        id: crypto.randomUUID(),
        orderId,
        status: nextOrderStatus,
        title: `[TEST/SIMULATED] Payment ${outcome.toUpperCase()}`,
        description: `Simulated payment outcome=${outcome} (Ref: ${simPaymentId}). Not a real financial transaction.`,
        updatedBy: actor.userId,
      });

      return {
        simulated: true,
        testMode: true,
        outcome,
        paymentReference: simPaymentId,
        order: updatedOrder,
      };
    });
  }
}
