import { NextRequest } from 'next/server';
import { getActorFromRequest } from '@/lib/auth/session';
import { apiSuccess, apiError } from '@/lib/api/response';
import { assignUserPlan } from '@/modules/publishing';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const actor = await getActorFromRequest(req.headers);
  if (!actor || (!actor.isAdmin && actor.role !== 'super_admin')) {
    return apiError('FORBIDDEN', 'Super Admin access required.', 403);
  }

  try {
    const body = await req.json();
    if (!body.userId || !body.planId) {
      return apiError('VALIDATION_FAILED', 'userId and planId are required.', 400);
    }

    const result = await assignUserPlan(actor, {
      userId: body.userId,
      planId: body.planId,
      validDays: body.validDays ? Number(body.validDays) : undefined,
      paymentStatus: body.paymentStatus,
      amountInr: body.amountInr ? String(body.amountInr) : undefined,
      notes: body.notes,
    });

    return apiSuccess(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return apiError('BAD_REQUEST', errorMsg, 400);
  }
}

