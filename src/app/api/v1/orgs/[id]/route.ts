import { NextRequest } from 'next/server';
import { getActorFromRequest } from '@/lib/auth/session';
import { getOrganizationById, getActorOrgMembership } from '@/modules/orgs';
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

    const { id } = await params;
    const org = await getOrganizationById(id);

    // Verify membership unless super_admin
    if (!actor.isAdmin) {
      const membership = await getActorOrgMembership(id, actor.userId);
      if (!membership || membership.status !== 'active') {
        return apiError('FORBIDDEN', 'Access denied to this organization.', 403);
      }
    }

    return apiSuccess(org);
  } catch (error) {
    return handleApiError(error);
  }
}
