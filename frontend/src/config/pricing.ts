export type CardMaterial = 'pvc' | 'matte' | 'wood' | 'metal';

export interface CardPricingBreakdown {
  materialRate: number;
  designRate: number;
  combinedPrice: number;
}

/**
 * Base Material Rates (Physical NFC Card Blanks)
 * Maintained separately internally.
 */
export const MATERIAL_RATES: Record<CardMaterial, number> = {
  pvc: 1099,
  matte: 1099,
  wood: 1499,
  metal: 1999,
};

/**
 * Default Design Customization Rate (Layout, Typography, Vector Stamping)
 * Maintained separately internally.
 */
export const DEFAULT_DESIGN_RATES: Record<CardMaterial, number> = {
  pvc: 400,
  matte: 400,
  wood: 500,
  metal: 500,
};

/**
 * Calculate the combined customer-facing price:
 * Combined Price = Material Rate + Design Rate
 * The customer only sees this single combined total.
 */
export function getCardPricing(material: CardMaterial = 'pvc'): CardPricingBreakdown {
  const materialRate = MATERIAL_RATES[material] ?? 1099;
  const designRate = DEFAULT_DESIGN_RATES[material] ?? 400;
  const combinedPrice = materialRate + designRate;

  return {
    materialRate,
    designRate,
    combinedPrice,
  };
}
