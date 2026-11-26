import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';
import { eq, or, and } from 'drizzle-orm';

export interface VariantThemeConfig {
  background: string;
  primaryText: string;
  secondaryText: string;
  accent: string;
  borderColor: string;
  qrColor: string;
}

export interface SeededCardProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  material: 'pvc' | 'metal';
  colorName: string;
  color: string;
  themeConfig: VariantThemeConfig;
  basePrice: number;
  canvasWidth: number;
  canvasHeight: number;
  safeZone: number;
  bleedZone: number;
  supportedSides: string;
  mockupType: string;
  imageUrl?: string;
  variants: Array<{
    id: string;
    name: string;
    color: string;
    finish: string;
    price: number;
    sku?: string;
    imageUrl?: string;
    themeConfig?: VariantThemeConfig;
  }>;
}

export const SEEDED_CARD_PRODUCTS: SeededCardProduct[] = [
  {
    id: 'prod_pvc_black',
    name: 'PVC NFC Card — Black',
    slug: 'pvc-nfc-card-black',
    description:
      'Pure solid black ISO CR80 PVC contactless smart card with NXP NTAG213 chip and crisp white/gold custom typography.',
    material: 'pvc',
    colorName: 'Black',
    color: '#000000',
    themeConfig: {
      background: '#000000',
      primaryText: '#FFFFFF',
      secondaryText: '#D4AF37',
      accent: '#D4AF37',
      borderColor: '#27272A',
      qrColor: '#FFFFFF',
    },
    basePrice: 1499,
    canvasWidth: 1050,
    canvasHeight: 600,
    safeZone: 40,
    bleedZone: 25,
    supportedSides: 'FRONT_AND_BACK',
    mockupType: 'CARD_3D',
    imageUrl: '/products/pvc-black.svg',
    variants: [
      {
        id: 'var_pvc_black',
        name: 'Black',
        color: '#000000',
        finish: 'solid-matte',
        price: 1499,
        sku: 'TAP-PVC-BLK',
        imageUrl: '/products/pvc-black.svg',
        themeConfig: {
          background: '#000000',
          primaryText: '#FFFFFF',
          secondaryText: '#D4AF37',
          accent: '#D4AF37',
          borderColor: '#27272A',
          qrColor: '#FFFFFF',
        },
      },
    ],
  },
  {
    id: 'prod_pvc_white',
    name: 'PVC NFC Card — White',
    slug: 'pvc-nfc-card-white',
    description:
      'Pure solid white ISO CR80 PVC contactless smart card with NXP NTAG213 chip and high-contrast dark typography.',
    material: 'pvc',
    colorName: 'White',
    color: '#FFFFFF',
    themeConfig: {
      background: '#FFFFFF',
      primaryText: '#111827',
      secondaryText: '#374151',
      accent: '#111827',
      borderColor: '#E5E7EB',
      qrColor: '#111827',
    },
    basePrice: 1499,
    canvasWidth: 1050,
    canvasHeight: 600,
    safeZone: 40,
    bleedZone: 25,
    supportedSides: 'FRONT_AND_BACK',
    mockupType: 'CARD_3D',
    imageUrl: '/products/pvc-white.svg',
    variants: [
      {
        id: 'var_pvc_white',
        name: 'White',
        color: '#FFFFFF',
        finish: 'solid-matte',
        price: 1499,
        sku: 'TAP-PVC-WHT',
        imageUrl: '/products/pvc-white.svg',
        themeConfig: {
          background: '#FFFFFF',
          primaryText: '#111827',
          secondaryText: '#374151',
          accent: '#111827',
          borderColor: '#E5E7EB',
          qrColor: '#111827',
        },
      },
    ],
  },
  {
    id: 'prod_metal_black',
    name: 'Metal NFC Card — Black',
    slug: 'metal-nfc-card-black',
    description:
      'Precision-crafted solid black metal contactless smart card with anti-metal shielding, NTAG213 chip, and white/gold typography.',
    material: 'metal',
    colorName: 'Black',
    color: '#000000',
    themeConfig: {
      background: '#000000',
      primaryText: '#FFFFFF',
      secondaryText: '#D4AF37',
      accent: '#D4AF37',
      borderColor: '#27272A',
      qrColor: '#D4AF37',
    },
    basePrice: 2499,
    canvasWidth: 1050,
    canvasHeight: 600,
    safeZone: 40,
    bleedZone: 25,
    supportedSides: 'FRONT_AND_BACK',
    mockupType: 'CARD_3D',
    imageUrl: '/products/metal-black.svg',
    variants: [
      {
        id: 'var_metal_black',
        name: 'Black',
        color: '#000000',
        finish: 'anodized-matte',
        price: 2499,
        sku: 'TAP-MTL-BLK',
        imageUrl: '/products/metal-black.svg',
        themeConfig: {
          background: '#000000',
          primaryText: '#FFFFFF',
          secondaryText: '#D4AF37',
          accent: '#D4AF37',
          borderColor: '#27272A',
          qrColor: '#D4AF37',
        },
      },
    ],
  },
  {
    id: 'prod_metal_silver',
    name: 'Metal NFC Card — Silver',
    slug: 'metal-nfc-card-silver',
    description:
      'Precision-crafted solid silver metal contactless smart card with anti-metal shielding, NTAG213 chip, and dark silver typography.',
    material: 'metal',
    colorName: 'Silver',
    color: '#C0C0C0',
    themeConfig: {
      background: '#C0C0C0',
      primaryText: '#111111',
      secondaryText: '#374151',
      accent: '#4B5563',
      borderColor: '#9CA3AF',
      qrColor: '#111111',
    },
    basePrice: 2499,
    canvasWidth: 1050,
    canvasHeight: 600,
    safeZone: 40,
    bleedZone: 25,
    supportedSides: 'FRONT_AND_BACK',
    mockupType: 'CARD_3D',
    imageUrl: '/products/metal-silver.svg',
    variants: [
      {
        id: 'var_metal_silver',
        name: 'Silver',
        color: '#C0C0C0',
        finish: 'solid-silver',
        price: 2499,
        sku: 'TAP-MTL-SLV',
        imageUrl: '/products/metal-silver.svg',
        themeConfig: {
          background: '#C0C0C0',
          primaryText: '#111111',
          secondaryText: '#374151',
          accent: '#4B5563',
          borderColor: '#9CA3AF',
          qrColor: '#111111',
        },
      },
    ],
  },
  {
    id: 'prod_metal_gold',
    name: 'Metal NFC Card — Gold',
    slug: 'metal-nfc-card-gold',
    description:
      'Precision-crafted solid gold metal contactless smart card with anti-metal shielding, NTAG213 chip, and deep gold/black typography.',
    material: 'metal',
    colorName: 'Gold',
    color: '#D4AF37',
    themeConfig: {
      background: '#D4AF37',
      primaryText: '#111111',
      secondaryText: '#292524',
      accent: '#78350F',
      borderColor: '#A16207',
      qrColor: '#111111',
    },
    basePrice: 2499,
    canvasWidth: 1050,
    canvasHeight: 600,
    safeZone: 40,
    bleedZone: 25,
    supportedSides: 'FRONT_AND_BACK',
    mockupType: 'CARD_3D',
    imageUrl: '/products/metal-gold.svg',
    variants: [
      {
        id: 'var_metal_gold',
        name: 'Gold',
        color: '#D4AF37',
        finish: 'solid-gold',
        price: 2499,
        sku: 'TAP-MTL-GLD',
        imageUrl: '/products/metal-gold.svg',
        themeConfig: {
          background: '#D4AF37',
          primaryText: '#111111',
          secondaryText: '#292524',
          accent: '#78350F',
          borderColor: '#A16207',
          qrColor: '#111111',
        },
      },
    ],
  },
  {
    id: 'prod_metal_rose_gold',
    name: 'Metal NFC Card — Rose Gold',
    slug: 'metal-nfc-card-rose-gold',
    description:
      'Precision-crafted solid rose gold metal contactless smart card with anti-metal shielding, NTAG213 chip, and crisp white/dark typography.',
    material: 'metal',
    colorName: 'Rose Gold',
    color: '#B76E79',
    themeConfig: {
      background: '#B76E79',
      primaryText: '#FFFFFF',
      secondaryText: '#4C0519',
      accent: '#4C0519',
      borderColor: '#9F525E',
      qrColor: '#FFFFFF',
    },
    basePrice: 2499,
    canvasWidth: 1050,
    canvasHeight: 600,
    safeZone: 40,
    bleedZone: 25,
    supportedSides: 'FRONT_AND_BACK',
    mockupType: 'CARD_3D',
    imageUrl: '/products/metal-rose-gold.svg',
    variants: [
      {
        id: 'var_metal_rose_gold',
        name: 'Rose Gold',
        color: '#B76E79',
        finish: 'solid-rose-gold',
        price: 2499,
        sku: 'TAP-MTL-RSG',
        imageUrl: '/products/metal-rose-gold.svg',
        themeConfig: {
          background: '#B76E79',
          primaryText: '#FFFFFF',
          secondaryText: '#4C0519',
          accent: '#4C0519',
          borderColor: '#9F525E',
          qrColor: '#FFFFFF',
        },
      },
    ],
  },
];

