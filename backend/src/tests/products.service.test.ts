import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from '../modules/products/products.service';

describe('ProductsService — Catalog, Slug Lookup & 404 Enforcement', () => {
  let service: ProductsService;
  let mockDbService: any;

  beforeEach(() => {
    mockDbService = {
      db: {
        select: vi.fn(),
      },
    };
    service = new ProductsService(mockDbService);
  });

  it('findAll should return enriched active products with their variants', async () => {
    const dbProducts = [
      {
        id: 'prod_classic_pvc',
        name: 'Classic White PVC NFC Card',
        slug: 'classic-white-pvc-nfc-card',
        description: 'Crisp white PVC card',
        basePrice: 1499,
        discountPrice: null,
        canvasWidth: 1050,
        canvasHeight: 600,
        supportedSides: 'FRONT_AND_BACK',
        isActive: true,
      },
    ];
    const dbVariants = [
      {
        id: 'var_white_matte',
        productId: 'prod_classic_pvc',
        name: 'Bright White Matte',
        color: '#FAF8F5',
        finish: 'matte',
        price: 1499,
      },
    ];

    mockDbService.db.select
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(dbProducts),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockResolvedValue(dbVariants),
      });

    const result = await service.findAll();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('prod_classic_pvc');
    expect(result[0].variants).toHaveLength(1);
    expect(result[0].category).toBe('PVC NFC Cards');
    expect(result[0].inStock).toBe(true);
  });

  it('findOne should throw NotFoundException (404) for an unknown product ID or slug', async () => {
    mockDbService.db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    await expect(service.findOne('non-existent-product-slug')).rejects.toThrow(NotFoundException);
  });
});
