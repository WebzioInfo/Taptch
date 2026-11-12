import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';
import { eq, desc, and, or, ilike, sql } from 'drizzle-orm';
import type { ActorContext } from '../../common/types';
import * as crypto from 'crypto';

@Injectable()
export class LeadsService {
  constructor(private dbService: DatabaseService) {}

  async findAllForActor(
    actor: ActorContext,
    filters?: { status?: string; search?: string; profileId?: string },
  ) {
    return this.dbService.withActor(actor, async (tx) => {
      const conditions = [];

      // Non-admins only see leads for their own profiles
      if (!actor.isAdmin && actor.role !== 'support_admin') {
        conditions.push(
          or(
            eq(schema.leads.ownerUserId, actor.userId),
            eq(schema.profiles.ownerId, actor.userId),
          ),
        );
      }

      if (filters?.status && filters.status !== 'ALL') {
        conditions.push(eq(schema.leads.status, filters.status.toUpperCase()));
      }

      if (filters?.profileId) {
        conditions.push(eq(schema.leads.profileId, filters.profileId));
      }

      if (filters?.search && filters.search.trim()) {
        const query = `%${filters.search.trim()}%`;
        conditions.push(
          or(
            ilike(schema.leads.name, query),
            ilike(schema.leads.email, query),
            ilike(schema.leads.phone, query),
            ilike(schema.leads.company, query),
            ilike(schema.leads.subject, query),
            ilike(schema.leads.message, query),
          ),
        );
      }

      return tx
        .select({
          id: schema.leads.id,
          profileId: schema.leads.profileId,
          profileSlug: schema.profiles.slug,
          profileName: schema.profiles.displayName,
          ownerUserId: schema.leads.ownerUserId,
          name: schema.leads.name,
          email: schema.leads.email,
          phone: schema.leads.phone,
          company: schema.leads.company,
          jobTitle: schema.leads.jobTitle,
          subject: schema.leads.subject,
          message: schema.leads.message,
          notes: schema.leads.notes,
          source: schema.leads.source,
          status: schema.leads.status,
          createdAt: schema.leads.createdAt,
          updatedAt: schema.leads.updatedAt,
        })
        .from(schema.leads)
        .innerJoin(schema.profiles, eq(schema.leads.profileId, schema.profiles.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(schema.leads.createdAt));
    });
  }

  async getStatsForActor(actor: ActorContext) {
    return this.dbService.withActor(actor, async (tx) => {
      const userCondition = (!actor.isAdmin && actor.role !== 'support_admin')
        ? or(
            eq(schema.leads.ownerUserId, actor.userId),
            eq(schema.profiles.ownerId, actor.userId),
          )
        : undefined;

      const results = await tx
        .select({
          status: schema.leads.status,
          count: sql<number>`count(*)::int`,
        })
        .from(schema.leads)
        .innerJoin(schema.profiles, eq(schema.leads.profileId, schema.profiles.id))
        .where(userCondition)
        .groupBy(schema.leads.status);

      const stats = {
        total: 0,
        new: 0,
        contacted: 0,
        qualified: 0,
        converted: 0,
        lost: 0,
        archived: 0,
      };

      for (const row of results) {
        const key = (row.status || 'NEW').toLowerCase() as keyof typeof stats;
        const c = Number(row.count) || 0;
        stats.total += c;
        if (key in stats) {
          stats[key] = c;
        }
      }

      return stats;
    });
  }

  async captureLead(data: any) {
    // 1. Spam & Honeypot protection
    if (data.website_hp || data.company_trap || data.honeypot) {
      throw new BadRequestException('Invalid submission rejected.');
    }

    const fullName = (data.fullName || data.name || '').trim();
    const email = (data.email || '').trim().toLowerCase();
    const message = (data.message || data.notes || '').trim();

    if (!data.profileId) {
      throw new BadRequestException('Target profile identifier is required.');
    }
    if (!fullName) {
      throw new BadRequestException('Full name is required.');
    }
    if (!email && !data.phone) {
      throw new BadRequestException('At least an email address or phone number is required.');
    }

    // 2. Resolve profile and owner
    const [profile] = await this.dbService.db
      .select({ id: schema.profiles.id, ownerId: schema.profiles.ownerId })
      .from(schema.profiles)
      .where(eq(schema.profiles.id, data.profileId))
      .limit(1);

    if (!profile) {
      throw new BadRequestException('The digital profile does not exist or has been removed.');
    }

    // 3. Deduplicate rapid duplicate submissions
    const recentDuplicate = await this.dbService.db
      .select({ id: schema.leads.id })
      .from(schema.leads)
      .where(
        and(
          eq(schema.leads.profileId, profile.id),
          eq(schema.leads.name, fullName),
          email ? eq(schema.leads.email, email) : undefined,
        ),
      )
      .limit(1);

    if (recentDuplicate.length > 0) {
      return {
        id: recentDuplicate[0].id,
        status: 'DUPLICATE_ACCEPTED',
        message: 'Your message has already been received.',
      };
    }

    // 4. Insert lead
    const [lead] = await this.dbService.db
      .insert(schema.leads)
      .values({
        id: crypto.randomUUID(),
        profileId: profile.id,
        ownerUserId: profile.ownerId,
        name: fullName,
        email: email || null,
        phone: data.phone?.trim() || null,
        company: data.companyName?.trim() || data.company?.trim() || null,
        jobTitle: data.jobTitle?.trim() || null,
        subject: data.subject?.trim() || null,
        message: message || null,
        notes: null,
        source: data.source || 'contact_form',
        status: 'NEW',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return {
      success: true,
      leadId: lead.id,
      message: 'Thank you! Your contact request has been delivered.',
    };
  }

  async updateLead(
    id: string,
    actor: ActorContext,
    dto: { status?: string; notes?: string },
  ) {
    const [lead] = await this.dbService.db
      .select({
        id: schema.leads.id,
        ownerUserId: schema.leads.ownerUserId,
        profileOwnerId: schema.profiles.ownerId,
      })
      .from(schema.leads)
      .innerJoin(schema.profiles, eq(schema.leads.profileId, schema.profiles.id))
      .where(eq(schema.leads.id, id))
      .limit(1);

    if (!lead) {
      throw new NotFoundException('Lead record not found.');
    }

    // Tenant check
    if (
      !actor.isAdmin &&
      actor.role !== 'support_admin' &&
      lead.ownerUserId !== actor.userId &&
      lead.profileOwnerId !== actor.userId
    ) {
      throw new ForbiddenException('You do not have permission to modify this lead.');
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (dto.status) updates.status = dto.status.toUpperCase();
    if (dto.notes !== undefined) updates.notes = dto.notes;

    const [updated] = await this.dbService.db
      .update(schema.leads)
      .set(updates)
      .where(eq(schema.leads.id, id))
      .returning();

    return updated;
  }

  async deleteLead(id: string, actor: ActorContext) {
    const [lead] = await this.dbService.db
      .select({
        id: schema.leads.id,
        ownerUserId: schema.leads.ownerUserId,
        profileOwnerId: schema.profiles.ownerId,
      })
      .from(schema.leads)
      .innerJoin(schema.profiles, eq(schema.leads.profileId, schema.profiles.id))
      .where(eq(schema.leads.id, id))
      .limit(1);

    if (!lead) {
      throw new NotFoundException('Lead record not found.');
    }

    if (
      !actor.isAdmin &&
      actor.role !== 'support_admin' &&
      lead.ownerUserId !== actor.userId &&
      lead.profileOwnerId !== actor.userId
    ) {
      throw new ForbiddenException('You do not have permission to delete this lead.');
    }

    await this.dbService.db.delete(schema.leads).where(eq(schema.leads.id, id));
    return { success: true };
  }
}
