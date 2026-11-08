import { randomBytes } from 'node:crypto';
import { db } from '@/db';
import {
  campaignOrders,
  campaignPayments,
  campaignRefunds,
} from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { getCampaignOrder, OrderNotFoundError } from './order.service';

export class PaymentVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentVerificationError';
  }
}

export interface RecordOfflinePaymentInput {
  orderId: string;
  amount: number;
  paymentMethod: 'UPI' | 'BANK_TRANSFER' | 'CASH' | 'OTHER';
  transactionReference: string; // UTR / RRN
  evidenceUrl?: string;
  internalNotes?: string;
}

/**
 * Customer reports an offline payment reference
 * Sets state to PAYMENT_REPORTED (does NOT mark as PAID until verified)
 */
export async function reportCustomerPayment(input: RecordOfflinePaymentInput) {
  const { order } = await getCampaignOrder(input.orderId);

  // Check if reference already logged
  const [existing] = await db
    .select({ id: campaignPayments.id })
    .from(campaignPayments)
    .where(eq(campaignPayments.transactionReference, input.transactionReference.trim()))
    .limit(1);

  if (existing) {
    throw new PaymentVerificationError(
      `Transaction reference "${input.transactionReference}" has already been submitted.`
    );
  }

  const paymentId = `cpay_${Date.now()}_${randomBytes(4).toString('hex')}`;

  await db.transaction(async (tx: any) => {
    await tx.insert(campaignPayments).values({
      id: paymentId,
      orderId: order.id,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      transactionReference: input.transactionReference.trim(),
      evidenceUrl: input.evidenceUrl || null,
      isVerified: false,
      internalNotes: input.internalNotes || 'Reported by customer via storefront/WhatsApp',
    });

    await tx
      .update(campaignOrders)
      .set({
        paymentStatus: 'PAYMENT_REPORTED',
        updatedAt: new Date(),
      })
      .where(eq(campaignOrders.id, order.id));
  });

  logger.info({ orderId: order.id, paymentId }, 'Payment reported by customer');
  return { paymentId };
}

/**
 * Super Admin / Finance Manager: Verifies actual offline bank settlement
 * - Updates amountPaid
 * - Transitions paymentStatus to PAID or PARTIALLY_PAID
 * - Advances orderStatus to PROCESSING
 */
export async function verifyOfflinePayment(
  paymentId: string,
  verifiedByUserId: string | null = null,
  notes?: string
) {
  const [payment] = await db
    .select()
    .from(campaignPayments)
    .where(eq(campaignPayments.id, paymentId))
    .limit(1);

  if (!payment) {
    throw new PaymentVerificationError(`Payment ID "${paymentId}" was not found.`);
  }

  if (payment.isVerified) {
    throw new PaymentVerificationError('This payment transaction has already been verified.');
  }

  const { order } = await getCampaignOrder(payment.orderId);

  await db.transaction(async (tx: any) => {
    // 1. Mark payment record as verified
    await tx
      .update(campaignPayments)
      .set({
        isVerified: true,
        verifiedBy: verifiedByUserId,
        verifiedAt: new Date(),
        internalNotes: notes || payment.internalNotes,
      })
      .where(eq(campaignPayments.id, paymentId));

    // 2. Compute cumulative verified payments
    const verifiedSumResult = await tx
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(campaignPayments)
      .where(
        sql`${campaignPayments.orderId} = ${order.id} AND ${campaignPayments.isVerified} = true`
      );

    const newAmountPaid = Number(verifiedSumResult[0]?.total ?? 0);
    const isFullyPaid = newAmountPaid >= order.totalAmount;
    const newPaymentStatus = isFullyPaid ? 'PAID' : 'PARTIALLY_PAID';

    // 3. Update order state
    await tx
      .update(campaignOrders)
      .set({
        amountPaid: newAmountPaid,
        paymentStatus: newPaymentStatus,
        orderStatus: 'PROCESSING',
        updatedAt: new Date(),
      })
      .where(eq(campaignOrders.id, order.id));
  });

  logger.info({ orderId: order.id, paymentId, verifiedByUserId }, 'Offline payment verified by admin');
}

/**
 * Processes a financial refund record
 */
export async function processRefund(
  orderId: string,
  amount: number,
  reason: string,
  refundMethod: 'UPI_REVERSAL' | 'BANK_TRANSFER',
  transactionReference: string,
  authorizedByUserId: string
) {
  const { order } = await getCampaignOrder(orderId);

  if (amount <= 0 || amount > order.amountPaid) {
    throw new PaymentVerificationError(
      `Refund amount ₹${amount} exceeds verified paid amount of ₹${order.amountPaid}.`
    );
  }

  const refundId = `cref_${Date.now()}_${randomBytes(4).toString('hex')}`;

  await db.transaction(async (tx: any) => {
    await tx.insert(campaignRefunds).values({
      id: refundId,
      orderId: order.id,
      amount,
      reason,
      refundMethod,
      transactionReference,
      authorizedBy: authorizedByUserId,
    });

    const newAmountPaid = Math.max(0, order.amountPaid - amount);
    const newStatus = newAmountPaid === 0 ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

    await tx
      .update(campaignOrders)
      .set({
        amountPaid: newAmountPaid,
        paymentStatus: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(campaignOrders.id, order.id));
  });

  logger.info({ orderId, refundId, amount }, 'Refund recorded and processed');
  return { refundId };
}
