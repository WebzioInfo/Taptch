import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { profiles } from '@/db/schema/profiles';
import { or, eq } from 'drizzle-orm';
import { captureLead } from '@/modules/leads';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

const exchangeContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(128),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().max(32).optional().or(z.literal('')),
  company: z.string().max(128).optional().or(z.literal('')),
  jobTitle: z.string().max(128).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: identifier } = await params;
    const body = await request.json();
    const validated = exchangeContactSchema.safeParse(body);

    if (!validated.success) {
      return apiError('VALIDATION_ERROR', 'Please provide valid contact information.', 400, validated.error.format());
    }

    // Resolve profile by either ID or slug
    const [profile] = await db
      .select({ id: profiles.id, displayName: profiles.displayName })
      .from(profiles)
      .where(or(eq(profiles.id, identifier), eq(profiles.slug, identifier)))
      .limit(1);

    if (!profile) {
      return apiError('NOT_FOUND', 'Profile not found.', 404);
    }

    const leadId = await captureLead(profile.id, {
      name: validated.data.name,
      email: validated.data.email || undefined,
      phone: validated.data.phone || undefined,
      company: validated.data.company || undefined,
      jobTitle: validated.data.jobTitle || undefined,
      notes: validated.data.notes || undefined,
      source: 'profile_exchange',
    });

    return apiSuccess({
      leadId,
      message: `Thank you! Your contact card was shared with ${profile.displayName}.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
