import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { ActorContext } from '../../common/types';
import * as crypto from 'crypto';

@Injectable()
export class DesignsService {
  private readonly logger = new Logger(DesignsService.name);

  constructor(private dbService: DatabaseService) { }

  async findAllForActor(actor: ActorContext) {
    return this.dbService.withActor(actor, async (tx) => {
      return tx
        .select()
        .from(schema.cardDesigns)
        .where(eq(schema.cardDesigns.customerId, actor.userId))
        .orderBy(desc(schema.cardDesigns.updatedAt));
    });
  }

  async findDraft(actor: ActorContext, productId: string, templateId?: string) {
    return this.dbService.withActor(actor, async (tx) => {
      const conditions = [
        eq(schema.cardDesigns.customerId, actor.userId),
        eq(schema.cardDesigns.productId, productId),
        eq(schema.cardDesigns.isDraft, true),
      ];

      if (templateId) {
        conditions.push(eq(schema.cardDesigns.templateId, templateId));
      }

      const [draft] = await tx
        .select()
        .from(schema.cardDesigns)
        .where(and(...conditions))
        .orderBy(desc(schema.cardDesigns.updatedAt))
        .limit(1);

      return draft || null;
    });
  }

  async upsertDraft(actor: ActorContext, data: any) {
    return this.dbService.withActor(actor, async (tx) => {
      try {
        // 1. Sanitize payload fields
        const rawName = (typeof data?.name === 'string' ? data.name.trim() : '') || 'Untitled NFC Card';
        const name = rawName.substring(0, 128);

        const frontCanvasJson = typeof data?.frontCanvasJson === 'object'
          ? JSON.stringify(data.frontCanvasJson)
          : (typeof data?.frontCanvasJson === 'string' && data.frontCanvasJson.trim().length > 0 ? data.frontCanvasJson : '{}');

              const backCanvasJson = typeof data?.backCanvasJson === 'object'
                ? JSON.stringify(data.backCanvasJson)
                : (typeof data?.backCanvasJson === 'string' && data.backCanvasJson.trim().length > 0 ? data.backCanvasJson : null);

              const previewUrl = typeof data?.previewUrl === 'string' && data.previewUrl.trim().length > 0 ? data.previewUrl : null;
              const backPreviewUrl = typeof data?.backPreviewUrl === 'string' && data.backPreviewUrl.trim().length > 0 ? data.backPreviewUrl : null;

              // 2. Validate & resolve productId against card_products
              let resolvedProductId = data?.productId || 'prod_classic_pvc';
              const [prodRecord] = await tx
                .select({ id: schema.cardProducts.id })
                .from(schema.cardProducts)
                .where(eq(schema.cardProducts.id, resolvedProductId))
                .limit(1);

              if(!prodRecord) {
                // If the specified product doesn't exist, check for any active product in the table
                const [fallbackProd] = await tx
                  .select({ id: schema.cardProducts.id })
                  .from(schema.cardProducts)
                  .limit(1);

                if (fallbackProd) {
                  resolvedProductId = fallbackProd.id;
                } else {
                  // Seed a default card_product record on-the-fly if table is completely empty
                  await tx.insert(schema.cardProducts).values({
                    id: resolvedProductId,
                    name: 'Classic White PVC NFC Card',
                    slug: 'classic-white-pvc-nfc-card',
                    description: 'Default NFC card product',
                    basePrice: 1499,
                    canvasWidth: 1050,
                    canvasHeight: 600,
                    safeZone: 40,
                    bleedZone: 25,
                    supportedSides: 'FRONT_AND_BACK',
                    mockupType: 'CARD_3D',
                    isActive: true,
                  }).onConflictDoNothing();
                }
              }

        // 3. Validate templateId against card_design_templates (ignore non-existent or 'custom' slugs)
        let resolvedTemplateId: string | null = null;
              if(data?.templateId && typeof data.templateId === 'string' && data.templateId !== 'custom') {
                const [tplRecord] = await tx
                  .select({ id: schema.cardDesignTemplates.id })
                  .from(schema.cardDesignTemplates)
                  .where(eq(schema.cardDesignTemplates.id, data.templateId))
                  .limit(1);
          if (tplRecord) {
            resolvedTemplateId = tplRecord.id;
          }
        }

        // 4. Validate variantId against card_product_variants
        let resolvedVariantId: string | null = null;
        if (data?.variantId && typeof data.variantId === 'string') {
          const [varRecord] = await tx
            .select({ id: schema.cardProductVariants.id })
            .from(schema.cardProductVariants)
            .where(eq(schema.cardProductVariants.id, data.variantId))
            .limit(1);
          if (varRecord) {
            resolvedVariantId = varRecord.id;
          }
        }

        // 4b. Validate profileId ownership if provided
        let resolvedProfileId: string | null = null;
        if (data?.profileId && typeof data.profileId === 'string') {
          const [prof] = await tx
            .select({ id: schema.profiles.id, ownerId: schema.profiles.ownerId })
            .from(schema.profiles)
            .where(eq(schema.profiles.id, data.profileId))
            .limit(1);
          if (!prof) {
            throw new NotFoundException(`Profile ${data.profileId} not found.`);
          }
          if (prof.ownerId !== actor.userId && !actor.isAdmin) {
            throw new ForbiddenException('You cannot attach a card design to another user\'s profile.');
          }
          resolvedProfileId = prof.id;
        }

        // 5. Check if design already exists: by explicit ID first, or by customer draft
        const targetDesignId = data?.designId || data?.id;
        let existing: any = null;

        if (targetDesignId && typeof targetDesignId === 'string' && targetDesignId !== 'draft') {
          const [foundById] = await tx
            .select()
            .from(schema.cardDesigns)
            .where(
              and(
                eq(schema.cardDesigns.id, targetDesignId),
                eq(schema.cardDesigns.customerId, actor.userId)
              )
            )
            .limit(1);
          if (foundById) {
            existing = foundById;
          }
        }

        if (!existing) {
          const draftConditions = [
            eq(schema.cardDesigns.customerId, actor.userId),
            eq(schema.cardDesigns.productId, resolvedProductId),
            eq(schema.cardDesigns.isDraft, true),
          ];
          if (resolvedTemplateId) {
            draftConditions.push(eq(schema.cardDesigns.templateId, resolvedTemplateId));
          }

          const [foundByDraft] = await tx
            .select()
            .from(schema.cardDesigns)
            .where(and(...draftConditions))
            .orderBy(desc(schema.cardDesigns.updatedAt))
            .limit(1);

          if (foundByDraft) {
            existing = foundByDraft;
          }
        }

        if (existing) {
          const [updated] = await tx
            .update(schema.cardDesigns)
            .set({
              name,
              productId: resolvedProductId,
              variantId: resolvedVariantId ?? existing.variantId,
              templateId: resolvedTemplateId ?? existing.templateId,
              profileId: resolvedProfileId ?? existing.profileId,
              frontCanvasJson,
              backCanvasJson: backCanvasJson !== undefined ? backCanvasJson : existing.backCanvasJson,
              previewUrl: previewUrl || existing.previewUrl,
              backPreviewUrl: backPreviewUrl || existing.backPreviewUrl,
              updatedAt: new Date(),
            })
            .where(eq(schema.cardDesigns.id, existing.id))
            .returning();
          return updated;
        }

        // 6. Create new draft
        const newId = (targetDesignId && typeof targetDesignId === 'string' && targetDesignId.length <= 64 && targetDesignId !== 'draft')
          ? targetDesignId
          : crypto.randomUUID();

        const [created] = await tx
          .insert(schema.cardDesigns)
          .values({
            id: newId,
            customerId: actor.userId,
            productId: resolvedProductId,
            templateId: resolvedTemplateId,
            variantId: resolvedVariantId,
            profileId: resolvedProfileId,
            name,
            frontCanvasJson,
            backCanvasJson,
            previewUrl,
            backPreviewUrl,
            isDraft: true,
          })
          .returning();

        return created;
      } catch (err: any) {
        this.logger.error(`[DesignsService.upsertDraft] Failed to save draft for user ${actor.userId}: ${err.message}`, err.stack);
        throw err;
      }
    });
  }

