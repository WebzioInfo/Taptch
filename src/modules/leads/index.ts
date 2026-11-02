import { eq, desc } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { db } from '@/db';
import { leads } from '@/db/schema/leads';
import { profiles } from '@/db/schema/profiles';
import { logger } from '@/lib/logger';

export interface CaptureLeadInput {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  notes?: string;
  source?: string;
}

export interface LeadRecord {
  id: string;
  profileId: string;
  profileName?: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  jobTitle: string | null;
  notes: string | null;
  source: string;
  createdAt: Date;
}

/**
 * Capture an incoming lead / reciprocal contact from a public profile page
 */
export async function captureLead(
  profileId: string,
  input: CaptureLeadInput
): Promise<string> {
  const leadId = `lead_${Date.now()}_${randomBytes(4).toString('hex')}`;

  await db.insert(leads).values({
    id: leadId,
    profileId,
    name: input.name.trim(),
    email: input.email ? input.email.trim().toLowerCase() : null,
    phone: input.phone ? input.phone.trim() : null,
    company: input.company ? input.company.trim() : null,
    jobTitle: input.jobTitle ? input.jobTitle.trim() : null,
    notes: input.notes ? input.notes.trim() : null,
    source: input.source || 'profile_exchange',
  });

  logger.info({ leadId, profileId }, 'New reciprocal lead captured');
  return leadId;
}

/**
 * Retrieve all leads captured for all profiles owned by an actor
 */
export async function listUserLeads(actorUserId: string): Promise<LeadRecord[]> {
  const rows = await db
    .select({
      id: leads.id,
      profileId: leads.profileId,
      profileName: profiles.displayName,
      name: leads.name,
      email: leads.email,
      phone: leads.phone,
      company: leads.company,
      jobTitle: leads.jobTitle,
      notes: leads.notes,
      source: leads.source,
      createdAt: leads.createdAt,
    })
    .from(leads)
    .innerJoin(profiles, eq(leads.profileId, profiles.id))
    .where(eq(profiles.ownerId, actorUserId))
    .orderBy(desc(leads.createdAt));

  return rows;
}

