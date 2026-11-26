import * as fs from 'fs';
import * as path from 'path';
import postgres from 'postgres';

interface SeedProductDef {
  id: string;
  name: string;
  slug: string;
  description: string;
  material: 'pvc' | 'metal';
  colorName: string;
  color: string;
  basePrice: number;
  sku: string;
  finish: string;
  imageUrl: string;
  themeConfig: {
    background: string;
    primaryText: string;
    secondaryText: string;
    accent: string;
    borderColor: string;
    qrColor: string;
  };
}

export const SIX_NFC_PRODUCTS: SeedProductDef[] = [
  {
    id: 'prod_pvc_black',
    name: 'PVC NFC Card — Black',
    slug: 'pvc-nfc-card-black',
    description:
      'Pure solid black ISO CR80 PVC contactless smart card with NXP NTAG213 chip and crisp white/gold custom typography.',
    material: 'pvc',
    colorName: 'Black',
    color: '#000000',
    basePrice: 1499,
    sku: 'TAP-PVC-BLK',
    finish: 'solid-matte',
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
  {
    id: 'prod_pvc_white',
    name: 'PVC NFC Card — White',
    slug: 'pvc-nfc-card-white',
    description:
      'Pure solid white ISO CR80 PVC contactless smart card with NXP NTAG213 chip and high-contrast dark typography.',
    material: 'pvc',
    colorName: 'White',
    color: '#FFFFFF',
    basePrice: 1499,
    sku: 'TAP-PVC-WHT',
    finish: 'solid-matte',
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
  {
    id: 'prod_metal_black',
    name: 'Metal NFC Card — Black',
    slug: 'metal-nfc-card-black',
    description:
      'Precision-crafted solid black metal contactless smart card with anti-metal shielding, NTAG213 chip, and white/gold typography.',
    material: 'metal',
    colorName: 'Black',
    color: '#000000',
    basePrice: 2499,
    sku: 'TAP-MTL-BLK',
    finish: 'anodized-matte',
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
  {
    id: 'prod_metal_silver',
    name: 'Metal NFC Card — Silver',
    slug: 'metal-nfc-card-silver',
    description:
      'Precision-crafted solid silver metal contactless smart card with anti-metal shielding, NTAG213 chip, and dark silver typography.',
    material: 'metal',
    colorName: 'Silver',
    color: '#C0C0C0',
    basePrice: 2499,
    sku: 'TAP-MTL-SLV',
    finish: 'solid-silver',
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
  {
    id: 'prod_metal_gold',
    name: 'Metal NFC Card — Gold',
    slug: 'metal-nfc-card-gold',
    description:
      'Precision-crafted solid gold metal contactless smart card with anti-metal shielding, NTAG213 chip, and deep gold/black typography.',
    material: 'metal',
    colorName: 'Gold',
    color: '#D4AF37',
    basePrice: 2499,
    sku: 'TAP-MTL-GLD',
    finish: 'solid-gold',
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
  {
    id: 'prod_metal_rose_gold',
    name: 'Metal NFC Card — Rose Gold',
    slug: 'metal-nfc-card-rose-gold',
    description:
      'Precision-crafted solid rose gold metal contactless smart card with anti-metal shielding, NTAG213 chip, and crisp white/dark typography.',
    material: 'metal',
    colorName: 'Rose Gold',
    color: '#B76E79',
    basePrice: 2499,
    sku: 'TAP-MTL-RSG',
    finish: 'solid-rose-gold',
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
];

/**
 * Idempotent Six-Product NFC Catalog Seed
 * Safely migrates obsolete catalog references without deleting customer accounts, orders, or NFC registrations.
 */
async function main() {
  const envPath = path.resolve(process.cwd(), '.env');
  const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const match =
    envContent.match(/DATABASE_URL_DIRECT=(.+)/) || envContent.match(/DATABASE_URL=(.+)/);
  const connectionString =
    process.env.DATABASE_URL_DIRECT ||
    process.env.DATABASE_URL ||
    (match ? match[1].trim().replace(/^"|"$/g, '') : '');

  if (!connectionString) {
    throw new Error('DATABASE_URL or DATABASE_URL_DIRECT is required.');
  }

  const sql = postgres(connectionString, {
    prepare: false,
    ssl: 'require',
    connect_timeout: 15,
  });

  try {
    for (const migFile of [
      '0023_fresh_solid_nfc_catalog.sql',
      '0024_six_independent_nfc_products.sql',
    ]) {
      const migrationPath = path.resolve(process.cwd(), `src/database/migrations/${migFile}`);
      if (fs.existsSync(migrationPath)) {
        await sql.unsafe(fs.readFileSync(migrationPath, 'utf8'));
      }
    }

    await sql.begin(async (tx) => {
      // 1. Upsert all 6 independent products
      for (const p of SIX_NFC_PRODUCTS) {
        await tx`
          INSERT INTO "card_products" (
            "id", "name", "slug", "description", "base_price", "discount_price",
            "canvas_width", "canvas_height", "safe_zone", "bleed_zone",
            "supported_sides", "mockup_type", "material", "color_name", "color",
            "theme_config", "image_url", "is_active"
          ) VALUES (
            ${p.id},
            ${p.name},
            ${p.slug},
            ${p.description},
            ${p.basePrice},
            NULL,
            1050,
            600,
            40,
            25,
            'FRONT_AND_BACK',
            'CARD_3D',
            ${p.material},
            ${p.colorName},
            ${p.color},
            ${JSON.stringify(p.themeConfig)}::jsonb,
            ${p.imageUrl},
            true
          )
          ON CONFLICT ("id") DO UPDATE SET
            "name" = EXCLUDED."name",
            "slug" = EXCLUDED."slug",
            "description" = EXCLUDED."description",
            "base_price" = EXCLUDED."base_price",
            "discount_price" = EXCLUDED."discount_price",
            "material" = EXCLUDED."material",
            "color_name" = EXCLUDED."color_name",
            "color" = EXCLUDED."color",
            "theme_config" = EXCLUDED."theme_config",
            "image_url" = EXCLUDED."image_url",
            "is_active" = EXCLUDED."is_active",
            "updated_at" = now()
        `;

        // Keep 1:1 default variant record per product for foreign key compatibility
        await tx`
          INSERT INTO "card_product_variants" (
            "id", "product_id", "name", "color", "finish", "price", "sku", "image_url", "theme_config"
          ) VALUES (
            ${`var_${p.id.replace('prod_', '')}`},
            ${p.id},
            ${p.colorName},
            ${p.color},
            ${p.finish},
            ${p.basePrice},
            ${p.sku},
            ${p.imageUrl},
            ${JSON.stringify(p.themeConfig)}::jsonb
          )
          ON CONFLICT ("id") DO UPDATE SET
            "product_id" = EXCLUDED."product_id",
            "name" = EXCLUDED."name",
            "color" = EXCLUDED."color",
            "finish" = EXCLUDED."finish",
            "price" = EXCLUDED."price",
            "sku" = EXCLUDED."sku",
            "image_url" = EXCLUDED."image_url",
            "theme_config" = EXCLUDED."theme_config"
        `;
      }

      // 2. Safely remap obsolete catalog IDs on any existing orders, designs, cart items, or purchased cards
      const legacyProductRemap: Array<[string, string]> = [
        ['prod_pvc_nfc', 'prod_pvc_black'],
        ['prod_metal_nfc', 'prod_metal_black'],
      ];

      for (const [oldId, newId] of legacyProductRemap) {
        await tx`UPDATE "order_items" SET "product_id" = ${newId} WHERE "product_id" = ${oldId}`;
        await tx`UPDATE "purchased_cards" SET "product_id" = ${newId} WHERE "product_id" = ${oldId}`;
        await tx`UPDATE "cart_items" SET "product_id" = ${newId} WHERE "product_id" = ${oldId}`;
        await tx`UPDATE "card_designs" SET "product_id" = ${newId} WHERE "product_id" = ${oldId}`;
      }

      // 3. Remove obsolete product & variant records (keeping only the 6 products)
      const validIds = SIX_NFC_PRODUCTS.map((p) => p.id);
      const validVariantIds = SIX_NFC_PRODUCTS.map((p) => `var_${p.id.replace('prod_', '')}`);

      await tx`
        DELETE FROM "card_product_variants"
        WHERE NOT ("id" = ANY(${validVariantIds}::text[]))
      `;
      await tx`
        DELETE FROM "card_products"
        WHERE NOT ("id" = ANY(${validIds}::text[]))
      `;
    });

    const [{ count: productCount }] = await sql`SELECT COUNT(*)::int AS count FROM "card_products" WHERE "is_active" = true`;
    const [{ count: userCount }] = await sql`SELECT COUNT(*)::int AS count FROM "users"`;
    const [{ count: orderCount }] = await sql`SELECT COUNT(*)::int AS count FROM "orders"`;
    const [{ count: regCount }] = await sql`SELECT COUNT(*)::int AS count FROM "purchased_cards"`;

    console.log(
      `[Seed] 6-product catalog active=${productCount}, preserved users=${userCount}, orders=${orderCount}, purchased_cards=${regCount}`,
    );
  } finally {
    await sql.end();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[Seed] Failed:', err);
    process.exit(1);
  });
}
