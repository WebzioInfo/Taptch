import { db } from '@/db';
import { campaignProducts, campaignSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { INSTAGRAM_CAMPAIGN_CONFIG } from '../config';
import type { PriceBreakdown, DesignOption } from '../types';

export class ProductNotFoundError extends Error {
  constructor(productId: string) {
    super(`Campaign product "${productId}" was not found or is inactive.`);
    this.name = 'ProductNotFoundError';
  }
}

export class CampaignInactiveError extends Error {
  constructor() {
    super('The Instagram Card Campaign is currently paused or inactive.');
    this.name = 'CampaignInactiveError';
  }
}

/**
 * Ensures initial default settings and product catalog exist in the database (Idempotent)
 */
export async function ensureCampaignSeeded(): Promise<void> {
  const [existingSettings] = await db
    .select({ id: campaignSettings.id })
    .from(campaignSettings)
    .where(eq(campaignSettings.campaignKey, INSTAGRAM_CAMPAIGN_CONFIG.key))
    .limit(1);

  if (!existingSettings) {
    await db.insert(campaignSettings).values({
      id: `cset_${Date.now()}`,
      campaignKey: INSTAGRAM_CAMPAIGN_CONFIG.key,
      title: INSTAGRAM_CAMPAIGN_CONFIG.title,
      status: 'ACTIVE',
      supportWhatsapp: INSTAGRAM_CAMPAIGN_CONFIG.defaults.supportWhatsapp,
      designerWhatsapp: INSTAGRAM_CAMPAIGN_CONFIG.defaults.designerWhatsapp,
      designerFee: INSTAGRAM_CAMPAIGN_CONFIG.defaults.designerFee,
      standardShippingFee: INSTAGRAM_CAMPAIGN_CONFIG.defaults.standardShippingFee,
      expressShippingFee: INSTAGRAM_CAMPAIGN_CONFIG.defaults.expressShippingFee,
      taxRatePercent: String(INSTAGRAM_CAMPAIGN_CONFIG.defaults.taxRatePercent),
    });
  }

  const existingProducts = await db
    .select({ id: campaignProducts.id, slug: campaignProducts.slug })
    .from(campaignProducts)
    .where(eq(campaignProducts.campaignKey, INSTAGRAM_CAMPAIGN_CONFIG.key));

  if (existingProducts.length === 0) {
    await db.insert(campaignProducts).values([
      {
        id: 'prod_ig_matte_pvc',
        campaignKey: INSTAGRAM_CAMPAIGN_CONFIG.key,
        name: 'Matte Black PVC Instagram NFC Card',
        slug: 'matte-pvc-card',
        material: 'PVC',
        chipType: 'NTAG216',
        description: 'Waterproof matte black PVC card with NTAG216 high-memory NFC chip and high-resolution UV print.',
        basePrice: 499, // ₹499
        manufacturingCost: 120,
        packagingCost: 30,
        stockAvailable: 250,
        imageUrl: '/branding/cards/matte-pvc-mockup.png',
        isActive: true,
      },
      {
        id: 'prod_ig_stainless_steel',
        campaignKey: INSTAGRAM_CAMPAIGN_CONFIG.key,
        name: 'Stainless Steel Executive Instagram Card',
        slug: 'stainless-steel-card',
        material: 'METAL',
        chipType: 'NTAG216',
        description: '24g weighted stainless steel core with anti-metal ferrite shielding layer and laser engraving.',
        basePrice: 1499, // ₹1,499
        manufacturingCost: 450,
        packagingCost: 50,
        stockAvailable: 100,
        imageUrl: '/branding/cards/stainless-metal-mockup.png',
        isActive: true,
      },
      {
        id: 'prod_ig_natural_bamboo',
        campaignKey: INSTAGRAM_CAMPAIGN_CONFIG.key,
        name: 'Natural Bamboo Eco Instagram Card',
        slug: 'natural-bamboo-card',
        material: 'BAMBOO',
        chipType: 'NTAG216',
        description: 'Sustainable organic bamboo wood card with deep laser-etched Instagram mark and embedded NFC tag.',
        basePrice: 899, // ₹899
        manufacturingCost: 240,
        packagingCost: 30,
        stockAvailable: 150,
        imageUrl: '/branding/cards/bamboo-wood-mockup.png',
        isActive: true,
      },
    ]);
  }
}

/**
 * Backend Authoritative Pricing Calculator
 * Prevents client-side price tampering. Calculates subtotal, designer fees, shipping, tax, and final amount.
 */
export async function calculateOrderPricing(
  productId: string,
  quantity: number,
  designOption: DesignOption,
  isExpressShipping = false
): Promise<PriceBreakdown & { product: typeof campaignProducts.$inferSelect }> {
  await ensureCampaignSeeded();

  const [settings] = await db
    .select()
    .from(campaignSettings)
    .where(eq(campaignSettings.campaignKey, INSTAGRAM_CAMPAIGN_CONFIG.key))
    .limit(1);

  if (settings && settings.status !== 'ACTIVE') {
    throw new CampaignInactiveError();
  }

  const [product] = await db
    .select()
    .from(campaignProducts)
    .where(eq(campaignProducts.id, productId))
    .limit(1);

  if (!product || !product.isActive) {
    throw new ProductNotFoundError(productId);
  }

  const qty = Math.max(1, Math.min(50, Math.floor(quantity)));
  const unitPrice = product.basePrice;
  const productSubtotal = unitPrice * qty;

  // Customization fee: Option A (DIY) is ₹0; Option B (Assign Designer) is admin-configured fee (e.g. ₹200)
  const designerFee = designOption === 'DESIGNER' ? (settings?.designerFee ?? 200) : 0;
  const customizationFee = 0; // Predefined in base/designer options

  // Shipping fee
  const shippingFee = isExpressShipping 
    ? (settings?.expressShippingFee ?? 150)
    : (settings?.standardShippingFee ?? 60);

  // Tax computation (GST 18% inclusive or additive; here standard enterprise GST additive on taxable amount)
  const taxableAmount = productSubtotal + designerFee + customizationFee + shippingFee;
  const taxRate = settings ? Number(settings.taxRatePercent) / 100 : 0.18;
  const taxAmount = Math.round(taxableAmount * taxRate);

  const discountAmount = 0;
  const totalAmount = taxableAmount + taxAmount - discountAmount;

  return {
    unitPrice,
    quantity: qty,
    productSubtotal,
    customizationFee,
    designerFee,
    shippingFee,
    discountAmount,
    taxAmount,
    totalAmount,
    product,
  };
}

