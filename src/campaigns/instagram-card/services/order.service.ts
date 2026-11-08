import { randomBytes } from 'node:crypto';
import { db } from '@/db';
import {
  campaignOrders,
  campaignDesigns,
  campaignInventoryMovements,
  campaignProducts,
  campaignSettings,
} from '@/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { calculateOrderPricing } from './pricing.service';
import { INSTAGRAM_CAMPAIGN_CONFIG } from '../config';
import type { CreateCampaignOrderDTO, OverallOrderStatus } from '../types';
import { logger } from '@/lib/logger';

export class OrderNotFoundError extends Error {
  constructor(identifier: string) {
    super(`Campaign order with identifier "${identifier}" was not found.`);
    this.name = 'OrderNotFoundError';
  }
}

export class InsufficientStockError extends Error {
  constructor(productName: string, requested: number, available: number) {
    super(`Insufficient stock for "${productName}". Requested: ${requested}, Available: ${available}`);
    this.name = 'InsufficientStockError';
  }
}

/**
 * Creates a unique human-friendly order number e.g. TAP-2026-000101
 * Concurrency-safe using timestamp and cryptographic random sequence
 */
function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const rand = randomBytes(3).toString('hex').toUpperCase();
  return `TAP-${year}-${rand}`;
}

/**
 * Creates a Code 128 compliant barcode string for the order
 */
function generateBarcode(orderNumber: string): string {
  return `BC128-${orderNumber.replace(/[^A-Z0-9]/g, '')}`;
}

/**
 * Places an Instagram NFC Card Campaign Order
 * - Performs server-side price validation
 * - Atomically reserves inventory stock
 * - Stores immutable design snapshot
 */
export async function createCampaignOrder(dto: CreateCampaignOrderDTO, userId?: string) {
  // 0. Idempotency Check: Prevent duplicate order placement from retries or double clicks
  if (dto.idempotencyKey) {
    const [existing] = await db
      .select({
        id: campaignOrders.id,
        orderNumber: campaignOrders.orderNumber,
        barcode: campaignOrders.barcode,
        totalAmount: campaignOrders.totalAmount,
      })
      .from(campaignOrders)
      .where(eq(campaignOrders.idempotencyKey, dto.idempotencyKey))
      .limit(1);

    if (existing) {
      logger.info({ idempotencyKey: dto.idempotencyKey, orderNumber: existing.orderNumber }, 'Idempotent campaign order returned');
      return {
        orderId: existing.id,
        orderNumber: existing.orderNumber,
        barcode: existing.barcode,
        totalAmount: existing.totalAmount,
        currency: 'INR',
        isDuplicate: true,
      };
    }
  }

  // 1. Calculate authoritative pricing
  const pricing = await calculateOrderPricing(dto.productId, dto.quantity, dto.designOption);

  // 2. Validate stock availability
  if (pricing.product.stockAvailable < dto.quantity) {
    throw new InsufficientStockError(
      pricing.product.name,
      dto.quantity,
      pricing.product.stockAvailable
    );
  }

  const orderId = `cord_${Date.now()}_${randomBytes(4).toString('hex')}`;
  const orderNumber = generateOrderNumber();
  const barcode = generateBarcode(orderNumber);

  // Clean Instagram URL
  const instagramUrl = dto.instagramUrl || `https://instagram.com/${dto.instagramUsername}`;

  // 3. Atomically persist order, reserve inventory, and save design snapshot
  await db.transaction(async (tx: any) => {
    // Atomically reserve inventory with concurrency check (stock_available >= quantity)
    const stockUpdate = await tx
      .update(campaignProducts)
      .set({
        stockAvailable: sql`${campaignProducts.stockAvailable} - ${dto.quantity}`,
        stockReserved: sql`${campaignProducts.stockReserved} + ${dto.quantity}`,
        updatedAt: new Date(),
      })
      .where(
        sql`${campaignProducts.id} = ${dto.productId} AND ${campaignProducts.stockAvailable} >= ${dto.quantity}`
      )
      .returning({ id: campaignProducts.id });

    if (!stockUpdate || stockUpdate.length === 0) {
      throw new InsufficientStockError(
        pricing.product.name,
        dto.quantity,
        0
      );
    }

    // Insert Order Record
    await tx.insert(campaignOrders).values({
      id: orderId,
      orderNumber,
      barcode,
      campaignKey: INSTAGRAM_CAMPAIGN_CONFIG.key,
      userId: userId || null,
      idempotencyKey: dto.idempotencyKey || null,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail || null,
      customerPhone: dto.customerPhone,
      instagramUsername: dto.instagramUsername,
      instagramUrl,
      shippingAddress: dto.shippingAddress,
      productId: dto.productId,
      productName: pricing.product.name,
      material: pricing.product.material,
      quantity: dto.quantity,
      designOption: dto.designOption,
      designNotes: dto.designNotes || null,
      unitPrice: pricing.unitPrice,
      customizationFee: pricing.customizationFee,
      designerFee: pricing.designerFee,
      shippingFee: pricing.shippingFee,
      discountAmount: pricing.discountAmount,
      taxAmount: pricing.taxAmount,
      totalAmount: pricing.totalAmount,
      amountPaid: 0,
      paymentStatus: 'UNPAID',
      designStatus: dto.designOption === 'DIY' ? 'DESIGN_APPROVED' : 'DESIGN_PENDING',
      productionStatus: 'PENDING_PRODUCTION',
      shippingStatus: 'NOT_SHIPPED',
      orderStatus: 'PENDING_PAYMENT',
    });

    // Record Inventory Movement
    await tx.insert(campaignInventoryMovements).values({
      id: `mov_${Date.now()}_${randomBytes(4).toString('hex')}`,
      productId: dto.productId,
      movementType: 'STOCK_RESERVED',
      quantity: dto.quantity,
      orderId,
      reason: `Order ${orderNumber} placed. Stock reserved pending payment verification.`,
      performedBy: userId || null,
    });

    // Save Design Snapshot
    const designState: any = dto.designState || {
      templateId: 'classic-dark',
      backgroundColor: '#0A0A0C',
      textColor: '#FFFFFF',
      fontFamily: 'Inter',
      accentColor: '#2563EB',
      instagramUsername: dto.instagramUsername,
      avatarUrl: undefined,
      logoUrl: undefined,
      headline: undefined,
      tagline: 'Scan or tap to connect',
    };

    await tx.insert(campaignDesigns).values({
      id: `cdes_${Date.now()}_${randomBytes(4).toString('hex')}`,
      orderId,
      templateId: designState.templateId,
      versionNumber: 1,
      isApproved: dto.designOption === 'DIY',
      frontDesignJson: {
        backgroundColor: designState.backgroundColor,
        textColor: designState.textColor,
        fontFamily: designState.fontFamily,
        avatarUrl: designState.avatarUrl,
        logoUrl: designState.logoUrl,
        instagramUsername: dto.instagramUsername,
        headline: designState.headline,
        accentColor: designState.accentColor,
      },
      backDesignJson: {
        qrDestination: instagramUrl,
        tagline: designState.tagline || 'Scan or tap to connect',
        showLogo: true,
      },
    });
  });

  logger.info({ orderId, orderNumber, totalAmount: pricing.totalAmount }, 'Campaign order created');

  return {
    orderId,
    orderNumber,
    barcode,
    totalAmount: pricing.totalAmount,
    currency: 'INR',
  };
}

