import { db } from '@/db';
import { campaignOrders, campaignDesigns, campaignSettings } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { INSTAGRAM_CAMPAIGN_CONFIG, campaignBrandConfig } from '../config';
import { getCampaignOrder } from './order.service';
import { logger } from '@/lib/logger';

export class DesignerWorkflowError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'DesignerWorkflowError';
  }
}

/**
 * Builds the official WhatsApp conversation trigger URL
 * Pre-fills order number, customer name, and Instagram handle
 */
export async function buildDesignerWhatsAppUrl(orderId: string): Promise<string> {
  const { order } = await getCampaignOrder(orderId);

  const [settings] = await db
    .select({ designerWhatsapp: campaignSettings.designerWhatsapp })
    .from(campaignSettings)
    .where(eq(campaignSettings.campaignKey, INSTAGRAM_CAMPAIGN_CONFIG.key))
    .limit(1);

  const phone = (settings?.designerWhatsapp || INSTAGRAM_CAMPAIGN_CONFIG.defaults.designerWhatsapp)
    .replace(/[^0-9]/g, '');

  const text = encodeURIComponent(
    `Hello ${campaignBrandConfig.name} Design Team!\n\nI have placed Instagram Card Order *#${order.orderNumber}*.\n` +
    `Customer: ${order.customerName}\n` +
    `Instagram: @${order.instagramUsername} (${order.instagramUrl})\n` +
    `Payment Status: ${order.paymentStatus}\n\n` +
    `I am ready to share my custom design preferences and references.`
  );

  return `https://wa.me/${phone}?text=${text}`;
}

/**
 * Admin assigns an in-house designer to the order
 */
export async function assignDesignerToOrder(orderId: string, designerUserId: string) {
  const { order } = await getCampaignOrder(orderId);

  await db
    .update(campaignOrders)
    .set({
      assignedDesignerId: designerUserId,
      designerAssignedAt: new Date(),
      designStatus: 'DESIGN_IN_PROGRESS',
      updatedAt: new Date(),
    })
    .where(eq(campaignOrders.id, order.id));

  logger.info({ orderId, designerUserId }, 'Designer assigned to campaign order');
}

/**
 * Designer/Admin records customer design approval
 * Enables order to proceed to physical production
 */
export async function approveOrderDesign(
  orderId: string,
  approvedByUserId: string,
  printArtworkUrl?: string
) {
  const { order } = await getCampaignOrder(orderId);

  await db.transaction(async (tx: any) => {
    // 1. Mark latest design version as approved
    const [latestDesign] = await tx
      .select()
      .from(campaignDesigns)
      .where(eq(campaignDesigns.orderId, order.id))
      .orderBy(desc(campaignDesigns.versionNumber))
      .limit(1);

    if (latestDesign) {
      await tx
        .update(campaignDesigns)
        .set({
          isApproved: true,
          approvedBy: approvedByUserId,
          approvedAt: new Date(),
          printReadyArtworkUrl: printArtworkUrl || latestDesign.printReadyArtworkUrl,
        })
        .where(eq(campaignDesigns.id, latestDesign.id));
    }

    // 2. Advance order design state
    await tx
      .update(campaignOrders)
      .set({
        designStatus: 'DESIGN_APPROVED',
        productionStatus: 'PENDING_PRODUCTION',
        updatedAt: new Date(),
      })
      .where(eq(campaignOrders.id, order.id));
  });

  logger.info({ orderId, approvedByUserId }, 'Order design approved for manufacturing');
}
