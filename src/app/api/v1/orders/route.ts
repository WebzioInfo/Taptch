import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getActorFromRequest } from '@/lib/auth/session';
import { createOrder, listUserOrders } from '@/modules/orders';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

const createOrderSchema = z.object({
  profileId: z.string().optional(),
  material: z.enum(['pvc', 'metal']).default('pvc'),
  quantity: z.number().int().min(1).max(50).default(1),
  shippingAddress: z.object({
    recipientName: z.string().min(2),
    street: z.string().min(5),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().min(4),
    country: z.string().default('India'),
    phone: z.string().min(10),
  }),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }

    const orders = await listUserOrders(actor.userId);
    return apiSuccess(orders, { totalCount: orders.length });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required to place order.', 401);
    }

    const body = await request.json();
    const validated = createOrderSchema.safeParse(body);

    if (!validated.success) {
      return apiError('VALIDATION_ERROR', 'Invalid shipping address or order details.', 400, validated.error.format());
    }

    const result = await createOrder(actor.userId, validated.data);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
