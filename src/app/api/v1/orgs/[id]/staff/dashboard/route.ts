import { NextRequest } from 'next/server';
import { getActorFromRequest } from '@/lib/auth/session';
import { getStaffDashboardData, StaffNotFoundError } from '@/modules/orgs';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }

    const { id: orgId } = await params;

    try {
      const summary = await getStaffDashboardData({
        organizationId: orgId,
        userId: actor.userId,
      });

      return apiSuccess(summary);
    } catch (err) {
      if (err instanceof StaffNotFoundError) {
        return apiError('FORBIDDEN', 'You are not an active staff member of this organization.', 403);
      }
      throw err;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
