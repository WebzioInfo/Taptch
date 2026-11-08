import { NextRequest, NextResponse } from 'next/server';
import { reportCustomerPayment } from '@/campaigns/instagram-card/services/payment.service';

const paymentRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkPaymentRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxAttempts = 10;

  if (paymentRateLimitMap.size > 1000) {
    for (const [key, val] of paymentRateLimitMap.entries()) {
      if (now > val.resetAt) {
        paymentRateLimitMap.delete(key);
      }
    }
  }

  const current = paymentRateLimitMap.get(ip);
  if (!current || now > current.resetAt) {
    paymentRateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
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
    if (!checkPaymentRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many payment reporting attempts. Please wait a minute.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const body = await req.json();
    const { orderId, amount, paymentMethod, transactionReference, evidenceUrl, internalNotes } = body;

    const numAmount = Number(amount);
    if (!orderId || !transactionReference || isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid Order ID, positive Amount, and Transaction Reference are required' },
        { status: 400 }
      );
    }

    const cleanRef = String(transactionReference).trim();
    if (cleanRef.length < 4 || cleanRef.length > 64) {
      return NextResponse.json(
        { success: false, error: 'Transaction reference must be between 4 and 64 characters' },
        { status: 400 }
      );
    }

    const result = await reportCustomerPayment({
      orderId,
      amount: numAmount,
      paymentMethod: paymentMethod || 'UPI',
      transactionReference: cleanRef,
      evidenceUrl,
      internalNotes,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}

