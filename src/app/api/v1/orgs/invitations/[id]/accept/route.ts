import { NextRequest } from 'next/server';
import { getActorFromRequest } from '@/lib/auth/session';
import { acceptInvitation, InvitationNotFoundError, InvitationExpiredError } from '@/modules/orgs';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required to accept an invitation.', 401);
    }

    const { id: invitationId } = await params;

    try {
      const result = await acceptInvitation(invitationId, actor.userId);
      return apiSuccess(result);
    } catch (err) {
      if (err instanceof InvitationNotFoundError) {
        return apiError('NOT_FOUND', err.message, 404);
      }
      if (err instanceof InvitationExpiredError) {
        return apiError('BAD_REQUEST', err.message, 400);
      }
      throw err;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
