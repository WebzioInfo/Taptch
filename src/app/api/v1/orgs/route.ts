import { NextRequest } from 'next/server';
import { getActorFromRequest } from '@/lib/auth/session';
import { createOrganization, listUserOrganizations, createOrgSchema } from '@/modules/orgs';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }

    const orgs = await listUserOrganizations(actor.userId);
    return apiSuccess(orgs);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }

    const body = await request.json();
    const validated = createOrgSchema.safeParse(body);
    if (!validated.success) {
      return apiError('VALIDATION_ERROR', 'Invalid organization data.', 400, validated.error.format());
    }

    const created = await createOrganization({
      ...validated.data,
      ownerUserId: actor.userId,
    });

    return apiSuccess(created, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
