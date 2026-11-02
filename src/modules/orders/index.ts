import { eq, desc } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { db } from '@/db';
import { orders } from '@/db/schema/orders';
import { profiles } from '@/db/schema/profiles';
import { users } from '@/db/schema/auth';
import { logger } from '@/lib/logger';

export interface ShippingAddress {
  recipientName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface CreateOrderInput {
  profileId?: string;
  material: 'pvc' | 'metal';
  quantity: number;
  shippingAddress: ShippingAddress;
  notes?: string;
}

export interface UserOrderRecord {
  id: string;
  material: string;
  quantity: number;
  shippingAddress: ShippingAddress;
  orderStatus: string;
  paymentStatus: string;
  trackingNumber: string | null;
  profileId: string | null;
  profileName: string | null;
  createdAt: Date;
}

export interface AdminOrderRecord extends UserOrderRecord {
  userId: string;
  userName: string | null;
  userEmail: string | null;
  notes: string | null;
  updatedAt: Date;
}

export class OrderNotFoundError extends Error {
  constructor(orderId: string) {
    super(`Hardware order with ID "${orderId}" was not found.`);
    this.name = 'OrderNotFoundError';
  }
}

/**
 * Place a new physical smart card hardware order request.
 * Online payment gateways are deferred; paymentStatus tracks offline/waived/unpaid state.
 */
export async function createOrder(
  userId: string,
  input: CreateOrderInput
): Promise<{ orderId: string }> {
  const orderId = `ord_${Date.now()}_${randomBytes(4).toString('hex')}`;

  await db.insert(orders).values({
    id: orderId,
    userId,
    profileId: input.profileId || null,
    material: input.material,
    quantity: Math.max(1, input.quantity),
    shippingAddress: input.shippingAddress,
    orderStatus: 'requested',
    paymentStatus: 'unpaid',
    notes: input.notes || null,
  });

  logger.info({ orderId, userId, material: input.material }, 'Physical card order requested');
  return { orderId };
}

/**
 * List all card orders placed by a specific user
 */
export async function listUserOrders(userId: string): Promise<UserOrderRecord[]> {
  const rows = await db
    .select({
      id: orders.id,
      material: orders.material,
      quantity: orders.quantity,
      shippingAddress: orders.shippingAddress,
      orderStatus: orders.orderStatus,
      paymentStatus: orders.paymentStatus,
      trackingNumber: orders.trackingNumber,
      profileId: orders.profileId,
      profileName: profiles.displayName,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .leftJoin(profiles, eq(orders.profileId, profiles.id))
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  return rows as unknown as UserOrderRecord[];
}

/**
 * Super Admin: list all physical card orders across the platform
 */
export async function listAllOrders(): Promise<AdminOrderRecord[]> {
  const rows = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      userName: users.name,
      userEmail: users.email,
      material: orders.material,
      quantity: orders.quantity,
      shippingAddress: orders.shippingAddress,
      orderStatus: orders.orderStatus,
      paymentStatus: orders.paymentStatus,
      trackingNumber: orders.trackingNumber,
      profileId: orders.profileId,
      profileName: profiles.displayName,
      notes: orders.notes,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .leftJoin(profiles, eq(orders.profileId, profiles.id))
    .orderBy(desc(orders.createdAt));

  return rows as unknown as AdminOrderRecord[];
}

/**
 * Super Admin: update production lifecycle status, manual payment status, and courier tracking
 */
export async function updateOrderStatus(
  orderId: string,
  updates: {
    orderStatus?: string;
    paymentStatus?: string;
    trackingNumber?: string;
    notes?: string;
  }
): Promise<void> {
  const [existing] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!existing) {
    throw new OrderNotFoundError(orderId);
  }

  await db
    .update(orders)
    .set({
      ...(updates.orderStatus ? { orderStatus: updates.orderStatus } : {}),
      ...(updates.paymentStatus ? { paymentStatus: updates.paymentStatus } : {}),
      ...(updates.trackingNumber !== undefined ? { trackingNumber: updates.trackingNumber } : {}),
      ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  logger.info({ orderId, updates }, 'Card order updated by admin');
}

