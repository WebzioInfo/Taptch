import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';
import { eq } from 'drizzle-orm';

export interface SeededCardProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  canvasWidth: number;
  canvasHeight: number;
  safeZone: number;
  bleedZone: number;
  supportedSides: string;
  mockupType: string;
  variants: Array<{
    id: string;
    name: string;
    color: string;
    finish: string;
    price: number;
  }>;
}

export const SEEDED_CARD_PRODUCTS: SeededCardProduct[] = [
  {
    id: 'prod_classic_pvc',
    name: 'Classic White PVC NFC Card',
    slug: 'classic-white-pvc-nfc-card',
    description: 'Crisp white matte finish premium PVC smart contactless card with high-performance NTAG213 microchip.',
    basePrice: 1299,
    canvasWidth: 1050,
    canvasHeight: 600,
    safeZone: 40,
    bleedZone: 25,
    supportedSides: 'FRONT_AND_BACK',
    mockupType: 'CARD_3D',
    variants: [
      { id: 'var_white_matte', name: 'Bright White Matte', color: '#FAF8F5', finish: 'matte', price: 1299 },
      { id: 'var_white_gloss', name: 'Reflective Gloss', color: '#FFFFFF', finish: 'gloss', price: 1399 },
    ],
  },
  {
    id: 'prod_matte_obsidian',
    name: 'Obsidian Matte Black NFC Card',
    slug: 'obsidian-matte-black-nfc-card',
    description: 'Deep obsidian charcoal velvet-touch smart card featuring precision gold contactless foil and NTAG213 chip.',
    basePrice: 1499,
    canvasWidth: 1050,
    canvasHeight: 600,
    safeZone: 40,
    bleedZone: 25,
    supportedSides: 'FRONT_AND_BACK',
    mockupType: 'CARD_3D',
    variants: [
      { id: 'var_matte_black', name: 'Matte Charcoal Black', color: '#0A0A0C', finish: 'matte', price: 1499 },
      { id: 'var_gold_accent', name: 'Brushed Metallic Gold Accent', color: '#D4AF37', finish: 'metallic', price: 1799 },
    ],
  },
  {
    id: 'prod_brushed_metal',
    name: 'Executive Brushed Metal Card',
    slug: 'executive-brushed-metal-card',
    description: 'CNC-machined aerospace grade titanium and steel alloy contactless executive card with laser engraving.',
    basePrice: 2999,
    canvasWidth: 1050,
    canvasHeight: 600,
    safeZone: 40,
    bleedZone: 25,
    supportedSides: 'FRONT_AND_BACK',
    mockupType: 'CARD_3D',
    variants: [
      { id: 'var_raw_steel', name: 'Raw Stainless Steel', color: '#C4C4CC', finish: 'brushed', price: 2999 },
      { id: 'var_black_titanium', name: 'Matte Black Titanium', color: '#16161B', finish: 'pvd', price: 3499 },
    ],
  },
];

@Injectable()
export class ProductsService {
  constructor(private dbService: DatabaseService) { }

  async findAll() {
    try {
      const rows = await this.dbService.db.select().from(schema.cardProducts);
      if (rows && rows.length > 0) {
        return rows;
      }
    } catch (e) {
      // Return seeded products if table is being populated
    }
    return SEEDED_CARD_PRODUCTS;
  }

  async findOne(id: string) {
    try {
      const [product] = await this.dbService.db
        .select()
        .from(schema.cardProducts)
        .where(eq(schema.cardProducts.id, id));

      if (product) {
        const variants = await this.dbService.db
          .select()
          .from(schema.cardProductVariants)
          .where(eq(schema.cardProductVariants.productId, id));

        return { ...product, variants };
      }
    } catch (e) {
      // Fallback to seeded
    }

    const seeded = SEEDED_CARD_PRODUCTS.find((p) => p.id === id || p.slug === id);
    if (seeded) return seeded;

    return SEEDED_CARD_PRODUCTS[0];
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
