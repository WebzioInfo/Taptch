import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getActorFromRequest } from '@/lib/auth/session';
import { listUserCards, claimCard, InvalidActivationCodeError, CardAlreadyClaimedError } from '@/modules/cards';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

const claimCardSchema = z.object({
  activationCode: z.string().min(4).max(64),
  profileId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required to view cards.', 401);
    }

    const userCards = await listUserCards(actor.userId);
    return apiSuccess(userCards, { totalCount: userCards.length });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required to claim card.', 401);
    }

    const body = await request.json();
    const validated = claimCardSchema.safeParse(body);

    if (!validated.success) {
      return apiError('VALIDATION_ERROR', 'Invalid activation code submission.', 400, validated.error.format());
    }

    try {
      const result = await claimCard(actor.userId, validated.data.activationCode, validated.data.profileId);
      return apiSuccess(result);
    } catch (err) {
      if (err instanceof InvalidActivationCodeError) {
        return apiError('NOT_FOUND', err.message, 404);
      }
      if (err instanceof CardAlreadyClaimedError) {
        return apiError('CONFLICT', err.message, 409);
      }
      throw err;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
