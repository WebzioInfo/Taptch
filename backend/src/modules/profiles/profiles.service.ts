import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { RedisService } from '../../database/redis.service';
import * as schema from '../../database/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import type { ActorContext, PublicProfileSnapshot } from '../../common/types';
import * as crypto from 'crypto';

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(
    private dbService: DatabaseService,
    private redisService: RedisService,
  ) {}

  async findAllForActor(actor: ActorContext) {
    return this.dbService.withActor(actor, async (tx) => {
      return tx
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.ownerId, actor.userId))
        .orderBy(desc(schema.profiles.createdAt));
    });
  }

  async findOne(actor: ActorContext, profileId: string) {
    const profile = await this.dbService.withActor(actor, async (tx) => {
      const rows = await tx
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.id, profileId))
        .limit(1);
      return rows[0] || null;
    });

    if (!profile) {
      throw new NotFoundException(`Profile with id "${profileId}" not found.`);
    }

    if (profile.ownerId !== actor.userId && !actor.isAdmin) {
      throw new ForbiddenException('You do not own this profile.');
    }

    // Also fetch sections, businesses, catalogue
    const [sections, businesses, catalogue] = await Promise.all([
      this.dbService.db
        .select()
        .from(schema.profileSections)
        .where(eq(schema.profileSections.profileId, profileId))
        .orderBy(asc(schema.profileSections.displayOrder)),
      this.dbService.db
        .select()
        .from(schema.profileBusinesses)
        .where(eq(schema.profileBusinesses.profileId, profileId)),
      this.dbService.db
        .select()
        .from(schema.profileCatalogueItems)
        .where(eq(schema.profileCatalogueItems.profileId, profileId))
        .orderBy(asc(schema.profileCatalogueItems.displayOrder)),
    ]);

    return {
      ...profile,
      sections,
      businesses,
      catalogue,
    };
  }

  async findBySlug(slug: string): Promise<PublicProfileSnapshot> {
    const cacheKey = `profile:slug:${slug.toLowerCase()}`;

    // 1. Redis Cache (<50ms hot path)
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // Fall back to database
      }
    }

    // 2. Database Lookup
    const rows = await this.dbService.db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.slug, slug.toLowerCase()))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException(`Profile "${slug}" not found.`);
    }

    const profile = rows[0];

    const [sections, businesses, catalogue] = await Promise.all([
      this.dbService.db
        .select()
        .from(schema.profileSections)
        .where(eq(schema.profileSections.profileId, profile.id))
        .orderBy(asc(schema.profileSections.displayOrder)),
      this.dbService.db
        .select()
        .from(schema.profileBusinesses)
        .where(eq(schema.profileBusinesses.profileId, profile.id)),
      this.dbService.db
        .select()
        .from(schema.profileCatalogueItems)
        .where(eq(schema.profileCatalogueItems.profileId, profile.id))
        .orderBy(asc(schema.profileCatalogueItems.displayOrder)),
    ]);

    const snapshot: PublicProfileSnapshot = {
      id: profile.id,
      slug: profile.slug,
      displayName: profile.displayName,
      headline: profile.headline,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      coverUrl: profile.coverUrl,
      themeId: profile.templateId || 'obsidian-luxury',
      customThemeColors: (profile.themeConfig as Record<string, string>) || null,
      sections: sections.map((s) => ({
        id: s.id,
        sectionType: s.sectionType,
        title: s.title || '',
        content: (s.configJson as Record<string, unknown>) || {},
        orderIndex: s.displayOrder,
        isEnabled: s.isEnabled,
      })),
      businesses: businesses.map((b) => ({
        id: b.id,
        companyName: b.name,
        jobTitle: b.tagline,
        businessEmail: b.email || null,
        businessPhone: b.phone || null,
        businessWebsite: b.website || null,
        businessAddress: b.address || null,
        logoUrl: b.logoUrl,
        isPrimary: false,
      })),
      catalogue: catalogue.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        price: c.price ? String(c.price) : null,
        imageUrl: c.imageUrl,
        actionUrl: c.actionUrl,
        orderIndex: c.displayOrder,
        isActive: true,
      })),
      socialLinks: (profile.socialLinks as any) || null,
      phone: profile.phone,
      email: profile.email,
      whatsapp: profile.whatsapp,
      website: profile.website,
      address: profile.address,
    };

    // Edge cache for 1 hour
    await this.redisService.set(cacheKey, JSON.stringify(snapshot), 3600);

    return snapshot;
  }

  async create(actor: ActorContext, data: any) {
    const slug = (data.slug || `profile-${Date.now()}`).toLowerCase().trim();

    // Check slug collision
    const existing = await this.dbService.db
      .select({ id: schema.profiles.id })
      .from(schema.profiles)
      .where(eq(schema.profiles.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(`The profile slug "${slug}" is already taken.`);
    }

    const profileId = crypto.randomUUID();

    const created = await this.dbService.withActor(actor, async (tx) => {
      const [res] = await tx
        .insert(schema.profiles)
        .values({
          id: profileId,
          ownerId: actor.userId,
          organizationId: actor.orgId,
          slug,
          displayName: data.displayName || 'My Profile',
          headline: data.headline || null,
          bio: data.bio || null,
          templateId: data.themeId || 'obsidian-luxury',
          status: 'DRAFT',
          profileType: data.profileType || 'personal',
          phone: data.phone || null,
          whatsapp: data.whatsapp || null,
          email: data.email || null,
          website: data.website || null,
          address: data.address || null,
        })
        .returning();

      // Seed default contact info section
      await tx.insert(schema.profileSections).values({
        id: crypto.randomUUID(),
        profileId,
        sectionType: 'contact_info',
        title: 'Contact Details',
        displayOrder: 0,
        isEnabled: true,
        configJson: {},
      });

      return res;
    });

    return created;
  }

  async update(actor: ActorContext, profileId: string, data: any) {
    const existing = await this.findOne(actor, profileId);

    const updated = await this.dbService.withActor(actor, async (tx) => {
      const [res] = await tx
        .update(schema.profiles)
        .set({
          displayName: data.displayName !== undefined ? data.displayName : existing.displayName,
          headline: data.headline !== undefined ? data.headline : existing.headline,
          bio: data.bio !== undefined ? data.bio : existing.bio,
          avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : existing.avatarUrl,
          coverUrl: data.coverUrl !== undefined ? data.coverUrl : existing.coverUrl,
          phone: data.phone !== undefined ? data.phone : existing.phone,
          whatsapp: data.whatsapp !== undefined ? data.whatsapp : existing.whatsapp,
          email: data.email !== undefined ? data.email : existing.email,
          website: data.website !== undefined ? data.website : existing.website,
          address: data.address !== undefined ? data.address : existing.address,
          socialLinks: data.socialLinks !== undefined ? data.socialLinks : existing.socialLinks,
          templateId:
            data.templateId !== undefined
              ? data.templateId
              : data.themeId !== undefined
                ? data.themeId
                : existing.templateId,
          themeConfig:
            data.themeConfig !== undefined
              ? data.themeConfig
              : data.customThemeColors !== undefined
                ? data.customThemeColors
                : existing.themeConfig,
          updatedAt: new Date(),
        })
        .where(eq(schema.profiles.id, profileId))
        .returning();

      // Update businesses if provided
      if (Array.isArray(data.businesses)) {
        await tx
          .delete(schema.profileBusinesses)
          .where(eq(schema.profileBusinesses.profileId, profileId));

        for (let i = 0; i < data.businesses.length; i++) {
          const b = data.businesses[i];
          if (b.companyName || b.name) {
            await tx.insert(schema.profileBusinesses).values({
              id: b.id || crypto.randomUUID(),
              profileId,
              name: b.companyName || b.name,
              tagline: b.jobTitle || b.tagline || null,
              logoUrl: b.logoUrl || null,
              website: b.businessWebsite || b.website || b.websiteUrl || null,
              address: b.businessAddress || b.address || null,
              email: b.businessEmail || b.email || null,
              phone: b.businessPhone || b.phone || null,
              whatsapp: b.whatsapp || null,
              displayOrder: i,
            });
          }
        }
      }

      // Update catalogue items if provided
      if (Array.isArray(data.catalogue)) {
        await tx
          .delete(schema.profileCatalogueItems)
          .where(eq(schema.profileCatalogueItems.profileId, profileId));

        for (let i = 0; i < data.catalogue.length; i++) {
          const c = data.catalogue[i];
          if (c.title) {
            await tx.insert(schema.profileCatalogueItems).values({
              id: c.id || crypto.randomUUID(),
              profileId,
              type: c.type || 'product',
              title: c.title,
              description: c.description || null,
              price: c.price ? String(c.price) : null,
              currency: c.currency || 'INR',
              imageUrl: c.imageUrl || null,
              actionUrl: c.actionUrl || null,
              actionLabel: c.actionLabel || 'Enquire',
              displayOrder: i,
            });
          }
        }
      }

      return res;
    });

    // Invalidate Redis cache
    if (updated?.slug) {
      await this.redisService.del(`profile:slug:${updated.slug}`);
    }

    return updated;
  }

  async publish(actor: ActorContext, profileId: string) {
    const profile = await this.findOne(actor, profileId);

    // Pre-compile snapshot
    const snapshot = await this.findBySlug(profile.slug);

    const [published] = await this.dbService.withActor(actor, async (tx) => {
      return tx
        .update(schema.profiles)
        .set({
          status: 'PUBLISHED',
          publishedJson: snapshot as any,
          updatedAt: new Date(),
        })
        .where(eq(schema.profiles.id, profileId))
        .returning();
    });

    // Sync Redis
    await this.redisService.set(`profile:slug:${profile.slug}`, JSON.stringify(snapshot), 86400);

    return published;
  }

  async updateSections(actor: ActorContext, profileId: string, sections: any[]) {
    await this.findOne(actor, profileId);

    await this.dbService.withActor(actor, async (tx) => {
      for (let i = 0; i < sections.length; i++) {
        const s = sections[i];
        if (s.id) {
          await tx
            .update(schema.profileSections)
            .set({
              displayOrder: i,
              isEnabled: s.isEnabled ?? true,
              title: s.title || '',
              configJson: s.content || {},
            })
            .where(
              and(
                eq(schema.profileSections.id, s.id),
                eq(schema.profileSections.profileId, profileId),
              ),
            );
        }
      }
    });

    return { success: true };
  }
}
