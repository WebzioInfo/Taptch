import { NextRequest, NextResponse } from 'next/server';
import { calculateOrderPricing } from '@/campaigns/instagram-card/services/pricing.service';
import type { DesignOption } from '@/campaigns/instagram-card/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, quantity, designOption, isExpressShipping } = body;

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
    }

    const pricing = await calculateOrderPricing(
      productId,
      Number(quantity || 1),
      (designOption || 'DIY') as DesignOption,
      Boolean(isExpressShipping)
    );

    return NextResponse.json(
      {
        success: true,
        data: pricing,
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}

