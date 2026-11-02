import { NextRequest } from 'next/server';
import { getActorFromRequest } from '@/lib/auth/session';
import { apiSuccess, apiError } from '@/lib/api/response';
import { reviewPublicationRequest } from '@/modules/publishing';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getActorFromRequest(req.headers);
  if (!actor || (!actor.isAdmin && actor.role !== 'super_admin')) {
    return apiError('FORBIDDEN', 'Super Admin access required.', 403);
  }

  const { id } = await params;
  if (!id) {
    return apiError('BAD_REQUEST', 'Publication Request ID is required.', 400);
  }

  try {
    const body = await req.json();
    if (!body.action) {
      return apiError('VALIDATION_FAILED', 'Review action is required.', 400);
    }

    const result = await reviewPublicationRequest(actor, id, {
      action: body.action,
      planId: body.planId,
      validDays: body.validDays ? Number(body.validDays) : undefined,
      paymentStatus: body.paymentStatus,
      amountInr: body.amountInr ? String(body.amountInr) : undefined,
      adminNotes: body.adminNotes,
      rejectionReason: body.rejectionReason,
      correctionsRequested: body.correctionsRequested,
    });

    return apiSuccess(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return apiError('BAD_REQUEST', errorMsg, 400);
  }
}

