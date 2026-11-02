import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getActorFromRequest } from '@/lib/auth/session';
import { linkCardToProfile, CardNotFoundError } from '@/modules/cards';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

const linkCardSchema = z.object({
  profileId: z.string().min(1),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }

    const { id: cardId } = await params;
    const body = await request.json();
    const validated = linkCardSchema.safeParse(body);

    if (!validated.success) {
      return apiError('VALIDATION_ERROR', 'Profile ID is required.', 400);
    }

    try {
      await linkCardToProfile(actor.userId, cardId, validated.data.profileId);
      return apiSuccess({ cardId, profileId: validated.data.profileId, success: true });
    } catch (err) {
      if (err instanceof CardNotFoundError) {
        return apiError('NOT_FOUND', err.message, 404);
      }
      throw err;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