@Injectable()
export class ProductsService {
  constructor(private dbService: DatabaseService) { }

  private enrichProduct<T extends Record<string, any>>(product: T, variants: any[] = []) {
    const slugOrId = `${product.slug || ''} ${product.id || ''} ${product.name || ''}`.toLowerCase();
    const resolvedMaterial: 'pvc' | 'metal' =
      product.material === 'metal' ||
      slugOrId.includes('metal') ||
      slugOrId.includes('silver') ||
      slugOrId.includes('gold') ||
      slugOrId.includes('rose')
        ? 'metal'
        : 'pvc';
    const category = resolvedMaterial === 'metal' ? 'Metal NFC Cards' : 'PVC NFC Cards';
    const material = resolvedMaterial;
    const defaultVariant = variants[0];
    const color = product.color || defaultVariant?.color || '#000000';
    const colorName = product.colorName || defaultVariant?.name || 'Black';
    const themeConfig = product.themeConfig || defaultVariant?.themeConfig || null;

    const supportedSidesLabel =
      product.supportedSides === 'FRONT_ONLY' ? 'Front Side Only' : 'Front & Back Custom Print';

    return {
      ...product,
      variants,
      category,
      material,
      color,
      colorName,
      themeConfig,
      inStock: product.isActive !== false,
      features: [
        'Instant NFC contactless sharing (NTAG213)',
        'Dynamic QR code backup on card',
        'Compatible with iOS & Android (no app required)',
        `Customizable ${supportedSidesLabel.toLowerCase()}`,
        material === 'metal'
          ? 'Anti-metal ferrite shielding with laser engraving'
          : 'Water-resistant durable ISO CR80 card body',
      ],
      specifications: {
        dimensions: '85.6 × 53.98 mm (ISO/IEC 7810 ID-1)',
        canvasResolution: `${product.canvasWidth || 1050} × ${product.canvasHeight || 600} px`,
        printSides: supportedSidesLabel,
        nfcChip: 'NXP NTAG213 (13.56 MHz)',
        compatibility: 'iPhone (XS and newer) & NFC-enabled Android',
        material: material.toUpperCase(),
      },
    };
  }

