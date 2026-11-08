import { NextRequest, NextResponse } from 'next/server';
import { trackCampaignOrder, getCampaignOrder } from '@/campaigns/instagram-card/services/order.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get('orderNumber');
    const phone = searchParams.get('phone');

    if (!orderNumber || !phone) {
      return NextResponse.json(
        { success: false, error: 'Order Number and Phone are required' },
        { status: 400 }
      );
    }

    const tracked = await trackCampaignOrder(orderNumber, phone);

    return NextResponse.json({
      success: true,
      data: tracked,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 404 }
    );
  }
}

