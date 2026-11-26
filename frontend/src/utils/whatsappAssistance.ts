import { defaultBrandConfig } from '../config/brand';

export const WHATSAPP_SUPPORT_NUMBER = '918089864422';

export interface StudioDesignAssistanceParams {
  productName?: string | null;
  variantName?: string | null;
  templateName?: string | null;
}

export interface OrderDesignAssistanceParams {
  orderId?: string | null;
  productName?: string | null;
  variantName?: string | null;
}

/**
 * Builds the prefilled WhatsApp message for Design Studio assistance,
 * gracefully handling missing optional product, variant, or template details.
 */
export function buildStudioDesignAssistanceMessage({
  productName,
  variantName,
  templateName,
}: StudioDesignAssistanceParams): string {
  const lines: string[] = [
    `Hi ${defaultBrandConfig.name} Team! I need assistance with designing my NFC card.`,
    '',
    `Product: ${productName?.trim() || 'NFC Card'}`,
  ];

  if (variantName?.trim()) {
    lines.push(`Variant: ${variantName.trim()}`);
  }
  if (templateName?.trim()) {
    lines.push(`Design Template: ${templateName.trim()}`);
  }

  lines.push('', 'Please help me customize my card.');
  return lines.join('\n');
}

/**
 * Builds the prefilled WhatsApp message for an existing order's NFC card design assistance.
 */
export function buildOrderDesignAssistanceMessage({
  orderId,
  productName,
  variantName,
}: OrderDesignAssistanceParams): string {
  const lines: string[] = [
    `Hi ${defaultBrandConfig.name} Team! I need assistance with the design of my ordered NFC card.`,
    '',
    `Order ID: ${orderId?.trim() || 'N/A'}`,
    `Product: ${productName?.trim() || 'NFC Card'}`,
  ];

  if (variantName?.trim()) {
    lines.push(`Variant: ${variantName.trim()}`);
  }

  lines.push('', 'Please help me with my card design.');
  return lines.join('\n');
}

/**
 * Generates a safe, URL-encoded WhatsApp Click-to-Chat URL (supports WhatsApp Web & mobile app).
 */
export function buildWhatsAppChatUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_SUPPORT_NUMBER}?text=${encodeURIComponent(message)}`;
}
