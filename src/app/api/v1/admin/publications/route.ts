import { NextRequest } from 'next/server';
import { getActorFromRequest } from '@/lib/auth/session';
import { apiSuccess, apiError } from '@/lib/api/response';
import { listPublicationRequests } from '@/modules/publishing';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const actor = await getActorFromRequest(req.headers);
  if (!actor || (!actor.isAdmin && actor.role !== 'super_admin')) {
    return apiError('FORBIDDEN', 'Super Admin access required.', 403);
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || undefined;

  try {
    const requests = await listPublicationRequests(actor, status);
    return apiSuccess(requests, { totalCount: requests.length });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return apiError('INTERNAL_ERROR', errorMsg, 500);
  }
}

