import { NextRequest } from 'next/server';
import { getActorFromRequest } from '@/lib/auth/session';
import {
  getProfileWithDetails,
  updateProfile,
  updateProfileSchema,
  ProfileNotFoundError,
  UnauthorizedProfileAccessError,
} from '@/modules/profiles';
import { TemplatePlanRequirementError } from '@/modules/templates';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }

    const { id } = await params;
    const profile = await getProfileWithDetails(actor, id);
    return apiSuccess(profile);
  } catch (error) {
    if (error instanceof ProfileNotFoundError) {
      return apiError('PROFILE_NOT_FOUND', error.message, 404);
    }
    if (error instanceof UnauthorizedProfileAccessError) {
      return apiError('FORBIDDEN', error.message, 403);
    }
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }

    const { id } = await params;
    const body = await request.json();
    const validated = updateProfileSchema.parse(body);

    const updated = await updateProfile(actor, id, validated);
    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof ProfileNotFoundError) {
      return apiError('PROFILE_NOT_FOUND', error.message, 404);
    }
    if (error instanceof UnauthorizedProfileAccessError) {
      return apiError('FORBIDDEN', error.message, 403);
    }
    if (error instanceof TemplatePlanRequirementError) {
      return apiError('TEMPLATE_PLAN_REQUIRED', error.message, 403);
    }
    return handleApiError(error);
  }
}
