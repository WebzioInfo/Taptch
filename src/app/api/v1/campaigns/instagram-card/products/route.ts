import { NextResponse } from 'next/server';
import { db } from '@/db';
import { campaignProducts, campaignSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { INSTAGRAM_CAMPAIGN_CONFIG } from '@/campaigns/instagram-card/config';
import { ensureCampaignSeeded } from '@/campaigns/instagram-card/services/pricing.service';

export async function GET() {
  try {
    await ensureCampaignSeeded();

    const [settings] = await db
      .select()
      .from(campaignSettings)
      .where(eq(campaignSettings.campaignKey, INSTAGRAM_CAMPAIGN_CONFIG.key))
      .limit(1);

    const products = await db
      .select()
      .from(campaignProducts)
      .where(eq(campaignProducts.campaignKey, INSTAGRAM_CAMPAIGN_CONFIG.key));

    return NextResponse.json(
      {
        success: true,
        data: {
          settings,
          products,
          templates: INSTAGRAM_CAMPAIGN_CONFIG.templates,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

