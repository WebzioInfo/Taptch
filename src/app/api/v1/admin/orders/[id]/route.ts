import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getActorFromRequest } from '@/lib/auth/session';
import { updateOrderStatus, OrderNotFoundError } from '@/modules/orders';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

const updateOrderSchema = z.object({
  orderStatus: z.enum(['requested', 'in_production', 'qc', 'shipped', 'delivered', 'cancelled']).optional(),
  paymentStatus: z.enum(['unpaid', 'paid_offline', 'waived']).optional(),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor || (!actor.isAdmin && actor.role !== 'super_admin')) {
      return apiError('FORBIDDEN', 'Super Admin access required.', 403);
    }

    const { id: orderId } = await params;
    const body = await request.json();
    const validated = updateOrderSchema.safeParse(body);

    if (!validated.success) {
      return apiError('VALIDATION_ERROR', 'Invalid status update parameters.', 400);
    }

    try {
      await updateOrderStatus(orderId, validated.data);
      return apiSuccess({ orderId, success: true });
    } catch (err) {
      if (err instanceof OrderNotFoundError) {
        return apiError('NOT_FOUND', err.message, 404);
      }
      throw err;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
