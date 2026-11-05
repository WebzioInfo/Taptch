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

  if (target.status === 'assigned' && target.redirectUrl) {
    if (target.qrId) {
      recordQRScanEvent({
        qrId: target.qrId,
        profileId: target.profileId,
        destinationType: target.destinationType || 'url',
        resolvedUrl: target.redirectUrl,
        ip,
        userAgent,
        referrer,
      }).catch(() => {});
    }

    const isAbsolute = /^https?:\/\//i.test(target.redirectUrl);
    const destination = isAbsolute ? target.redirectUrl : new URL(target.redirectUrl, request.url).toString();
    return NextResponse.redirect(destination, { status: 302 });
  }

  if (target.status === 'unassigned') {
    const setupUrl = target.redirectUrl || `/setup?token=${token}`;
    return NextResponse.redirect(new URL(setupUrl, request.url), { status: 302 });
  }

  if (target.status === 'disabled') {
    return NextResponse.redirect(new URL('/?error=qr_deactivated', request.url), { status: 302 });
  }

  return NextResponse.redirect(new URL('/?error=qr_not_found', request.url), { status: 302 });
}
