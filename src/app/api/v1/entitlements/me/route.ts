import { NextRequest } from 'next/server';
import { getActorFromRequest } from '@/lib/auth/session';
import { getEntitlements } from '@/modules/entitlements';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }

    const target = actor.orgId
      ? { organizationId: actor.orgId }
      : { userId: actor.userId };

    const entitlements = await getEntitlements(target);
    return apiSuccess(entitlements);
  } catch (error) {
    return handleApiError(error);
  }
}