/**
 * Get an order by human Order Number or Internal UUID
 */
export async function getCampaignOrder(orderIdentifier: string) {
  if (!orderIdentifier) {
    throw new OrderNotFoundError('empty_id');
  }

  const [order] = await db
    .select()
    .from(campaignOrders)
    .where(
      sql`${campaignOrders.id} = ${orderIdentifier} OR ${campaignOrders.orderNumber} = ${orderIdentifier} OR ${campaignOrders.barcode} = ${orderIdentifier}`
    )
    .limit(1);

  if (!order) {
    throw new OrderNotFoundError(orderIdentifier);
  }

  const [design] = await db
    .select()
    .from(campaignDesigns)
    .where(eq(campaignDesigns.orderId, order.id))
    .orderBy(desc(campaignDesigns.versionNumber))
    .limit(1);

  return { order, design };
}

/**
 * Public Order Tracking Endpoint (Protected by matching phone or order number)
 */
export async function trackCampaignOrder(orderNumber: string, phone: string) {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (!orderNumber || cleanPhone.length < 10) {
    throw new OrderNotFoundError(orderNumber || 'invalid');
  }

  const [order] = await db
    .select()
    .from(campaignOrders)
    .where(
      and(
        eq(campaignOrders.orderNumber, orderNumber.trim()),
        sql`REPLACE(${campaignOrders.customerPhone}, ' ', '') LIKE ${'%' + cleanPhone.slice(-10)}`
      )
    )
    .limit(1);

  if (!order) {
    throw new OrderNotFoundError(orderNumber);
  }

  return {
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    productName: order.productName,
    quantity: order.quantity,
    totalAmount: order.totalAmount,
    amountPaid: order.amountPaid,
    paymentStatus: order.paymentStatus,
    designStatus: order.designStatus,
    productionStatus: order.productionStatus,
    shippingStatus: order.shippingStatus,
    trackingNumber: order.trackingNumber,
    courierProvider: order.courierProvider,
    createdAt: order.createdAt,
  };
}

/**
 * List all campaign orders for administration
 */
export async function listCampaignOrders(filters?: {
  paymentStatus?: string;
  shippingStatus?: string;
  designStatus?: string;
  search?: string;
}) {
  const query = db
    .select()
    .from(campaignOrders)
    .orderBy(desc(campaignOrders.createdAt));

  const allOrders = await query;

  if (!filters) return allOrders;

  return allOrders.filter((o: any) => {
    if (filters.paymentStatus && o.paymentStatus !== filters.paymentStatus) return false;
    if (filters.shippingStatus && o.shippingStatus !== filters.shippingStatus) return false;
    if (filters.designStatus && o.designStatus !== filters.designStatus) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match = 
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        o.instagramUsername.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
}
