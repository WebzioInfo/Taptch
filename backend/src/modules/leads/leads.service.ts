import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';
import { eq, desc } from 'drizzle-orm';
import type { ActorContext } from '@taptch/shared';
import * as crypto from 'crypto';

@Injectable()
export class LeadsService {
  constructor(private dbService: DatabaseService) {}

  async findAllForActor(actor: ActorContext) {
    return this.dbService.withActor(actor, async (tx) => {
      return tx
        .select({
          id: schema.leads.id,
          profileId: schema.leads.profileId,
          name: schema.leads.name,
          email: schema.leads.email,
          phone: schema.leads.phone,
          company: schema.leads.company,
          jobTitle: schema.leads.jobTitle,
          notes: schema.leads.notes,
          source: schema.leads.source,
          createdAt: schema.leads.createdAt,
        })
        .from(schema.leads)
        .innerJoin(schema.profiles, eq(schema.leads.profileId, schema.profiles.id))
        .where(eq(schema.profiles.ownerId, actor.userId))
        .orderBy(desc(schema.leads.createdAt));
    });
  }

  async captureLead(data: any) {
    if (!data.profileId || !data.name) {
      throw new BadRequestException('Profile ID and name are required.');
    }

    const [profile] = await this.dbService.db
      .select({ id: schema.profiles.id })
      .from(schema.profiles)
      .where(eq(schema.profiles.id, data.profileId))
      .limit(1);

    if (!profile) {
      throw new BadRequestException('Invalid profile ID.');
    }

    const [lead] = await this.dbService.db
      .insert(schema.leads)
      .values({
        id: crypto.randomUUID(),
        profileId: data.profileId,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        company: data.company || null,
        jobTitle: data.jobTitle || null,
        notes: data.notes || data.note || null,
        source: data.source || 'profile_exchange',
      })
      .returning();

    return lead;
  }
}
