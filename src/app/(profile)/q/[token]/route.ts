import { NextRequest, NextResponse } from 'next/server';
import { resolveRedirectToken, recordCardEvent } from '@/modules/cards';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { token } = await params;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || '';
  const referrer = request.headers.get('referer') || '';

  const target = await resolveRedirectToken(token);

  if (target.status === 'active' && target.slug) {
    // Non-blocking telemetry dispatch
    recordCardEvent({
      cardId: target.cardId,
      profileId: target.profileId,
      eventType: 'qr_scan',
      ip,
      userAgent,
      referrer,
    }).catch(() => {});

    const redirectUrl = new URL(`/p/${target.slug}?ref=qr`, request.url);
    return NextResponse.redirect(redirectUrl, { status: 307 });
  }

  if (target.status === 'unclaimed') {
    const claimUrl = new URL(`/claim/${token}`, request.url);
    return NextResponse.redirect(claimUrl, { status: 307 });
  }

  const fallbackUrl = new URL(`/?error=card_${target.status}`, request.url);
  return NextResponse.redirect(fallbackUrl, { status: 307 });
}

