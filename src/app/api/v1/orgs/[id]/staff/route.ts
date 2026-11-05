import { NextRequest } from 'next/server';
import { getActorFromRequest } from '@/lib/auth/session';
import {
  listOrganizationStaff,
  listOrganizationInvitations,
  inviteStaff,
  inviteStaffSchema,
  getActorOrgMembership,
  PrivilegeEscalationError,
  UserAlreadyMemberError,
} from '@/modules/orgs';
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

    // Verify membership unless super_admin
    if (!actor.isAdmin) {
      const membership = await getActorOrgMembership(orgId, actor.userId);
      if (!membership || membership.status !== 'active') {
        return apiError('FORBIDDEN', 'Access denied to this organization staff roster.', 403);
      }
    }

    const [staff, invitations] = await Promise.all([
      listOrganizationStaff(orgId),
      listOrganizationInvitations(orgId),
    ]);

    return apiSuccess({ staff, invitations });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }

    const { id: orgId } = await params;
    const body = await request.json();
    const validated = inviteStaffSchema.safeParse(body);

    if (!validated.success) {
      return apiError('VALIDATION_ERROR', 'Invalid staff invitation data.', 400, validated.error.format());
    }

    try {
      const invite = await inviteStaff({
        organizationId: orgId,
        inviterUserId: actor.userId,
        email: validated.data.email,
        phoneNumber: validated.data.phoneNumber,
        role: validated.data.role,
        permissions: validated.data.permissions,
        assignedResponsibilities: validated.data.assignedResponsibilities,
      });

      return apiSuccess(invite, undefined, 201);
    } catch (err) {
      if (err instanceof PrivilegeEscalationError) {
        return apiError('FORBIDDEN', err.message, 403);
      }
      if (err instanceof UserAlreadyMemberError) {
        return apiError('CONFLICT', err.message, 409);
      }
      throw err;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
