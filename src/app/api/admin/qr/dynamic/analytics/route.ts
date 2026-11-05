import { NextRequest } from 'next/server';
import { getActorFromRequest } from '@/lib/auth/session';
import { getCalendarHeatmapAnalytics } from '@/modules/qr';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const year = parseInt(searchParams.get('year') || String(now.getFullYear()), 10);
    const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1), 10);

    const data = await getCalendarHeatmapAnalytics({
      year,
      month,
      organizationId: actor.orgId || undefined,
    });

    return apiSuccess(data);
  } catch (error) {
    return handleApiError(error);
  }
}

