import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
  Optional,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { RedisService } from '../../database/redis.service';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { SEEDED_TEMPLATES } from '../templates/templates.service';
import * as schema from '../../database/schema';
import { eq, and, desc, asc, ne, or } from 'drizzle-orm';
import type { ActorContext, PublicProfileSnapshot } from '../../common/types';
import { isReservedUsername } from '../../common/constants/reserved-usernames';
import * as crypto from 'crypto';

/**
 * Validate username format.
 * Rules: lowercase letters, digits, hyphens; 3–32 chars;
 *   must start and end with a letter or digit; no consecutive hyphens.
 */
function isValidUsernameFormat(username: string): boolean {
  if (!username || username.length < 3 || username.length > 32) return false;
  // Must start and end with alnum; body allows alnum + hyphen
  if (!/^[a-z0-9][a-z0-9\-]{1,30}[a-z0-9]$/.test(username) && !/^[a-z0-9]{3,32}$/.test(username)) return false;
  // No consecutive hyphens
  if (/--/.test(username)) return false;
  return true;
}

function getUsernameError(username: string): string | null {
  if (!username || !username.trim()) return 'Username is required.';
  const clean = username.toLowerCase().trim();
  if (clean.length < 3) return 'Username must be at least 3 characters.';
  if (clean.length > 32) return 'Username must be at most 32 characters.';
  if (/\s/.test(clean)) return 'Username must not contain spaces.';
  if (!/^[a-z0-9\-]+$/.test(clean)) return 'Username may only contain lowercase letters, numbers, and hyphens.';
  if (clean.startsWith('-') || clean.endsWith('-')) return 'Username must not start or end with a hyphen.';
  if (/--/.test(clean)) return 'Username must not contain consecutive hyphens.';
  if (isReservedUsername(clean)) return `"${clean}" is a reserved system name and cannot be used as a username.`;
  return null;
}

const VALID_TEMPLATE_ALIASES = new Set([
  'cinematic-noir',
  // Legacy template IDs preserved for existing profile compatibility
  'obsidian-luxury',
  'ivory-minimalist',
  'aurora-creator',
  'corporate-business',
  'modern-business',
  'apex-capital',
  'industrial-manufacturing',
  'retail-shopping',
  'food-restaurant',
  'clean-corporate',
  'dark-premium',
  'soft-modern',
  'bold-editorial',
  'premium-brand',
  'professional-services',
  'creative-agency',
  ...SEEDED_TEMPLATES.map((t) => t.id),
  ...SEEDED_TEMPLATES.map((t) => t.slug),
]);

const LEGACY_PERSONAL_TEMPLATE_IDS = new Set([
  '',
  'cinematic-noir',
  'obsidian-luxury',
  'obsidian',
  'premium-brand',
  'clean-corporate',
  'dark-premium',
  'soft-modern',
  'bold-editorial',
  'ivory-minimal',
  'ivory-minimalist',
  'aurora-creator',
  'apex-capital',
]);