  async findAll() {
    try {
      const rows = await this.dbService.db
        .select()
        .from(schema.cardProducts)
        .where(eq(schema.cardProducts.isActive, true));

      if (rows && rows.length > 0) {
        let allVariants: any[] = [];
        try {
          allVariants = await this.dbService.db.select().from(schema.cardProductVariants);
        } catch {
          allVariants = [];
        }

        return rows.map((p) =>
          this.enrichProduct(
            p,
            allVariants.filter((v) => v.productId === p.id),
          ),
        );
      }
    } catch {
      // Return seeded products if DB is unavailable
    }
    return SEEDED_CARD_PRODUCTS.map((p) => this.enrichProduct(p, p.variants || []));
  }

  async findOne(idOrSlug: string) {
    let hasDbCatalog = false;
    try {
      const [product] = await this.dbService.db
        .select()
        .from(schema.cardProducts)
        .where(
          and(
            or(eq(schema.cardProducts.id, idOrSlug), eq(schema.cardProducts.slug, idOrSlug)),
            eq(schema.cardProducts.isActive, true),
          ),
        )
        .limit(1);

      if (product) {
        const variants = await this.dbService.db
          .select()
          .from(schema.cardProductVariants)
          .where(eq(schema.cardProductVariants.productId, product.id));

        return this.enrichProduct(product, variants);
      }

      const anyRows = await this.dbService.db
        .select({ id: schema.cardProducts.id })
        .from(schema.cardProducts)
        .limit(1);
      hasDbCatalog = anyRows.length > 0;
    } catch {
      hasDbCatalog = false;
    }

    if (!hasDbCatalog) {
      const seeded = SEEDED_CARD_PRODUCTS.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
      if (seeded) return this.enrichProduct(seeded, seeded.variants || []);
    }

    throw new NotFoundException(`NFC card product "${idOrSlug}" not found.`);
  }

