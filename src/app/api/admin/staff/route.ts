import { NextRequest } from 'next/server';
import { z } from 'zod';
import { eq, inArray, desc } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import { db } from '@/db';
import { users, accounts } from '@/db/schema/auth';
import { getActorFromRequest } from '@/lib/auth/session';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

const createStaffSchema = z.object({
  name: z.string().min(2).max(128),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.enum(['admin', 'sales_staff']).default('sales_staff'),
  phoneNumber: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor || (!actor.isAdmin && actor.role !== 'owner' && actor.role !== 'admin')) {
      return apiError('FORBIDDEN', 'Administrative privileges required.', 403);
    }

    const staffList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.systemRole,
        status: users.status,
        phoneNumber: users.phoneNumber,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(inArray(users.systemRole, ['admin', 'sales_staff']))
      .orderBy(desc(users.createdAt));

    return apiSuccess(staffList);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor || (!actor.isAdmin && actor.role !== 'owner')) {
      return apiError('FORBIDDEN', 'Super Admin or Owner privileges required to provision staff.', 403);
    }

    const body = await request.json();
    const validated = createStaffSchema.safeParse(body);

    if (!validated.success) {
      return apiError('VALIDATION_ERROR', 'Invalid staff payload.', 400, validated.error.format());
    }

    // Check email uniqueness
    const [existing] = await db.select().from(users).where(eq(users.email, validated.data.email.toLowerCase())).limit(1);
    if (existing) {
      return apiError('CONFLICT', 'A user with this email address already exists.', 409);
    }

    const newStaffId = `usr_staff_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const [created] = await db
      .insert(users)
      .values({
        id: newStaffId,
        name: validated.data.name.trim(),
        email: validated.data.email.toLowerCase().trim(),
        systemRole: validated.data.role,
        phoneNumber: validated.data.phoneNumber || null,
        status: 'active',
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.systemRole,
        status: users.status,
        createdAt: users.createdAt,
      });

    // Hash password with bcryptjs (min 10 rounds per spec) and create credential account
    const tempPassword = validated.data.password || `Staff@${Math.random().toString(36).slice(2, 8)}!`;
    const passwordHash = await hash(tempPassword, 10);

    await db.insert(accounts).values({
      id: `acc_${newStaffId}`,
      userId: newStaffId,
      accountId: newStaffId,
      providerId: 'credential',
      password: passwordHash,
    });

    return apiSuccess({ ...created, temporaryPassword: tempPassword }, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