export function resolveActiveTemplateId(rawId?: string | null, profileType?: string | null): string {
  const norm = (rawId || '').toLowerCase().trim();
  const isBusiness = (profileType || '').toLowerCase().trim() === 'business';
  if (isBusiness) {
    return norm || 'corporate-business';
  }
  if (LEGACY_PERSONAL_TEMPLATE_IDS.has(norm)) {
    return 'cinematic-noir';
  }
  return norm || 'cinematic-noir';
}

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(
    private dbService: DatabaseService,
    private redisService: RedisService,
    @Optional() private entitlementsService?: EntitlementsService,
  ) { }

  async findAllForActor(actor: ActorContext) {
    return this.dbService.withActor(actor, async (tx) => {
      return tx
        .select()
        .from(schema.profiles)
        .where(
          and(
            eq(schema.profiles.ownerId, actor.userId),
            ne(schema.profiles.status, 'DELETED'),
            ne(schema.profiles.status, 'ARCHIVED')
          )
        )
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
        .where(eq(schema.profileBusinesses.profileId, profileId))
        .orderBy(asc(schema.profileBusinesses.displayOrder)),
      this.dbService.db
        .select()
        .from(schema.profileCatalogueItems)
        .where(eq(schema.profileCatalogueItems.profileId, profileId))
        .orderBy(asc(schema.profileCatalogueItems.displayOrder)),
    ]);

    const resolvedTemplateId = resolveActiveTemplateId(
      profile.templateId || profile.themeId,
      profile.profileType,
    );

    return {
      ...profile,
      templateId: resolvedTemplateId,
      themeId: resolvedTemplateId,
      sections,
      businesses: businesses.map((b) => ({
        ...b,
        companyName: b.name,
        name: b.name,
        jobTitle: b.tagline,
        tagline: b.tagline,
        businessWebsite: b.website,
        websiteUrl: b.website,
        website: b.website,
        businessAddress: b.address,
        address: b.address,
        businessEmail: b.email,
        email: b.email,
        businessPhone: b.phone,
        phone: b.phone,
      })),
      catalogue: catalogue.map((c) => ({
        ...c,
        type: c.type || 'product',
        actionLabel: c.actionLabel || 'Enquire',
      })),
    };
  }

  async checkUsernameAvailability(
    rawUsername: string,
    excludeProfileId ?: string,
  ): Promise < {
    available: boolean;
    username: string;
    reason?: string;
    publicUrl?: string;
  } > {
    const clean = (rawUsername || '').toLowerCase().trim();
    const formatError = getUsernameError(clean);
    if(formatError) {
      return {
        available: false,
        username: clean,
        reason: formatError,
      };
    }

    const existingRows = await this.dbService.db
      .select({ id: schema.profiles.id })
      .from(schema.profiles)
      .where(
        excludeProfileId
          ? and(eq(schema.profiles.slug, clean), ne(schema.profiles.id, excludeProfileId))
          : eq(schema.profiles.slug, clean),
      )
      .limit(1);

    if(existingRows.length > 0) {
      return {
        available: false,
        username: clean,
        reason: `The username "${clean}" is already taken.`,
      };
    }

    // Also check historical username aliases so old NFC URLs are never hijacked
    const aliasRows = await this.dbService.db
      .select({ id: schema.usernameAliases.id, profileId: schema.usernameAliases.profileId })
      .from(schema.usernameAliases)
      .where(eq(schema.usernameAliases.alias, clean))
      .limit(1);

    if (aliasRows.length > 0 && (!excludeProfileId || aliasRows[0].profileId !== excludeProfileId)) {
      return {
        available: false,
        username: clean,
        reason: `The username "${clean}" is reserved from a previous profile.`,
      };
    }

    const baseUrl = (
      process.env.NFC_PUBLIC_BASE_URL ||
      process.env.PUBLIC_APP_URL ||
      'https://taptch.com'
    )
      .trim()
      .replace(/\/+$/, '');

    return {
      available: true,
      username: clean,
      publicUrl: `${baseUrl}/${clean}`,
    };
  }

  async findBySlug(
    slug: string,
    options?: { allowUnpublished?: boolean },
  ): Promise<PublicProfileSnapshot> {
    if (isReservedUsername(slug)) {
      throw new NotFoundException(`Profile "${slug}" not found.`);
    }

    const cleanSlug = slug.toLowerCase().trim();
    const cacheKey = `profile:slug:${cleanSlug}`;

    // 1. Redis Cache (<50ms hot path) + negative cache for 404s
        if (!options?.allowUnpublished) {
          const [cached, notFoundCached] = await Promise.all([
            this.redisService.get(cacheKey),
            this.redisService.get(`profile:notfound:${cleanSlug}`),
          ]);
          if (notFoundCached) {
            throw new NotFoundException(`Profile "${slug}" not found.`);
          }
          if (cached) {
            try {
              return JSON.parse(cached);
            } catch {
              // Fall back to database
            }
          }
        }

        // 2. Database Lookup (direct slug first, then username_aliases fallback)
        let rows = await this.dbService.db
          .select()
          .from(schema.profiles)
          .where(eq(schema.profiles.slug, cleanSlug))
          .limit(1);

        if (rows.length === 0) {
          const aliasRows = await this.dbService.db
            .select({ profileId: schema.usernameAliases.profileId })
            .from(schema.usernameAliases)
            .where(eq(schema.usernameAliases.alias, cleanSlug))
            .limit(1);

          if (aliasRows.length > 0) {
            rows = await this.dbService.db
              .select()
              .from(schema.profiles)
              .where(eq(schema.profiles.id, aliasRows[0].profileId))
              .limit(1);
          }
        }

        if (rows.length === 0) {
          await this.redisService.set(`profile:notfound:${cleanSlug}`, '1', 60);
          throw new NotFoundException(`Profile "${slug}" not found.`);
        }

        const profile = rows[0];

        // Enforce public visibility: never leak private fields for DRAFT, SUSPENDED, REJECTED, or UNPUBLISHED profiles
        const isPubliclyVisible =
          profile.status === 'PUBLISHED' ||
          profile.status === 'ACTIVE' ||
          profile.status === 'APPROVED';

        if (!options?.allowUnpublished && !isPubliclyVisible) {
          return {
            id: profile.id,
            slug: profile.slug,
            status: profile.status,
          } as unknown as PublicProfileSnapshot;
        }

        // Fast path: if pre-compiled publishedJson snapshot exists, serve it directly without 3 extra DB queries
        const precompiled = profile.publishedJson as Record<string, unknown> | null | undefined;
        if (
          !options?.allowUnpublished &&
          isPubliclyVisible &&
          precompiled &&
          typeof precompiled === 'object' &&
          typeof precompiled.slug === 'string' &&
          typeof precompiled.displayName === 'string'
        ) {
          const resolvedSnapshotTpl = resolveActiveTemplateId(
            (precompiled.templateId as string | undefined) || profile.templateId || profile.themeId,
            (precompiled.profileType as string | undefined) || profile.profileType,
          );
          const fastSnapshot = {
            ...(precompiled as unknown as PublicProfileSnapshot),
            templateId: resolvedSnapshotTpl,
            themeId: resolvedSnapshotTpl,
            status: profile.status,
          };
          await this.redisService.set(cacheKey, JSON.stringify(fastSnapshot), 3600);
          return fastSnapshot;
        }

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

        const resolvedPublicTemplateId = resolveActiveTemplateId(
          profile.templateId || profile.themeId,
          profile.profileType,
        );

        const snapshot: PublicProfileSnapshot = {
          id: profile.id,
          slug: profile.slug,
          displayName: profile.displayName,
          headline: profile.headline,
          bio: profile.bio,
          avatarUrl: profile.avatarUrl,
          coverUrl: profile.coverUrl,
          themeId: resolvedPublicTemplateId,
          templateId: resolvedPublicTemplateId,
          customThemeColors: (profile.themeConfig as Record<string, string>) || null,
          themeConfig: (profile.themeConfig as Record<string, unknown>) || null,
          profileType: profile.profileType || 'personal',
          status: profile.status,
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
            description: b.description || null,
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
            type: c.type || 'product',
            description: c.description,
            price: c.price ? String(c.price) : null,
            imageUrl: c.imageUrl,
            actionUrl: c.actionUrl,
            actionLabel: c.actionLabel || 'Enquire',
            orderIndex: c.displayOrder,
            isActive: true,
          })),
          socialLinks: (profile.socialLinks as any) || null,
          phone: profile.phone,
          email: profile.email,
          whatsapp: profile.whatsapp,
          website: profile.website,
          address: profile.address,
          location: profile.location || null,
          customFields: (profile.customFields as Record<string, unknown>) || null,
        };

        // Edge cache for 1 hour
        await this.redisService.set(cacheKey, JSON.stringify(snapshot), 3600);

        return snapshot;
      }

  async create(actor: ActorContext, data: any) {
        // 1. Enforce account-type & plan entitlement limits on profile creation
        let actorAccountType: 'personal' | 'business' | null = null;
        if (this.entitlementsService && !actor.isAdmin) {
          const [entitlements, existingProfiles] = await Promise.all([
            this.entitlementsService.getActorEntitlements(actor),
            this.dbService.db
              .select({ id: schema.profiles.id, status: schema.profiles.status })
              .from(schema.profiles)
              .where(
                and(
                  eq(schema.profiles.ownerId, actor.userId),
                  ne(schema.profiles.status, 'DELETED'),
                  ne(schema.profiles.status, 'ARCHIVED')
                )
              ),
          ]);

          actorAccountType = entitlements.accountType || null;

          if (existingProfiles.length >= entitlements.maxProfiles) {
            throw new ForbiddenException(
              entitlements.accountType === 'personal'
                ? 'Personal accounts are limited to 1 digital profile. Upgrade to a Business Account to create multiple profiles.'
                : `Your current plan allows up to ${entitlements.maxProfiles} profiles. Please upgrade your plan to add more.`,
            );
          }
        } else if (!actor.isAdmin) {
          // If entitlements service not initialized, fetch accountType from user row
          const [u] = await this.dbService.db
            .select({ accountType: schema.users.accountType })
            .from(schema.users)
            .where(eq(schema.users.id, actor.userId))
            .limit(1);
          actorAccountType = (u?.accountType as 'personal' | 'business' | null) || null;
        }

        // 2. Validate templateId and profileType against user account type
        const requestedTemplateId = data.templateId || data.themeId;
        if (requestedTemplateId && !VALID_TEMPLATE_ALIASES.has(requestedTemplateId)) {
          const dbTpl = await this.dbService.db
            .select({
              id: schema.templates.id,
              supportedProfileTypes: schema.templates.supportedProfileTypes,
              category: schema.templates.category,
            })
            .from(schema.templates)
            .where(eq(schema.templates.id, requestedTemplateId))
            .limit(1);
          if (dbTpl.length === 0) {
            throw new BadRequestException(`Invalid profile template ID "${requestedTemplateId}".`);
          }
        }

        // Account-type enforcement on profile creation
        if (!actor.isAdmin && actorAccountType) {
          // Check requested profileType
          if (actorAccountType === 'personal' && data.profileType === 'business') {
            throw new ForbiddenException('Personal accounts cannot create Business & Services profiles. Upgrade to a Business account.');
          }
          if (actorAccountType === 'business' && data.profileType === 'personal') {
            throw new ForbiddenException('Business accounts must create Business profiles.');
          }

          // Check template compatibility with accountType
          const targetTplId = requestedTemplateId || 'cinematic-noir';
          const seededMatch = SEEDED_TEMPLATES.find((t) => t.id === targetTplId || t.slug === targetTplId);
          if (seededMatch) {
            if (actorAccountType === 'personal' && seededMatch.templateType === 'BUSINESS') {
              throw new ForbiddenException(`Template "${seededMatch.name}" is a Business template and is not allowed for Personal accounts.`);
            }
            if (actorAccountType === 'business' && seededMatch.templateType === 'PERSONAL' && !seededMatch.supportedProfileTypes.includes('business')) {
              throw new ForbiddenException(`Template "${seededMatch.name}" is a Personal template and is not allowed for Business accounts.`);
            }
          }
        }

          const rawSlug = (data.username ?? data.slug ?? '').toString().toLowerCase().trim();
          const formatError = getUsernameError(rawSlug);
          if (formatError) {
            throw new BadRequestException(formatError);
          }
          const slug = rawSlug;

          // Check slug collision across profiles (and username aliases)
          const existing = await this.dbService.db
            .select({ id: schema.profiles.id })
            .from(schema.profiles)
            .where(eq(schema.profiles.slug, slug))
            .limit(1);

          if (existing.length > 0) {
            throw new ConflictException(`The username "${slug}" is already taken.`);
          }

          const aliasCollision = await this.dbService.db
            .select({ id: schema.usernameAliases.id })
            .from(schema.usernameAliases)
            .where(eq(schema.usernameAliases.alias, slug))
            .limit(1);

          if (aliasCollision.length > 0) {
            throw new ConflictException(`The username "${slug}" is already reserved from a previous profile.`);
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
                avatarUrl: data.avatarUrl || null,
                coverUrl: data.coverUrl || null,
                templateId: resolveActiveTemplateId(data.templateId || data.themeId, data.profileType || 'personal'),
                themeId: resolveActiveTemplateId(data.themeId || data.templateId, data.profileType || 'personal'),
                themeConfig: data.themeConfig || data.customThemeColors || {},
                customFields: data.customFields || {},
                socialLinks: Array.isArray(data.socialLinks) ? data.socialLinks : [],
                status: 'DRAFT',
                profileType: data.profileType || 'personal',
                phone: data.phone || data.phoneNumber || data.directPhone || null,
                whatsapp: data.whatsapp || data.whatsappNumber || data.whatsappDirectNumber || null,
                email: data.email || null,
                website: data.website || null,
                address: data.address || null,
                location: data.location || null,
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

            // Insert businesses if provided on creation
            if (Array.isArray(data.businesses)) {
              for (let i = 0; i < data.businesses.length; i++) {
                const b = data.businesses[i];
                if (b.companyName || b.name) {
                  await tx.insert(schema.profileBusinesses).values({
                    id: b.id || crypto.randomUUID(),
                    profileId,
                    name: b.companyName || b.name,
                    tagline: b.jobTitle || b.tagline || null,
                    description: b.description || null,
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

            // Insert catalogue items if provided on creation
            if (Array.isArray(data.catalogue)) {
              for (let i = 0; i < data.catalogue.length; i++) {
                const c = data.catalogue[i];
                if (c.title) {
                  await tx.insert(schema.profileCatalogueItems).values({
                    id: c.id || crypto.randomUUID(),
                    profileId,
                    type: c.type || c.itemType || 'product',
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

          return created;
        }

  async update(actor: ActorContext, profileId: string, data: any) {
          const existing = await this.findOne(actor, profileId);

          // If username/slug is provided and changed, check lock, validate, check uniqueness, and preserve alias
          let nextSlug = existing.slug;
              const requestedSlug = (data.username ?? data.slug)?.toString().toLowerCase().trim();
              const slugChanged = Boolean(requestedSlug && requestedSlug !== existing.slug);

              if (slugChanged && requestedSlug) {
                if ((existing as any).usernameLocked) {
                  throw new ForbiddenException(
                    'This username is locked because an NFC card has already been linked to it. Contact support to request a change.',
                  );
                }

                const formatError = getUsernameError(requestedSlug);
                if (formatError) {
                  throw new BadRequestException(formatError);
                }

                const collision = await this.dbService.db
                  .select({ id: schema.profiles.id })
                  .from(schema.profiles)
                  .where(and(eq(schema.profiles.slug, requestedSlug), ne(schema.profiles.id, profileId)))
                  .limit(1);
                if (collision.length > 0) {
                  throw new ConflictException(`The username "${requestedSlug}" is already taken.`);
                }

                const aliasCollision = await this.dbService.db
                  .select({ id: schema.usernameAliases.id, profileId: schema.usernameAliases.profileId })
                  .from(schema.usernameAliases)
                  .where(eq(schema.usernameAliases.alias, requestedSlug))
                  .limit(1);
                if (aliasCollision.length > 0 && aliasCollision[0].profileId !== profileId) {
                  throw new ConflictException(`The username "${requestedSlug}" is reserved from a previous profile.`);
                }

                nextSlug = requestedSlug;
              }

              const updated = await this.dbService.withActor(actor, async (tx) => {
                const [res] = await tx
                  .update(schema.profiles)
                  .set({
                    slug: nextSlug,
                    profileType: data.profileType !== undefined ? data.profileType : existing.profileType,
                    displayName: data.displayName !== undefined ? data.displayName : existing.displayName,
                    headline: data.headline !== undefined ? data.headline : existing.headline,
                    bio: data.bio !== undefined ? data.bio : existing.bio,
                    avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : existing.avatarUrl,
                    coverUrl: data.coverUrl !== undefined ? data.coverUrl : existing.coverUrl,
                    phone: data.phone !== undefined ? data.phone : data.phoneNumber !== undefined ? data.phoneNumber : existing.phone,
                    whatsapp:
                      data.whatsapp !== undefined
                        ? data.whatsapp
                        : data.whatsappNumber !== undefined
                          ? data.whatsappNumber
                          : data.whatsappDirectNumber !== undefined
                            ? data.whatsappDirectNumber
                            : existing.whatsapp,
                    email: data.email !== undefined ? data.email : existing.email,
                    website: data.website !== undefined ? data.website : existing.website,
                    address: data.address !== undefined ? data.address : existing.address,
                    location: data.location !== undefined ? data.location : existing.location,
                    socialLinks: data.socialLinks !== undefined ? data.socialLinks : existing.socialLinks,
                    customFields: data.customFields !== undefined ? data.customFields : existing.customFields,
                    templateId: resolveActiveTemplateId(
                      data.templateId !== undefined
                        ? data.templateId
                        : data.themeId !== undefined
                          ? data.themeId
                          : existing.templateId,
                      data.profileType !== undefined ? data.profileType : existing.profileType,
                    ),
                    themeId: resolveActiveTemplateId(
                      data.templateId !== undefined
                        ? data.templateId
                        : data.themeId !== undefined
                          ? data.themeId
                          : existing.themeId,
                      data.profileType !== undefined ? data.profileType : existing.profileType,
                    ),
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
                        description: b.description || null,
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
                        type: c.type || (c as any).itemType || 'product',
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

                // Preserve old username as a permanent alias & sync linked purchased cards
                if (slugChanged && existing.slug) {
                  try {
                    await tx.insert(schema.usernameAliases).values({
                      id: crypto.randomUUID(),
                      profileId,
                      alias: existing.slug.toLowerCase(),
                    });
                  } catch {
                    // Alias already exists
                  }
                  const baseUrl = (
                    process.env.NFC_PUBLIC_BASE_URL ||
                    process.env.PUBLIC_APP_URL ||
                    'https://taptch.com'
                  )
                    .trim()
                    .replace(/\/+$/, '');
                  await tx
                    .update(schema.purchasedCards)
                    .set({
                      nfcUrl: `${baseUrl}/${nextSlug}`,
                      profileUsername: nextSlug,
                      updatedAt: new Date(),
                    })
                    .where(eq(schema.purchasedCards.profileId, profileId));
                }

                return res;
              });

              // Invalidate Redis cache
              if (existing?.slug) {
                await this.redisService.del(`profile:slug:${existing.slug.toLowerCase()}`);
              }
              if (updated?.slug && updated.slug !== existing?.slug) {
                await this.redisService.del(`profile:slug:${updated.slug.toLowerCase()}`);
              }

              return updated;
            }

  async publish(actor: ActorContext, profileId: string) {
              const profile = await this.findOne(actor, profileId);

              // Invalidate any existing stale cache before compiling fresh snapshot
              await this.redisService.del(`profile:slug:${profile.slug.toLowerCase()}`);

              // Pre-compile snapshot directly from fresh DB records and mark status PUBLISHED
              const snapshot = await this.findBySlug(profile.slug, { allowUnpublished: true });
              snapshot.status = 'PUBLISHED';

              const [published] = await this.dbService.withActor(actor, async (tx) => {
                return tx
                  .update(schema.profiles)
                  .set({
                    status: 'PUBLISHED',
                    publishedJson: snapshot as any,
                    publishedAt: new Date(),
                    updatedAt: new Date(),
                  })
                  .where(eq(schema.profiles.id, profileId))
                  .returning();
              });

              // Sync fresh Redis cache for 24h with PUBLISHED status
              await this.redisService.set(`profile:slug:${profile.slug.toLowerCase()}`, JSON.stringify(snapshot), 86400);

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

  async remove(actor: ActorContext, profileId: string) {
    const profile = await this.findOne(actor, profileId);

    await this.dbService.withActor(actor, async (tx) => {
      // Soft-delete by marking status = 'DELETED' so the user's limit is freed
      await tx
        .update(schema.profiles)
        .set({
          status: 'DELETED',
          updatedAt: new Date(),
        })
        .where(eq(schema.profiles.id, profileId));

      // Detach any cards linked to this deleted profile
      await tx
        .update(schema.purchasedCards)
        .set({
          profileId: null,
          profileUsername: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.purchasedCards.profileId, profileId));
    });

    if (profile?.slug) {
      await this.redisService.del(`profile:slug:${profile.slug.toLowerCase()}`);
    }

    return { success: true, id: profileId };
  }
}
