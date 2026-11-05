import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getActorFromRequest } from '@/lib/auth/session';
import {
  assignQRInField,
  QRNotFoundError,
  QRAlreadyAssignedError,
  InvalidDestinationError,
} from '@/modules/qr';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

const assignQRSchema = z.object({
  qr_token: z.string().min(1).max(64),
  name: z.string().min(1).max(128),
  mobile_number: z.string().optional().nullable(),
  place: z.string().optional().nullable(),
  business: z.string().optional().nullable(),
  destination_url: z.string().min(1),
  isReassign: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }

    // RBAC: sales_staff, admin, or super_admin
    const allowedRoles = ['super_admin', 'admin', 'sales_staff'];
    if (!actor.isAdmin && !allowedRoles.includes(actor.role)) {
      return apiError('FORBIDDEN', 'Access denied. Field sales privileges required.', 403);
    }

    const body = await request.json();
    const validated = assignQRSchema.safeParse(body);

    if (!validated.success) {
      return apiError('VALIDATION_ERROR', 'Invalid assignment payload.', 400, validated.error.format());
    }

    try {
      const result = await assignQRInField({
        qrToken: validated.data.qr_token,
        name: validated.data.name,
        mobileNumber: validated.data.mobile_number,
        place: validated.data.place,
        business: validated.data.business,
        destinationUrl: validated.data.destination_url,
        isReassign: validated.data.isReassign,
        staffUserId: actor.userId,
      });

      return apiSuccess({
        message: 'QR code successfully assigned and activated.',
        qr: result.qr,
        customer_user_id: result.customerUserId,
      });
    } catch (err) {
      if (err instanceof QRNotFoundError) {
        return apiError('NOT_FOUND', err.message, 404);
      }
      if (err instanceof QRAlreadyAssignedError) {
        return apiError('CONFLICT', err.message, 409);
      }
      if (err instanceof InvalidDestinationError) {
        return apiError('BAD_REQUEST', err.message, 400);
      }
      throw err;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
