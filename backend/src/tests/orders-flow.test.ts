import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as crypto from 'crypto';
import { OrdersService, type CreateOrderDto } from '../modules/orders/orders.service';
import type { ActorContext } from '../common/types';

describe('OrdersService — Complete Ordering, Preservation & Payment Verification Flow', () => {
  let mockDbService: any;
  let ordersService: OrdersService;

  const mockActor: ActorContext = {
    userId: 'usr_premium_101',
    orgId: null,
    role: 'user',
    isAdmin: false,
  };

  const sampleAddress = {
    fullName: 'Alexander Vance',
    phone: '+91 9876543210',
    email: 'alexander@taptch.com',
    addressLine1: 'Suite 400, 100 Silicon Boulevard',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560001',
    country: 'India',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Order Creation & Pricing Logic', () => {
    it('calculates 18% GST and standard shipping (₹99) when subtotal is below ₹2000', async () => {
      let insertedOrder: any = null;

      mockDbService = {
        withActor: vi.fn().mockImplementation((actor, callback) => {
          const fakeTx = {
            select: vi.fn().mockReturnValue({
              from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([]), // no idempotency duplicate
                }),
              }),
            }),
            insert: vi.fn().mockImplementation(() => ({
              values: vi.fn().mockImplementation((val) => {
                if (!insertedOrder && val.orderNumber) {
                  insertedOrder = val;
                }
                return {
                  returning: vi.fn().mockResolvedValue([val]),
                };
              }),
            })),
            delete: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue({}),
            }),
          };
          return callback(fakeTx);
        }),
      };

      ordersService = new OrdersService(mockDbService);

      const orderData: CreateOrderDto = {
        productId: 'prod_pvc_black',
        cardMaterial: 'pvc',
        quantity: 1, // unit price = 1499 -> subtotal = 1499 < 2000
        shippingAddress: sampleAddress,
        paymentMethod: 'upi',
      };

      const result = await ordersService.createOrder(mockActor, orderData);

      expect(result).toBeDefined();
      expect(result.subtotal).toBe(1499);
      expect(result.shippingCost).toBe(99); // Subtotal < 2000 -> ₹99
      expect(result.taxAmount).toBe(Math.round(1499 * 0.18)); // 270
      expect(result.totalAmount).toBe(1499 + 99 + 270); // 1868
      expect(result.currency).toBe('INR');
      expect(result.orderNumber).toMatch(/^TAP-\d{4}-\d{4}$/);
    });

    it('waives shipping fee (Free shipping) when subtotal is ₹2000 or greater', async () => {
      let insertedOrder: any = null;

      mockDbService = {
        withActor: vi.fn().mockImplementation((actor, callback) => {
          const fakeTx = {
            select: vi.fn().mockReturnValue({
              from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([]),
                }),
              }),
            }),
            insert: vi.fn().mockImplementation(() => ({
              values: vi.fn().mockImplementation((val) => {
                if (!insertedOrder && val.orderNumber) {
                  insertedOrder = val;
                }
                return {
                  returning: vi.fn().mockResolvedValue([val]),
                };
              }),
            })),
            delete: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue({}),
            }),
          };
          return callback(fakeTx);
        }),
      };

      ordersService = new OrdersService(mockDbService);

      const orderData: CreateOrderDto = {
        productId: 'prod_metal_black',
        cardMaterial: 'metal', // unit price = 2499 -> subtotal >= 2000
        quantity: 1,
        shippingAddress: sampleAddress,
        paymentMethod: 'razorpay',
      };

      const result = await ordersService.createOrder(mockActor, orderData);

      expect(result).toBeDefined();
      expect(result.subtotal).toBe(2499);
      expect(result.shippingCost).toBe(0); // Free Shipping
      expect(result.taxAmount).toBe(Math.round(2499 * 0.18)); // 450
      expect(result.totalAmount).toBe(2499 + 0 + 450); // 2949
    });

    it('enforces idempotency check and returns existing order on duplicate requests', async () => {
      const existingMockOrder = {
        id: 'ord_existing_999',
        orderNumber: 'TAP-2026-9999',
        userId: mockActor.userId,
        totalAmount: 1868,
        idempotencyKey: 'idemp_key_123',
      };

      mockDbService = {
        withActor: vi.fn().mockImplementation((actor, callback) => {
          const fakeTx = {
            select: vi.fn().mockReturnValue({
              from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([existingMockOrder]), // Idempotency hit!
                }),
              }),
            }),
          };
          return callback(fakeTx);
        }),
      };

      ordersService = new OrdersService(mockDbService);

      const orderData: CreateOrderDto = {
        productId: 'prod_pvc_black',
        quantity: 1,
        shippingAddress: sampleAddress,
        idempotencyKey: 'idemp_key_123',
      };

      const result = await ordersService.createOrder(mockActor, orderData);

      expect(result.id).toBe(existingMockOrder.id);
      expect(result.isDuplicate).toBe(true);
    });

    it('preserves immutable vector design snapshot in order items', async () => {
      let capturedSnapshotRaw: string = '';

      mockDbService = {
        withActor: vi.fn().mockImplementation((actor, callback) => {
          const fakeTx = {
            select: vi.fn().mockReturnValue({
              from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([]),
                }),
              }),
            }),
            insert: vi.fn().mockImplementation(() => ({
              values: vi.fn().mockImplementation((val) => {
                if (val.designSnapshotJson) {
                  capturedSnapshotRaw = val.designSnapshotJson;
                }
                return {
                  returning: vi.fn().mockResolvedValue([val]),
                };
              }),
            })),
            delete: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue({}),
            }),
          };
          return callback(fakeTx);
        }),
      };

      ordersService = new OrdersService(mockDbService);

      const designSnapshot = {
        name: 'Vance Capital Executive NFC Card',
        frontCanvasJson: { version: '5.3.0', objects: [{ type: 'i-text', text: 'ALEXANDER VANCE' }] },
        backCanvasJson: { version: '5.3.0', objects: [{ type: 'image', src: 'qr.png' }] },
        material: 'metal',
      };

      const orderData: CreateOrderDto = {
        productId: 'prod_pvc_black',
        cardMaterial: 'metal',
        quantity: 1,
        designSnapshot,
        shippingAddress: sampleAddress,
      };

      await ordersService.createOrder(mockActor, orderData);

      expect(capturedSnapshotRaw).toBeDefined();
      const parsedSnapshot = JSON.parse(capturedSnapshotRaw);
      expect(parsedSnapshot.name).toBe('Vance Capital Executive NFC Card');
      expect(parsedSnapshot.frontCanvasJson.objects[0].text).toBe('ALEXANDER VANCE');
    });
  });

  describe('Payment Verification & Simulation', () => {
    it('verifies Razorpay online payment and transitions status to ORDER_CONFIRMED', async () => {
      const mockOrder = {
        id: 'ord_rzp_123',
        userId: mockActor.userId,
        totalAmount: 1868,
        orderStatus: 'PAYMENT_PENDING',
        paymentStatus: 'PENDING',
      };

      let updatedOrderData: any = null;

      mockDbService = {
        withActor: vi.fn().mockImplementation((actor, callback) => {
          const fakeTx = {
            select: vi.fn().mockReturnValue({
              from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([mockOrder]),
                }),
              }),
            }),
            update: vi.fn().mockImplementation(() => ({
              set: vi.fn().mockImplementation((data) => {
                if (data.orderStatus) {
                  updatedOrderData = data;
                }
                return {
                  where: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ ...mockOrder, ...data }]),
                  }),
                };
              }),
            })),
            insert: vi.fn().mockReturnValue({
              values: vi.fn().mockResolvedValue({}),
            }),
          };
          return callback(fakeTx);
        }),
      };

      ordersService = new OrdersService(mockDbService);

      process.env.RAZORPAY_KEY_SECRET = 'test_rzp_secret_123';
      const validSignature = crypto
        .createHmac('sha256', 'test_rzp_secret_123')
        .update('order_test_123|pay_test_456')
        .digest('hex');

      const result = await ordersService.verifyPayment('ord_rzp_123', mockActor, {
        paymentMethod: 'razorpay',
        razorpay_order_id: 'order_test_123',
        razorpay_payment_id: 'pay_test_456',
        razorpay_signature: validSignature,
      });

      expect(result).toBeDefined();
      expect(updatedOrderData.orderStatus).toBe('ORDER_CONFIRMED');
      expect(updatedOrderData.paymentStatus).toBe('PAID');
      expect(updatedOrderData.paymentReference).toBe('pay_test_456');
    });

    it('handles UPI simulator SUCCESS status and confirms order', async () => {
      process.env.NODE_ENV = 'test';
      process.env.ALLOW_UPI_TEST_SIMULATOR = 'true';
      const mockOrder = {
        id: 'ord_upi_123',
        userId: mockActor.userId,
        totalAmount: 1868,
        orderStatus: 'PAYMENT_PENDING',
        paymentStatus: 'PENDING',
      };

      let updatedOrderData: any = null;

      mockDbService = {
        withActor: vi.fn().mockImplementation((actor, callback) => {
          const fakeTx = {
            select: vi.fn().mockReturnValue({
              from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([mockOrder]),
                }),
              }),
            }),
            update: vi.fn().mockImplementation(() => ({
              set: vi.fn().mockImplementation((data) => {
                if (data.orderStatus) {
                  updatedOrderData = data;
                }
                return {
                  where: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ ...mockOrder, ...data }]),
                  }),
                };
              }),
            })),
            insert: vi.fn().mockReturnValue({
              values: vi.fn().mockResolvedValue({}),
            }),
          };
          return callback(fakeTx);
        }),
      };

      ordersService = new OrdersService(mockDbService);

      const result = await ordersService.verifyPayment('ord_upi_123', mockActor, {
        paymentMethod: 'upi',
        simulationStatus: 'SUCCESS',
        upiRef: 'UPI-SUCCESS-999',
      });

      expect(result).toBeDefined();
      expect(updatedOrderData.orderStatus).toBe('ORDER_CONFIRMED');
      expect(updatedOrderData.paymentStatus).toBe('PAID');
    });
  });

  describe('Order Cancellation Security', () => {
    it('prevents cancellation once manufacturing or production has commenced', async () => {
      const manufacturingOrder = {
        id: 'ord_in_production',
        userId: mockActor.userId,
        orderStatus: 'CARD_PRODUCTION',
        paymentStatus: 'PAID',
      };

      mockDbService = {
        withActor: vi.fn().mockImplementation((actor, callback) => {
          const fakeTx = {
            select: vi.fn().mockReturnValue({
              from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([manufacturingOrder]),
                }),
              }),
            }),
          };
          return callback(fakeTx);
        }),
      };

      ordersService = new OrdersService(mockDbService);

      await expect(
        ordersService.cancelOrder('ord_in_production', mockActor, 'Changed mind'),
      ).rejects.toThrow('Order cannot be cancelled once manufacturing has commenced.');
    });
  });
});