  async resetDraft(actor: ActorContext, productId: string, templateId: string) {
    return this.dbService.withActor(actor, async (tx) => {
      // Find template
      const [template] = await tx
        .select()
        .from(schema.cardDesignTemplates)
        .where(eq(schema.cardDesignTemplates.id, templateId));

      if (!template) {
        throw new NotFoundException(`Template ${templateId} not found`);
      }

      return this.upsertDraft(actor, {
        productId,
        templateId,
        name: template.name,
        frontCanvasJson: template.frontCanvasJson,
        backCanvasJson: template.backCanvasJson,
        previewUrl: template.previewUrl,
      });
    });
  }

  async create(actor: ActorContext, data: any) {
    const newId = crypto.randomUUID();
    return this.dbService.withActor(actor, async (tx) => {
      const [created] = await tx
        .insert(schema.cardDesigns)
        .values({
          id: newId,
          customerId: actor.userId,
          productId: data.productId || 'prod_classic_pvc',
          templateId: data.templateId || null,
          variantId: data.variantId || null,
          name: data.name || 'Untitled NFC Card',
          frontCanvasJson: data.frontCanvasJson || '{}',
          backCanvasJson: data.backCanvasJson || null,
          previewUrl: data.previewUrl || null,
          backPreviewUrl: data.backPreviewUrl || null,
          isDraft: false,
        })
        .returning();
      return created;
    });
  }

