import { NextRequest, NextResponse } from 'next/server';
import { resolveQRToken, recordQRScanEvent } from '@/modules/qr';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { token } = await params;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || '';
  const referrer = request.headers.get('referer') || '';

  const target = await resolveQRToken(token);

  if ((target.status === 'assigned' || target.status === 'available') && target.redirectUrl) {
    // Non-blocking telemetry dispatch
    if (target.qrId) {
      recordQRScanEvent({
        qrId: target.qrId,
        profileId: target.profileId,
        destinationType: target.destinationType || 'profile',
        resolvedUrl: target.redirectUrl,
        ip,
        userAgent,
        referrer,
      }).catch(() => {});
    }

    // Direct external URL or internal route
    const isAbsoluteUrl = /^https?:\/\//i.test(target.redirectUrl);
    const redirectUrl = isAbsoluteUrl ? target.redirectUrl : new URL(target.redirectUrl, request.url).toString();

    return NextResponse.redirect(redirectUrl, { status: 307 });
  }

  if (target.status === 'available' || target.status === 'unassigned') {
    const claimUrl = new URL(`/claim/${token}?ref=qr`, request.url);
    return NextResponse.redirect(claimUrl, { status: 307 });
  }

  const fallbackUrl = new URL(`/?error=qr_${target.status}`, request.url);
  return NextResponse.redirect(fallbackUrl, { status: 307 });
}

