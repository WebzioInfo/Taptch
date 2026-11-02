import { NextRequest } from 'next/server';
import { getActorFromRequest } from '@/lib/auth/session';
import { apiSuccess, apiError } from '@/lib/api/response';
import { submitPublicationRequest } from '@/modules/publishing';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getActorFromRequest(req.headers);
  if (!actor || !actor.userId) {
    return apiError('UNAUTHORIZED', 'Authentication required.', 401);
  }

  const { id } = await params;
  if (!id) {
    return apiError('BAD_REQUEST', 'Profile ID is required.', 400);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const result = await submitPublicationRequest(actor, {
      profileId: id,
      requestedPlanId: body.requestedPlanId,
      contactPhone: body.contactPhone,
      contactWhatsapp: body.contactWhatsapp,
    });

    return apiSuccess(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return apiError('BAD_REQUEST', errorMsg, 400);
  }
}

