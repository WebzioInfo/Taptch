import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductsService, SEEDED_CARD_PRODUCTS } from '../modules/products/products.service';
import { DesignsService } from '../modules/designs/designs.service';
import { UploadsService } from '../modules/uploads/uploads.service';
import { CartService } from '../modules/cart/cart.service';
import { OrdersService, type CreateOrderDto } from '../modules/orders/orders.service';
import type { ActorContext } from '../common/types';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('Taptch Live NFC Card Design Studio — Backend Services', () => {
  let mockDbService: any;
  const mockActor: ActorContext = {
    userId: 'user_test_123',
    orgId: null,
    role: 'user',
    isAdmin: false,
  };

  beforeEach(() => {
    const limitMock = vi.fn().mockResolvedValue([]);
    const returningMock = vi.fn().mockResolvedValue([{ id: 'test_record_01' }]);

    const chainableValues: any = {
      returning: returningMock,
      onConflictDoNothing: vi.fn().mockResolvedValue([]),
    };

    const chainableOrderBy: any = Object.assign(Promise.resolve([]), {
      limit: limitMock,
    });

    mockDbService = {
      db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockImplementation(() => chainableOrderBy),
        limit: limitMock,
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnValue(chainableValues),
        returning: returningMock,
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

  describe('DesignsService', () => {
    it('creates a new draft with sanitized fields and isolated customerId', async () => {
      const expectedRecord = {
        id: 'des_new_456',
        customerId: mockActor.userId,
        name: 'Alexander Obsidian Card',
        isDraft: true,
      };

      mockDbService.db.values.mockReturnValue({
        returning: vi.fn().mockResolvedValue([expectedRecord]),
        onConflictDoNothing: vi.fn().mockResolvedValue([]),
      });

      const service = new DesignsService(mockDbService);
      const draft = await service.upsertDraft(mockActor, {
        name: 'Alexander Obsidian Card',
        productId: 'prod_matte_obsidian',
        frontCanvasJson: { objects: [] },
        backCanvasJson: { objects: [] },
        previewUrl: 'data:image/png;base64,front_mock_url',
        backPreviewUrl: 'data:image/png;base64,back_mock_url',
      });

      expect(draft).toEqual(expectedRecord);
      expect(mockDbService.withActor).toHaveBeenCalledWith(mockActor, expect.any(Function));
    });

    it('updates existing draft when matching draft record is found', async () => {
      const existingDraft = {
        id: 'des_existing_789',
        customerId: mockActor.userId,
        productId: 'prod_classic_pvc',
        name: 'Draft V1',
        variantId: null,
        templateId: null,
      };

      const updatedDraft = {
        ...existingDraft,
        name: 'Draft V2 Updated',
      };

      // Mock limit to return existing draft on the draft lookup query
      mockDbService.db.limit
        .mockResolvedValueOnce([{ id: 'prod_classic_pvc' }]) // prod check
        .mockResolvedValueOnce([existingDraft]); // draft check

      mockDbService.db.returning.mockResolvedValue([updatedDraft]);

      const service = new DesignsService(mockDbService);
      const res = await service.upsertDraft(mockActor, {
        designId: 'des_existing_789',
        name: 'Draft V2 Updated',
        productId: 'prod_classic_pvc',
        frontCanvasJson: '{"objects":[{"type":"text"}]}',
      });

      expect(res).toEqual(updatedDraft);
      expect(mockDbService.db.update).toHaveBeenCalled();
    });

    it('defensively handles unknown product, variant, and custom template without crashing', async () => {
      // Return empty array for product, variant, and template lookups
      mockDbService.db.limit.mockResolvedValue([]);

      const createdRecord = {
        id: 'des_fallback_111',
        customerId: mockActor.userId,
        productId: 'prod_classic_pvc',
        isDraft: true,
      };

      mockDbService.db.values.mockReturnValue({
        returning: vi.fn().mockResolvedValue([createdRecord]),
        onConflictDoNothing: vi.fn().mockResolvedValue([]),
      });

      const service = new DesignsService(mockDbService);
      const draft = await service.upsertDraft(mockActor, {
        name: 'Safe Card',
        productId: 'unknown_product_999',
        templateId: 'custom',
        variantId: 'unknown_variant_888',
        frontCanvasJson: '{}',
      });

      expect(draft).toBeDefined();
      expect(draft.id).toBe('des_fallback_111');
    });

    it('enforces customer authorization in findOne', async () => {
      const otherUserDesign = {
        id: 'des_other_user',
        customerId: 'user_stranger_999',
        name: 'Secret Card',
      };

      mockDbService.db.where.mockReturnValueOnce([otherUserDesign]);

      const service = new DesignsService(mockDbService);
      await expect(service.findOne(mockActor, 'des_other_user')).rejects.toThrow(
        ForbiddenException
      );
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

      const orderData: CreateOrderDto = {
        shippingAddress: {
          fullName: 'Alexander Vance',
          addressLine1: '100 Silicon Boulevard',
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
