import { NextRequest } from 'next/server';
import { getActorFromRequest } from '@/lib/auth/session';
import { getOrganizationAuditLogs, getActorOrgMembership } from '@/modules/orgs';
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

    // Check membership and authorization (owner, admin, manager)
    if (!actor.isAdmin) {
      const membership = await getActorOrgMembership(orgId, actor.userId);
      if (!membership || membership.status !== 'active') {
        return apiError('FORBIDDEN', 'Access denied to organization audit ledger.', 403);
      }
      if (membership.role !== 'owner' && membership.role !== 'admin' && membership.role !== 'manager') {
        return apiError('FORBIDDEN', 'Administrative privileges required to inspect audit logs.', 403);
      }
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const action = searchParams.get('action') || undefined;

    const result = await getOrganizationAuditLogs({
      organizationId: orgId,
      limit,
      offset,
      action,
    });

    return apiSuccess(result.items, { totalCount: result.total, pageSize: result.limit });
  } catch (error) {
    return handleApiError(error);
  }
}
