import { NextRequest } from 'next/server';
import { getActorFromRequest } from '@/lib/auth/session';
import { listUserLeads } from '@/modules/leads';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required to view leads.', 401);
    }

    const leads = await listUserLeads(actor.userId);
    return apiSuccess(leads, { totalCount: leads.length });
  } catch (error) {
    return handleApiError(error);
  }
}

