import { NextRequest } from 'next/server';
import { getActorFromRequest } from '@/lib/auth/session';
import { listAllOrders } from '@/modules/orders';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor || (!actor.isAdmin && actor.role !== 'super_admin')) {
      return apiError('FORBIDDEN', 'Super Admin access required.', 403);
    }

    const orders = await listAllOrders();
    return apiSuccess(orders, { totalCount: orders.length });
  } catch (error) {
    return handleApiError(error);
  }
}