  async findOne(actor: ActorContext, id: string) {
    return this.dbService.withActor(actor, async (tx) => {
      const [design] = await tx
        .select()
        .from(schema.cardDesigns)
        .where(eq(schema.cardDesigns.id, id));

      if (!design) {
        throw new NotFoundException(`Design ${id} not found`);
      }

      if (design.customerId !== actor.userId && !actor.isAdmin) {
        throw new ForbiddenException('You do not have access to this design');
      }

      return design;
    });
  }

  async update(actor: ActorContext, id: string, data: any) {
    await this.findOne(actor, id);

    return this.dbService.withActor(actor, async (tx) => {
      const [updated] = await tx
        .update(schema.cardDesigns)
        .set({
          name: data.name,
          frontCanvasJson: data.frontCanvasJson,
          backCanvasJson: data.backCanvasJson,
          previewUrl: data.previewUrl,
          backPreviewUrl: data.backPreviewUrl,
          isDraft: data.isDraft !== undefined ? data.isDraft : undefined,
          updatedAt: new Date(),
        })
        .where(eq(schema.cardDesigns.id, id))
        .returning();

      return updated;
    });
  }

  async duplicate(actor: ActorContext, id: string) {
    const original = await this.findOne(actor, id);
    const newId = crypto.randomUUID();

    return this.dbService.withActor(actor, async (tx) => {
      const [duplicated] = await tx
        .insert(schema.cardDesigns)
        .values({
          id: newId,
          customerId: actor.userId,
          productId: original.productId,
          templateId: original.templateId,
          variantId: original.variantId,
          name: `${original.name} (Copy)`,
          frontCanvasJson: original.frontCanvasJson,
          backCanvasJson: original.backCanvasJson,
          previewUrl: original.previewUrl,
          backPreviewUrl: original.backPreviewUrl,
          isDraft: false,
        })
        .returning();

      return duplicated;
    });
  }

  async attachProfile(actor: ActorContext, id: string, profileId: string) {
    await this.findOne(actor, id);

    return this.dbService.withActor(actor, async (tx) => {
      const [profile] = await tx
        .select({ id: schema.profiles.id, ownerId: schema.profiles.ownerId })
        .from(schema.profiles)
        .where(eq(schema.profiles.id, profileId))
        .limit(1);

      if (!profile) {
        throw new NotFoundException(`Profile ${profileId} not found.`);
      }

      if (profile.ownerId !== actor.userId && !actor.isAdmin) {
        throw new ForbiddenException('You cannot attach a card design to another user\'s profile.');
      }

      const [updated] = await tx
        .update(schema.cardDesigns)
        .set({
          profileId,
          updatedAt: new Date(),
        })
        .where(eq(schema.cardDesigns.id, id))
        .returning();

      return updated;
    });
  }

  async delete(actor: ActorContext, id: string) {
    await this.findOne(actor, id);

    return this.dbService.withActor(actor, async (tx) => {
      await tx.delete(schema.cardDesigns).where(eq(schema.cardDesigns.id, id));
      return { success: true, message: 'Design deleted successfully' };
    });
  }
}
