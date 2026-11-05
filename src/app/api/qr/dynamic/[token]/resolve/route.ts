import { NextRequest } from 'next/server';
import { resolveQRToken, recordQRScanEvent } from '@/modules/qr';
import { apiSuccess, apiError } from '@/lib/api/response';

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

  if (target.status === 'not_found') {
    return apiError('NOT_FOUND', `QR code with token "${token}" was not found.`, 404);
  }

  if (target.status === 'disabled' || target.status === 'archived') {
    return apiError('GONE', target.message || 'This QR code has been deactivated.', 410);
  }

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

    return apiSuccess({
      status: 'assigned',
      redirect_url: target.redirectUrl,
      token,
    });
  }

  if (target.status === 'unassigned') {
    return apiSuccess({
      status: 'unassigned',
      redirect_url: target.redirectUrl || `/setup?token=${token}`,
      token,
    });
  }

  return apiError('BAD_REQUEST', 'Unable to resolve QR code destination.', 400);
}
