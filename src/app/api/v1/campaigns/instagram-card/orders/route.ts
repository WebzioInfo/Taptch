import { NextRequest, NextResponse } from 'next/server';
import { createCampaignOrder } from '@/campaigns/instagram-card/services/order.service';
import { createCampaignOrderSchema } from '@/campaigns/instagram-card/types';

// In-memory sliding rate limiter: Max 20 order submissions per IP per minute
const orderRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkOrderRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxAttempts = 20;

  // Periodic garbage collection to prevent memory exhaustion
  if (orderRateLimitMap.size > 1000) {
    for (const [key, val] of orderRateLimitMap.entries()) {
      if (now > val.resetAt) {
        orderRateLimitMap.delete(key);
      }
    }
  }

  const current = orderRateLimitMap.get(ip);
  if (!current || now > current.resetAt) {
    orderRateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= maxAttempts) {
    return false;
  }

  current.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous';
    if (!checkOrderRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many order requests. Please wait a minute before retrying.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const rawBody = await req.json();
    const headerIdempotency = req.headers.get('idempotency-key') || req.headers.get('x-idempotency-key');
    if (headerIdempotency && !rawBody.idempotencyKey) {
      rawBody.idempotencyKey = headerIdempotency;
    }

    const validated = createCampaignOrderSchema.parse(rawBody);
    const result = await createCampaignOrder(validated);

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store, private',
        },
      }
    );
  }
}

