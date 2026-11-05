import { NextRequest } from 'next/server';
import { getActorFromRequest } from '@/lib/auth/session';
import { getStaffAnalytics } from '@/modules/qr';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor || (!actor.isAdmin && actor.role !== 'owner' && actor.role !== 'admin' && actor.userId !== (await params).id)) {
      return apiError('FORBIDDEN', 'Access denied to staff analytics.', 403);
    }

    const { id } = await params;
    const analytics = await getStaffAnalytics(id);

    return apiSuccess(analytics);
  } catch (error) {
    return handleApiError(error);
  }
}
