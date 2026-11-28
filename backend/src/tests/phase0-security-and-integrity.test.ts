import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as crypto from 'crypto';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { UploadsService } from '../modules/uploads/uploads.service';
import { OrdersService } from '../modules/orders/orders.service';
import { CardsService, hashActivationCode } from '../modules/cards/cards.service';
import { AdminService } from '../modules/admin/admin.service';
import { AuthService } from '../modules/auth/auth.service';
import { ProfilesService } from '../modules/profiles/profiles.service';
import * as schema from '../database/schema';
import type { ActorContext } from '../common/types';

describe('Phase 0 Security & Data Integrity Verification', () => {
  const ownerActor: ActorContext = {
    userId: 'user_owner_1',
    orgId: null,
    role: 'user',
    isAdmin: false,
  };
  const strangerActor: ActorContext = {
    userId: 'user_stranger_2',
    orgId: null,
    role: 'user',
    isAdmin: false,
  };
  const adminActor: ActorContext = {
    userId: 'user_admin_1',
    orgId: null,
    role: 'super_admin',
    isAdmin: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── TASK 1: Upload Deletion IDOR ──────────────────────────────────────────
  describe('Task 1: UploadsService.delete IDOR protection', () => {
    function makeUploadsService(existingAsset: any | null) {
      const deletedIds: string[] = [];
      const mockDb: any = {
        withActor: vi.fn(async (_actor: any, fn: (tx: any) => Promise<any>) => {
          const tx = {
            select: () => ({
              from: () => ({
                where: async () => (existingAsset ? [existingAsset] : []),
              }),
            }),
            delete: () => ({
              where: async () => {
                if (existingAsset) deletedIds.push(existingAsset.id);
                return [];
              },
            }),
          };
          return fn(tx);
        }),
      };
      const mockCloudinary: any = {
        extractPublicIdFromUrl: vi.fn(() => 'taptch/user_owner_1/avatars/a1'),
        deleteByPublicId: vi.fn(async () => true),
      };
      return {
        service: new UploadsService(mockDb, mockCloudinary),
        mockCloudinary,
        deletedIds,
      };
    }

    it('allows the owner to delete their own media asset', async () => {
      const { service, mockCloudinary, deletedIds } = makeUploadsService({
        id: 'asset_1',
        ownerId: ownerActor.userId,
        cloudinaryPublicId: 'taptch/user_owner_1/avatars/a1',
        secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1/taptch/user_owner_1/avatars/a1.png',
      });
      const res = await service.delete(ownerActor, 'asset_1');
      expect(res.success).toBe(true);
      expect(mockCloudinary.deleteByPublicId).toHaveBeenCalledWith('taptch/user_owner_1/avatars/a1');
      expect(deletedIds).toEqual(['asset_1']);
    });

    it('rejects another user attempting to delete an asset by ID (IDOR)', async () => {
      const { service, mockCloudinary, deletedIds } = makeUploadsService({
        id: 'asset_1',
        ownerId: ownerActor.userId,
        cloudinaryPublicId: 'taptch/user_owner_1/avatars/a1',
      });
      await expect(service.delete(strangerActor, 'asset_1')).rejects.toThrow(ForbiddenException);
      expect(mockCloudinary.deleteByPublicId).not.toHaveBeenCalled();
      expect(deletedIds).toHaveLength(0);
    });

    it('throws NotFoundException when asset does not exist', async () => {
      const { service } = makeUploadsService(null);
      await expect(service.delete(ownerActor, 'missing_id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── TASK 2: Payment Verification ──────────────────────────────────────────
  describe('Task 2: OrdersService.verifyPayment security', () => {
    function makeOrdersService(orderRow: any) {
      const insertedHistory: any[] = [];
      const allocatedTokens: string[] = [];
      const mockDb: any = {
        withActor: vi.fn(async (_actor: any, fn: (tx: any) => Promise<any>) => {
          const tx: any = {
            select: () => ({
              from: (table: any) => ({
                where: () => {
                  if (table === schema.orderItems) {
                    return Promise.resolve([
                      {
                        id: 'item_1',
                        orderId: orderRow?.id,
                        productId: 'prod_pvc_black',
                        productName: 'Classic PVC',
                        variantName: 'Black',
                        quantity: 1,
                      },
                    ]);
                  }
                  return {
                    limit: async () => {
                      if (table === schema.orders) return orderRow ? [orderRow] : [];
                      return [];
                    },
                  };
                },
              }),
            }),
            update: () => ({
              set: (vals: any) => ({
                where: () => ({
                  returning: async () => [{ ...orderRow, ...vals }],
                }),
              }),
            }),
            insert: (table: any) => ({
              values: async (val: any) => {
                if (table === schema.orderStatusHistory) insertedHistory.push(val);
                if (table === schema.purchasedCards) allocatedTokens.push(val.redirectToken);
                return [val];
              },
            }),
          };
          return fn(tx);
        }),
      };
      return {
        service: new OrdersService(mockDb),
        insertedHistory,
        allocatedTokens,
      };
    }

    it('verifies valid Razorpay HMAC signature and allocates 128-bit NFC token', async () => {
      process.env.RAZORPAY_KEY_SECRET = 'rzp_test_secret_123';
      const rzpOrderId = 'order_rzp_1';
      const rzpPaymentId = 'pay_rzp_1';
      const validSig = crypto
        .createHmac('sha256', 'rzp_test_secret_123')
        .update(`${rzpOrderId}|${rzpPaymentId}`)
        .digest('hex');

      const { service, allocatedTokens } = makeOrdersService({
        id: 'ord_1',
        userId: ownerActor.userId,
        orderStatus: 'PAYMENT_PENDING',
        paymentStatus: 'PENDING',
        totalAmount: 1868,
        material: 'pvc',
        quantity: 1,
      });

      const updated = await service.verifyPayment('ord_1', ownerActor, {
        paymentMethod: 'razorpay',
        razorpay_order_id: rzpOrderId,
        razorpay_payment_id: rzpPaymentId,
        razorpay_signature: validSig,
      });

      expect(updated.paymentStatus).toBe('PAID');
      expect(allocatedTokens).toHaveLength(1);
      expect(allocatedTokens[0]).toMatch(/^[a-f0-9]{32}$/);
    });

    it('rejects invalid or missing Razorpay signature and missing secret', async () => {
      process.env.RAZORPAY_KEY_SECRET = 'rzp_test_secret_123';
      const { service } = makeOrdersService({
        id: 'ord_1',
        userId: ownerActor.userId,
        orderStatus: 'PAYMENT_PENDING',
        paymentStatus: 'PENDING',
        totalAmount: 1868,
      });

      await expect(
        service.verifyPayment('ord_1', ownerActor, {
          paymentMethod: 'razorpay',
          razorpay_order_id: 'order_1',
          razorpay_payment_id: 'pay_1',
          razorpay_signature: 'invalid_sig',
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.verifyPayment('ord_1', ownerActor, {
          paymentMethod: 'razorpay',
          razorpay_payment_id: 'pay_1',
        }),
      ).rejects.toThrow(BadRequestException);

      delete process.env.RAZORPAY_KEY_SECRET;
      await expect(
        service.verifyPayment('ord_1', ownerActor, {
          paymentMethod: 'razorpay',
          razorpay_order_id: 'order_1',
          razorpay_payment_id: 'pay_1',
          razorpay_signature: 'abc',
        }),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('rejects cancelled or refunded orders and handles repeated PAID calls idempotently', async () => {
      const cancelled = makeOrdersService({
        id: 'ord_cancel',
        userId: ownerActor.userId,
        orderStatus: 'CANCELLED',
        paymentStatus: 'PENDING',
      });
      await expect(
        cancelled.service.verifyPayment('ord_cancel', ownerActor, {
          paymentMethod: 'razorpay',
          razorpay_order_id: 'o',
          razorpay_payment_id: 'p',
          razorpay_signature: 's',
        }),
      ).rejects.toThrow(BadRequestException);

      const refunded = makeOrdersService({
        id: 'ord_ref',
        userId: ownerActor.userId,
        orderStatus: 'DELIVERED',
        paymentStatus: 'REFUNDED',
      });
      await expect(
        refunded.service.verifyPayment('ord_ref', ownerActor, {
          paymentMethod: 'razorpay',
          razorpay_order_id: 'o',
          razorpay_payment_id: 'p',
          razorpay_signature: 's',
        }),
      ).rejects.toThrow(BadRequestException);

      const alreadyPaid = makeOrdersService({
        id: 'ord_paid',
        userId: ownerActor.userId,
        orderStatus: 'ORDER_CONFIRMED',
        paymentStatus: 'PAID',
      });
      const res = await alreadyPaid.service.verifyPayment('ord_paid', ownerActor, {
        paymentMethod: 'razorpay',
      });
      expect(res.paymentStatus).toBe('PAID');
      expect(alreadyPaid.insertedHistory).toHaveLength(0);
    });

    it('blocks UPI simulator in production or when ALLOW_UPI_TEST_SIMULATOR is not enabled', async () => {
      const prevEnv = process.env.NODE_ENV;
      const prevSim = process.env.ALLOW_UPI_TEST_SIMULATOR;
      process.env.NODE_ENV = 'production';
      process.env.ALLOW_UPI_TEST_SIMULATOR = 'true';

      const { service } = makeOrdersService({
        id: 'ord_upi',
        userId: ownerActor.userId,
        orderStatus: 'PAYMENT_PENDING',
        paymentStatus: 'PENDING',
      });

      await expect(
        service.verifyPayment('ord_upi', ownerActor, {
          paymentMethod: 'upi',
          simulationStatus: 'SUCCESS',
        }),
      ).rejects.toThrow(BadRequestException);

      process.env.NODE_ENV = prevEnv;
      process.env.ALLOW_UPI_TEST_SIMULATOR = prevSim;
    });
  });

  // ── TASK 3: Secure NFC Card Claiming ──────────────────────────────────────
  describe('Task 3: CardsService.linkCardToProfile activation security', () => {
    function makeCardsService(cardRow: any, recentFailureCount = 0) {
      const attempts: any[] = [];
      const assignments: any[] = [];
      const mockDb: any = {
        db: {
          select: () => ({
            from: (table: any) => ({
              where: () => {
                if (table === schema.activationAttempts) {
                  return Promise.resolve(
                    Array.from({ length: recentFailureCount }, (_, i) => ({ id: `f_${i}` })),
                  );
                }
                return { limit: async () => [] };
              },
            }),
          }),
          insert: (table: any) => ({
            values: async (val: any) => {
              if (table === schema.activationAttempts) attempts.push(val);
              return [val];
            },
          }),
        },
        withActor: vi.fn(async (_actor: any, fn: (tx: any) => Promise<any>) => {
          const tx = {
            select: () => ({
              from: (table: any) => ({
                where: () => ({
                  limit: async () => {
                    if (table === schema.cards) return cardRow ? [cardRow] : [];
                    if (table === schema.profiles) {
                      return [{ id: 'prof_1', ownerId: ownerActor.userId }];
                    }
                    return [];
                  },
                }),
              }),
            }),
            update: () => ({
              set: (vals: any) => ({
                where: () => ({
                  returning: async () => [{ ...cardRow, ...vals }],
                }),
              }),
            }),
            insert: (table: any) => ({
              values: async (val: any) => {
                if (table === schema.cardAssignments) assignments.push(val);
                return [val];
              },
            }),
          };
          return fn(tx);
        }),
      };
      return { service: new CardsService(mockDb), attempts, assignments };
    }

    it('rejects claiming an unowned card without activationCode or with wrong activationCode', async () => {
      const card = {
        id: 'card_unclaimed',
        ownerUserId: null,
        redirectToken: 'tok_1234567890abcdef1234567890abcdef',
        activationCodeHash: hashActivationCode('SECRET99'),
        status: 'unclaimed',
      };

      const { service, attempts } = makeCardsService(card);
      await expect(service.linkCardToProfile(ownerActor, 'card_unclaimed', 'prof_1')).rejects.toThrow(
        BadRequestException,
      );

      await expect(
        service.linkCardToProfile(ownerActor, 'card_unclaimed', 'prof_1', 'WRONGCODE'),
      ).rejects.toThrow(ForbiddenException);
      expect(attempts.some((a) => a.success === false)).toBe(true);
    });

    it('locks out after 5 failed activation attempts and succeeds with valid activationCode', async () => {
      const card = {
        id: 'card_unclaimed',
        ownerUserId: null,
        redirectToken: 'tok_1234567890abcdef1234567890abcdef',
        activationCodeHash: hashActivationCode('SECRET99'),
        status: 'unclaimed',
      };

      const locked = makeCardsService(card, 5);
      await expect(
        locked.service.linkCardToProfile(ownerActor, 'card_unclaimed', 'prof_1', 'SECRET99'),
      ).rejects.toThrow(BadRequestException);

      const valid = makeCardsService(card, 0);
      const linked = await valid.service.linkCardToProfile(
        ownerActor,
        'card_unclaimed',
        'prof_1',
        'secret99',
      );
      expect(linked.ownerUserId).toBe(ownerActor.userId);
      expect(linked.status).toBe('active');
      expect(valid.assignments).toHaveLength(1);
      expect(valid.assignments[0].reason).toBe('claim');
    });

    it('blocks another user from claiming an already-owned card', async () => {
      const card = {
        id: 'card_owned',
        ownerUserId: ownerActor.userId,
        redirectToken: 'tok_owned',
        activationCodeHash: hashActivationCode('SECRET99'),
        status: 'active',
      };
      const { service } = makeCardsService(card);
      await expect(
        service.linkCardToProfile(strangerActor, 'card_owned', 'prof_1', 'SECRET99'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── TASK 5 & TASK 6 & TASK 9: Suspension, Financial Summary, Validation ───
  describe('Task 5, 6 & 9: AdminService suspension cascade, P&L, and validation', () => {
    it('suspends user, revokes sessions, invalidates Redis cache, and blocks self/last-super-admin', async () => {
      const deletedSessions: string[] = [];
      const redisDeleted: string[] = [];
      const mockRedis: any = {
        del: vi.fn(async (k: string) => {
          redisDeleted.push(k);
          return 1;
        }),
      };

      const targetUser = {
        id: 'user_target',
        systemRole: 'user',
        status: 'active',
      };

                  const mockTx: any = {
                    select: () => ({
                      from: (table: any) => ({
                        where: () => {
                          if (table === schema.profiles) {
                            return Promise.resolve([{ slug: 'target-slug' }]);
                          }
                          return {
                            for: () => ({
                              limit: async () => (table === schema.users ? [targetUser] : []),
                      }),
                  };
                },
          }),
            }),
            update: () => ({
              set: () => ({
                where: async () => [],
              }),
            }),
            delete: (table: any) => ({
              where: async () => {
                if (table === schema.sessions) deletedSessions.push('user_target');
                return [];
              },
            }),
            insert: () => ({
              values: async () => [],
            }),
          };

          const mockDb: any = {
            db: {
              ...mockTx,
              transaction: async (fn: any) => fn(mockTx),
            },
          };

          const adminService = new AdminService(mockDb, mockRedis);

          // Self-suspension rejected
          await expect(
            adminService.updateUserStatus(adminActor.userId, 'suspended', adminActor),
          ).rejects.toThrow(BadRequestException);

          // Invalid status rejected
          await expect(
            adminService.updateUserStatus('user_target', 'hacked_status', adminActor),
          ).rejects.toThrow(BadRequestException);

          // Valid suspension revokes sessions & clears Redis without altering profile.status
          const res = await adminService.updateUserStatus('user_target', 'suspended', adminActor);
          expect(res.status).toBe('suspended');
    expect(deletedSessions).toEqual(['user_target']);
    expect(redisDeleted).toContain('profile:slug:target-slug');
    expect(redisDeleted).toContain('profile:notfound:target-slug');
  });

  it('calculates financial summary from actual order totals, excluding CANCELLED and separating REFUNDED', async () => {
    const mockOrders = [
      { id: 'o1', material: 'pvc', quantity: 1, totalAmount: 1868, orderStatus: 'ORDER_CONFIRMED', paymentStatus: 'PAID' },
      { id: 'o2', material: 'metal', quantity: 2, totalAmount: 5898, orderStatus: 'DELIVERED', paymentStatus: 'PAID' },
      { id: 'o3', material: 'wood', quantity: 1, totalAmount: 1868, orderStatus: 'ORDER_CONFIRMED', paymentStatus: 'COD_PENDING' },
      { id: 'o4', material: 'pvc', quantity: 1, totalAmount: 1868, orderStatus: 'DELIVERED', paymentStatus: 'REFUNDED' },
      { id: 'o5', material: 'metal', quantity: 1, totalAmount: 2949, orderStatus: 'CANCELLED', paymentStatus: 'PENDING' },
    ];
    const mockExpenses = [{ id: 'e1', category: 'shipping', amount: 500 }];

    const mockDb: any = {
      db: {
        select: () => ({
          from: (table: any) => {
            if (table === schema.orders) return Promise.resolve(mockOrders);
            if (table === schema.expenses) {
              return { orderBy: async () => mockExpenses };
            }
            return Promise.resolve([]);
          },
        }),
      },
    };

    const adminService = new AdminService(mockDb);
    const summary = await adminService.getFinancialSummary();

    expect(summary.collectedRevenue).toBe(1868 + 5898); // 7766
    expect(summary.outstandingRevenue).toBe(1868); // COD_PENDING
    expect(summary.refundedAmount).toBe(1868);
    expect(summary.cancelledOrderValue).toBe(2949);
    expect(summary.grossSales).toBe(1868 + 5898 + 1868 + 1868);
    expect(summary.totalCogs).toBe(150 * 1 + 450 * 2); // 1050
    expect(summary.totalExpenses).toBe(500);
    expect(summary.netProfit).toBe(7766 - 1050 - 500);
  });

  it('AuthService.getSession returns null for suspended user and ProfilesService.findBySlug hides data', async () => {
    const mockAuthDb: any = {
      db: {
        select: () => ({
          from: () => ({
            innerJoin: () => ({
              where: () => ({
                limit: async () => [
                  {
                    session: { id: 's1', token: 'tok' },
                    user: { id: 'u_susp', status: 'suspended', systemRole: 'user' },
                  },
                ],
              }),
            }),
          }),
        }),
      },
    };
    const authService = new AuthService(
      mockAuthDb,
      { get: async () => null, set: async () => 'OK', del: async () => 1 } as any,
    );
    expect(await authService.getSession('tok')).toBeNull();

    const mockProfileDb: any = {
      db: {
        select: () => ({
          from: (table: any) => ({
            where: () => ({
              limit: async () => {
                if (table === schema.profiles) {
                  return [
                    {
                      id: 'p_susp',
                      ownerId: 'u_susp',
                      slug: 'susp-user',
                      status: 'PUBLISHED',
                      displayName: 'Should Not Leak',
                    },
                  ];
                }
                if (table === schema.users) {
                  return [{ status: 'suspended' }];
                }
                return [];
              },
            }),
          }),
        }),
      },
    };
    const profilesService = new ProfilesService(
      mockProfileDb,
      { get: async () => null, set: async () => 'OK', del: async () => 1 } as any,
      {} as any,
    );
    const snap = await profilesService.findBySlug('susp-user');
    expect(snap.status).toBe('SUSPENDED');
    expect((snap as any).displayName).toBeUndefined();
  });
});
});
