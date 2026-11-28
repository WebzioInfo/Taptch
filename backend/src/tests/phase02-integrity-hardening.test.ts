import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as crypto from 'crypto';
import { BadRequestException } from '@nestjs/common';
import { CardsService } from '../modules/cards/cards.service';
import { OrdersService } from '../modules/orders/orders.service';
import { AdminService } from '../modules/admin/admin.service';
import * as schema from '../database/schema';
import type { ActorContext } from '../common/types';

describe('Phase 0.2 Final Integrity Hardening', () => {
  const userActor: ActorContext = {
    userId: 'user_p02_1',
    orgId: null,
    role: 'user',
    isAdmin: false,
  };
  const adminActor: ActorContext = {
    userId: 'admin_p02_1',
    orgId: null,
    role: 'super_admin',
    isAdmin: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Cancelled & Refunded NFC Card Protection', () => {
    it('returns unavailable from resolvePublicNfcToken for REVOKED, CANCELLED, and REFUNDED purchased cards', async () => {
      const makeCardsService = (purchasedCard: any, parentOrder: any) => {
        const mockDb: any = {
          db: {
            select: () => ({
              from: (table: any) => ({
                where: () => ({
                  limit: async () => {
                    if (table === schema.cards) return [];
                    if (table === schema.purchasedCards) return purchasedCard ? [purchasedCard] : [];
                    if (table === schema.orders) return parentOrder ? [parentOrder] : [];
                    return [];
                  },
                }),
              }),
            }),
          },
        };
        return new CardsService(mockDb);
      };

      const revokedSvc = makeCardsService(
        { id: 'pc_1', redirectToken: 'tok_rev', profileAssignmentStatus: 'REVOKED', orderId: 'ord_1' },
        { orderStatus: 'CANCELLED', paymentStatus: 'PENDING' },
      );
      expect(await revokedSvc.resolvePublicNfcToken('tok_rev')).toEqual({
        status: 'unavailable',
        destinationType: null,
        destinationUrl: null,
      });

      const cancelledSvc = makeCardsService(
        { id: 'pc_2', redirectToken: 'tok_can', profileAssignmentStatus: 'AWAITING_PROFILE', orderId: 'ord_2', profileId: 'prof_1' },
        { orderStatus: 'CANCELLED', paymentStatus: 'COD_PENDING' },
      );
      expect(await cancelledSvc.resolvePublicNfcToken('tok_can')).toEqual({
        status: 'unavailable',
        destinationType: null,
        destinationUrl: null,
      });

      const refundedSvc = makeCardsService(
        { id: 'pc_3', redirectToken: 'tok_ref', profileAssignmentStatus: 'PROFILE_ATTACHED', orderId: 'ord_3', profileId: 'prof_1' },
        { orderStatus: 'ORDER_CONFIRMED', paymentStatus: 'REFUNDED' },
      );
      expect(await refundedSvc.resolvePublicNfcToken('tok_ref')).toEqual({
        status: 'unavailable',
        destinationType: null,
        destinationUrl: null,
      });
    });

    it('rejects attachProfileToPurchasedCard and setPurchasedCardDestination on revoked/cancelled/refunded cards', async () => {
      const card = {
        id: 'pc_revoked',
        userId: userActor.userId,
        orderId: 'ord_can',
        profileAssignmentStatus: 'REVOKED',
        profileId: null,
      };
      const mockDb: any = {
        withActor: vi.fn(async (_actor: any, fn: (tx: any) => Promise<any>) => {
          const tx = {
            select: () => ({
              from: (table: any) => ({
                where: () => ({
                  limit: async () => {
                    if (table === schema.purchasedCards) return [card];
                    if (table === schema.orders) return [{ orderStatus: 'CANCELLED', paymentStatus: 'PENDING' }];
                    return [];
                  },
                }),
              }),
            }),
          };
          return fn(tx);
        }),
      };

      const cardsService = new CardsService(mockDb);
      await expect(
        cardsService.attachProfileToPurchasedCard(userActor, 'pc_revoked', 'prof_1'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        cardsService.setPurchasedCardDestination(userActor, 'pc_revoked', {
          destinationType: 'none',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('cancelOrder revokes pre-fulfillment purchased_cards without deleting records', async () => {
      const cardUpdates: any[] = [];
      const mockDb: any = {
        withActor: vi.fn(async (_actor: any, fn: (tx: any) => Promise<any>) => {
          const tx = {
            select: () => ({
              from: () => ({
                where: () => ({
                  limit: async () => [
                    {
                      id: 'ord_pre',
                      userId: userActor.userId,
                      orderStatus: 'ORDER_CONFIRMED',
                      paymentStatus: 'COD_PENDING',
                    },
                  ],
                }),
              }),
            }),
            update: (table: any) => ({
              set: (vals: any) => ({
                where: () => {
                  if (table === schema.purchasedCards) {
                    cardUpdates.push(vals);
                    return Promise.resolve([]);
                  }
                  return {
                    returning: async () => [{ id: 'ord_pre', ...vals }],
                  };
                },
              }),
            }),
            insert: () => ({
              values: async () => [],
            }),
          };
          return fn(tx);
        }),
      };

      const ordersService = new OrdersService(mockDb);
      const res = await ordersService.cancelOrder('ord_pre', userActor, 'Changed mind');
      expect(res.orderStatus).toBe('CANCELLED');
      expect(cardUpdates).toHaveLength(1);
      expect(cardUpdates[0].profileAssignmentStatus).toBe('REVOKED');
      expect(cardUpdates[0].profileId).toBeNull();
    });

    it('AdminService.updateOrderPayment revokes cards on pre-fulfillment REFUNDED, but preserves post-fulfillment DELIVERED cards', async () => {
      const makeAdminDb = (orderStatus: string) => {
        const cardUpdates: any[] = [];
        const mockDb: any = {
          db: {
            select: () => ({
              from: (table: any) => ({
                where: () => {
                  if (table === schema.payments) {
                    return { orderBy: () => ({ limit: async () => [{ id: 'pay_1', gatewayPaymentId: 'g1' }] }) };
                  }
                  return {
                    for: () => ({
                      limit: async () => [
                        {
                          id: 'ord_1',
                          userId: userActor.userId,
                          orderStatus,
                          paymentStatus: 'PAID',
                          paymentMethod: 'razorpay',
                          totalAmount: 1868,
                        },
                      ],
                    }),
                  };
                },
              }),
            }),
            update: (table: any) => ({
              set: (vals: any) => ({
                where: () => {
                  if (table === schema.purchasedCards) {
                    cardUpdates.push(vals);
                    return Promise.resolve([]);
                  }
                  return {
                    returning: async () => [{ id: 'ord_1', ...vals }],
                  };
                },
              }),
            }),
            insert: () => ({
              values: async () => [],
            }),
          },
        };
        mockDb.db.transaction = async (fn: any) => fn(mockDb.db);
        return { service: new AdminService(mockDb), cardUpdates };
      };

      const preFulfillment = makeAdminDb('ORDER_CONFIRMED');
      await preFulfillment.service.updateOrderPayment('ord_1', { paymentStatus: 'REFUNDED' }, adminActor);
      expect(preFulfillment.cardUpdates).toHaveLength(1);
      expect(preFulfillment.cardUpdates[0].profileAssignmentStatus).toBe('REVOKED');

      const postFulfillment = makeAdminDb('DELIVERED');
      await postFulfillment.service.updateOrderPayment('ord_1', { paymentStatus: 'REFUNDED' }, adminActor);
      expect(postFulfillment.cardUpdates).toHaveLength(0);
    });
  });

  describe('Concurrent Payment Verification', () => {
    it('prevents duplicate payment records and status history under simultaneous verifyPayment calls', async () => {
      process.env.RAZORPAY_KEY_SECRET = 'rzp_conc_secret';
      const rzpOrderId = 'order_conc_1';
      const rzpPaymentId = 'pay_conc_1';
      const sig = crypto
        .createHmac('sha256', 'rzp_conc_secret')
        .update(`${rzpOrderId}|${rzpPaymentId}`)
        .digest('hex');

      const state = {
        orderStatus: 'PAYMENT_PENDING',
        paymentStatus: 'PENDING',
        totalAmount: 1868,
        paymentUpdates: 0,
        historyInserts: 0,
      };

      // Simulate PostgreSQL row-level mutex via a promise queue
      let lockQueue = Promise.resolve();
      const mockDb: any = {
        withActor: vi.fn(async (_actor: any, fn: (tx: any) => Promise<any>) => {
          const prev = lockQueue;
          let release!: () => void;
          lockQueue = new Promise<void>((r) => {
            release = r;
          });
          await prev;
          try {
            const tx: any = {
              select: () => ({
                from: (table: any) => ({
                  where: () => {
                    if (table === schema.orderItems) {
                      return Promise.resolve([]);
                    }
                    const q: any = {
                      for: () => ({
                        limit: async () => [
                          {
                            id: 'ord_conc',
                            userId: userActor.userId,
                            orderStatus: state.orderStatus,
                            paymentStatus: state.paymentStatus,
                            totalAmount: state.totalAmount,
                          },
                        ],
                      }),
                      limit: async () => [],
                    };
                    return q;
                  },
                }),
              }),
              update: (table: any) => ({
                set: (vals: any) => ({
                  where: () => {
                    if (table === schema.orders) {
                      state.orderStatus = vals.orderStatus;
                      state.paymentStatus = vals.paymentStatus;
                    }
                    if (table === schema.payments) {
                      state.paymentUpdates += 1;
                    }
                    return {
                      returning: async () => [{ id: 'ord_conc', ...vals }],
                    };
                  },
                }),
              }),
              insert: (table: any) => ({
                values: async () => {
                  if (table === schema.orderStatusHistory) state.historyInserts += 1;
                  return [];
                },
              }),
            };
            return await fn(tx);
          } finally {
            release();
          }
        }),
      };

      const ordersService = new OrdersService(mockDb);
      const [r1, r2] = await Promise.all([
        ordersService.verifyPayment('ord_conc', userActor, {
          paymentMethod: 'razorpay',
          razorpay_order_id: rzpOrderId,
          razorpay_payment_id: rzpPaymentId,
          razorpay_signature: sig,
        }),
        ordersService.verifyPayment('ord_conc', userActor, {
          paymentMethod: 'razorpay',
          razorpay_order_id: rzpOrderId,
          razorpay_payment_id: rzpPaymentId,
          razorpay_signature: sig,
        }),
      ]);

      expect(r1.paymentStatus).toBe('PAID');
      expect(r2.paymentStatus).toBe('PAID');
      expect(state.paymentUpdates).toBe(1);
      expect(state.historyInserts).toBe(1);
    });
  });
});
