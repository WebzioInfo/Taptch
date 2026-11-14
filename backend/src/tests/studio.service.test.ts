import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductsService, SEEDED_CARD_PRODUCTS } from '../modules/products/products.service';
import { DesignsService } from '../modules/designs/designs.service';
import { UploadsService } from '../modules/uploads/uploads.service';
import { CartService } from '../modules/cart/cart.service';
import { OrdersService } from '../modules/orders/orders.service';
import type { ActorContext } from '../common/types';

describe('Taptch Live NFC Card Design Studio — Backend Services', () => {
  let mockDbService: any;
  const mockActor: ActorContext = {
    userId: 'user_test_123',
    email: 'alexander@example.com',
    role: 'user',
    organizationId: null,
    isAdmin: false,
  };

  beforeEach(() => {
    mockDbService = {
      db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
        limit: vi.fn().mockResolvedValue([]),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 'test_record_01' }]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
      },
      withActor: vi.fn((actor, fn) => fn(mockDbService.db)),
    };
  });

  describe('ProductsService', () => {
    it('returns seeded card products fallback with correct CR80 dimensions', async () => {
      const service = new ProductsService(mockDbService);
      const products = await service.findAll();
      expect(products.length).toBeGreaterThanOrEqual(1);

      const classic = products[0];
      expect(classic.canvasWidth).toBe(1050);
      expect(classic.canvasHeight).toBe(600);
      expect(classic.safeZone).toBe(40);
      expect(classic.bleedZone).toBe(25);
    });

    it('resolves product by ID and loads variants', async () => {
      const service = new ProductsService(mockDbService);
      const product = await service.findOne('prod_matte_obsidian');
      expect(product).toBeDefined();
      expect(product.slug).toBe('obsidian-matte-black-nfc-card');
      expect(product.variants).toBeDefined();
    });

    it('returns compatible starter templates for product', async () => {
      const service = new ProductsService(mockDbService);
      const templates = await service.findTemplatesForProduct('prod_classic_pvc');
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0].frontCanvasJson).toBeDefined();
      expect(templates[0].backCanvasJson).toBeDefined();
    });
  });

  describe('UploadsService', () => {
    it('generates cryptographic HMAC signature parameters for direct CDN upload', async () => {
      const service = new UploadsService(mockDbService);
      const res = await service.generateSignature(mockActor, 'image');

      expect(res.signature).toBeDefined();
      expect(res.timestamp).toBeGreaterThan(0);
      expect(res.folder).toContain('user_test_123');
      expect(res.apiKey).toBeDefined();
    });
  });

  describe('CartService', () => {
    it('calculates line totals, shipping, and order summary correctly', async () => {
      mockDbService.db.orderBy.mockResolvedValueOnce([
        {
          id: 'cart_01',
          customerId: mockActor.userId,
          productId: 'prod_classic_pvc',
          designId: 'des_01',
          quantity: 2,
        },
      ]);

      const service = new CartService(mockDbService);
      const summary = await service.getCart(mockActor);

      expect(summary.items).toHaveLength(1);
      expect(summary.items[0].quantity).toBe(2);
      expect(summary.subtotal).toBe(2998); // 1499 * 2
      expect(summary.shippingCost).toBe(0); // Subtotal > 2000 has free shipping
      expect(summary.total).toBe(2998);
    });
  });

  describe('OrdersService & Snapshot Freezing', () => {
    it('creates order request and executes transactional snapshot creation', async () => {
      const service = new OrdersService(mockDbService);

      const orderData = {
        shippingAddress: {
          recipientName: 'Alexander Vance',
          street: '100 Silicon Boulevard',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
          phone: '+91 9876543210',
        },
        cardMaterial: 'pvc',
        quantity: 1,
        designId: 'des_alexander_1',
      };

      const order = await service.createOrder(mockActor, orderData);
      expect(order).toBeDefined();
      expect(mockDbService.withActor).toHaveBeenCalled();
    });
  });
});
