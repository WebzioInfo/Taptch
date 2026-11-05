import { NextRequest } from 'next/server';
import { getActorFromRequest } from '@/lib/auth/session';
import {
  updateStaffMember,
  removeStaffMember,
  updateStaffSchema,
  StaffNotFoundError,
  PrivilegeEscalationError,
} from '@/modules/orgs';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string; memberId: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }

    const { id: orgId, memberId } = await params;
    const body = await request.json();
    const validated = updateStaffSchema.safeParse(body);

    if (!validated.success) {
      return apiError('VALIDATION_ERROR', 'Invalid update data.', 400, validated.error.format());
    }

    try {
      const updated = await updateStaffMember({
        organizationId: orgId,
        actorUserId: actor.userId,
        memberId,
        role: validated.data.role,
        status: validated.data.status,
        permissions: validated.data.permissions,
        assignedResponsibilities: validated.data.assignedResponsibilities,
      });

      return apiSuccess(updated);
    } catch (err) {
      if (err instanceof StaffNotFoundError) {
        return apiError('NOT_FOUND', err.message, 404);
      }
      if (err instanceof PrivilegeEscalationError) {
        return apiError('FORBIDDEN', err.message, 403);
      }
      throw err;
    }
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }

    const { id: orgId, memberId } = await params;

    try {
      const result = await removeStaffMember({
        organizationId: orgId,
        actorUserId: actor.userId,
        memberId,
      });

      return apiSuccess(result);
    } catch (err) {
      if (err instanceof StaffNotFoundError) {
        return apiError('NOT_FOUND', err.message, 404);
      }
      if (err instanceof PrivilegeEscalationError) {
        return apiError('FORBIDDEN', err.message, 403);
      }
      throw err;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
