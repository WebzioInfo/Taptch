import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';
import { eq, desc } from 'drizzle-orm';
import type { ActorContext } from '../../common/types';
import * as crypto from 'crypto';

@Injectable()
export class UploadsService {
  constructor(private dbService: DatabaseService) { }

  async generateSignature(actor: ActorContext, assetType = 'image') {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = `taptch/customers/${actor.userId}/${assetType}s`;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'taptch-cdn';
    const apiKey = process.env.CLOUDINARY_API_KEY || 'taptch_api_key';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || 'taptch_secret';

    // Generate SHA-1 HMAC signature for Cloudinary upload protocol
    const signaturePayload = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(signaturePayload).digest('hex');

    return {
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder,
    };
  }

  async recordAsset(actor: ActorContext, data: any) {
    if (!data.url) {
      throw new BadRequestException('Asset URL is required.');
    }

    const id = crypto.randomUUID();

    const [record] = await this.dbService.withActor(actor, async (tx) => {
      return tx
        .insert(schema.mediaAssets)
        .values({
          id,
          ownerId: actor.userId,
          storageProvider: 'cloudflare_images',
          storageKey: data.storageKey || id,
          storageObjectId: data.storageKey || id,
          assetUrl: data.url,
          secureUrl: data.url,
          assetType: data.assetType || 'image',
          mimeType: data.mimeType || 'image/png',
          mediaCategory: 'logo',
          fileSize: data.sizeBytes || 0,
          width: data.width || null,
          height: data.height || null,
          visibilityStatus: 'public',
        })
        .returning();
    });

    return record;
  }

  async findAllForActor(actor: ActorContext) {
    return this.dbService.withActor(actor, async (tx) => {
      return tx
        .select()
        .from(schema.mediaAssets)
        .where(eq(schema.mediaAssets.ownerId, actor.userId))
        .orderBy(desc(schema.mediaAssets.createdAt));
    });
  }

  async delete(actor: ActorContext, id: string) {
    return this.dbService.withActor(actor, async (tx) => {
      const [existing] = await tx
        .select()
        .from(schema.mediaAssets)
        .where(eq(schema.mediaAssets.id, id));

      if (!existing) {
        throw new NotFoundException('Asset not found');
      }

      await tx.delete(schema.mediaAssets).where(eq(schema.mediaAssets.id, id));
      return { success: true, message: 'Asset deleted successfully' };
    });
  }
}