  async findTemplatesForProduct(productId: string) {
    try {
      const junctions = await this.dbService.db
        .select()
        .from(schema.cardProductTemplates)
        .where(eq(schema.cardProductTemplates.productId, productId));

      if (junctions && junctions.length > 0) {
        const templateIds = junctions.map((j) => j.templateId);
        const tpls = await this.dbService.db.select().from(schema.cardDesignTemplates);
        return tpls.filter((t) => templateIds.includes(t.id));
      }
    } catch (e) { }

    // Fallback default templates
    return [
      {
        id: 'tpl_executive_obsidian',
        name: 'Obsidian Executive',
        category: 'luxury',
        style: 'Minimal',
        previewUrl: '/branding/cards/default-card-preview.png',
        frontCanvasJson: JSON.stringify({
          version: '5.3.0',
          backgroundColor: '#0A0A0C',
          objects: [
            {
              type: 'rect',
              left: 0,
              top: 0,
              width: 1050,
              height: 600,
              fill: '#0A0A0C',
              selectable: false,
              evented: false,
              id: 'bg_base',
              name: 'Background Plate',
              isLocked: true,
            },
            {
              type: 'i-text',
              left: 80,
              top: 360,
              fill: '#FFFFFF',
              fontFamily: 'Inter',
              fontSize: 36,
              fontWeight: '700',
              charSpacing: 40,
              text: 'ALEXANDER VANCE',
              id: 'text_name',
              name: 'Full Name',
              styles: {},
            },
            {
              type: 'i-text',
              left: 80,
              top: 420,
              fill: '#D4AF37',
              fontFamily: 'Inter',
              fontSize: 18,
              fontWeight: '600',
              charSpacing: 60,
              text: 'MANAGING DIRECTOR',
              id: 'text_role',
              name: 'Job Title',
              styles: {},
            },
          ],
        }),
        backCanvasJson: JSON.stringify({
          version: '5.3.0',
          backgroundColor: '#0A0A0C',
          objects: [
            {
              type: 'rect',
              left: 0,
              top: 0,
              width: 1050,
              height: 600,
              fill: '#0A0A0C',
              selectable: false,
              evented: false,
              id: 'bg_base_back',
              name: 'Background Plate',
              isLocked: true,
            },
            {
              type: 'i-text',
              left: 1050 / 2 - 140,
              top: 500,
              fill: '#8C8C9A',
              fontFamily: 'Inter',
              fontSize: 14,
              fontWeight: '500',
              charSpacing: 80,
              text: 'TAP PHONE TO CONNECT',
              id: 'text_prompt',
              name: 'Tap Prompt',
              styles: {},
            },
          ],
        }),
      },
    ];
  }
}
