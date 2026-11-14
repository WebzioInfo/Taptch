import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { ActorContext } from '../../common/types';
import * as crypto from 'crypto';

@Injectable()
export class DesignsService {
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
    const productId = data.productId || 'prod_classic_pvc';
    const templateId = data.templateId || null;

    return this.dbService.withActor(actor, async (tx) => {
      // Check existing draft
      const conditions = [
        eq(schema.cardDesigns.customerId, actor.userId),
        eq(schema.cardDesigns.productId, productId),
        eq(schema.cardDesigns.isDraft, true),
      ];
      if (templateId) {
        conditions.push(eq(schema.cardDesigns.templateId, templateId));
      }

      const [existing] = await tx
        .select()
        .from(schema.cardDesigns)
        .where(and(...conditions))
        .limit(1);

      if (existing) {
        const [updated] = await tx
          .update(schema.cardDesigns)
          .set({
            name: data.name || existing.name,
            frontCanvasJson: data.frontCanvasJson || existing.frontCanvasJson,
            backCanvasJson: data.backCanvasJson !== undefined ? data.backCanvasJson : existing.backCanvasJson,
            previewUrl: data.previewUrl || existing.previewUrl,
            backPreviewUrl: data.backPreviewUrl || existing.backPreviewUrl,
            variantId: data.variantId || existing.variantId,
            updatedAt: new Date(),
          })
          .where(eq(schema.cardDesigns.id, existing.id))
          .returning();
        return updated;
      }

      // Create new draft
      const newId = crypto.randomUUID();
      const [created] = await tx
        .insert(schema.cardDesigns)
        .values({
          id: newId,
          customerId: actor.userId,
          productId,
          templateId,
          variantId: data.variantId || null,
          name: data.name || 'Untitled NFC Card',
          frontCanvasJson: data.frontCanvasJson || '{}',
          backCanvasJson: data.backCanvasJson || null,
          previewUrl: data.previewUrl || null,
          backPreviewUrl: data.backPreviewUrl || null,
          isDraft: true,
        })
        .returning();

      return created;
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

  async delete(actor: ActorContext, id: string) {
    await this.findOne(actor, id);

    return this.dbService.withActor(actor, async (tx) => {
      await tx.delete(schema.cardDesigns).where(eq(schema.cardDesigns.id, id));
      return { success: true, message: 'Design deleted successfully' };
    });
  }
}
