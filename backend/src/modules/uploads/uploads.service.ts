import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';
import { eq, desc, and } from 'drizzle-orm';
import type { ActorContext } from '../../common/types';
import * as crypto from 'crypto';

@Injectable()
export class UploadsService {
  constructor(private dbService: DatabaseService) { }

  private async uploadToCloudinary(
    base64Data: string,
    publicId: string,
    folder: string,
  ): Promise<string | null> {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret || !base64Data || !base64Data.startsWith('data:image')) {
      return null;
    }

    try {
      const timestamp = Math.round(new Date().getTime() / 1000);
      const paramsToSign: Record<string, string> = {
        folder,
        invalidate: 'true',
        overwrite: 'true',
        public_id: publicId,
        timestamp: String(timestamp),
      };

      const sortedKeys = Object.keys(paramsToSign).sort();
      const stringToSign = sortedKeys.map((k) => `${k}=${paramsToSign[k]}`).join('&') + apiSecret;
      const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

      const formData = new URLSearchParams();
      formData.append('file', base64Data);
      formData.append('folder', folder);
      formData.append('public_id', publicId);
      formData.append('overwrite', 'true');
      formData.append('invalidate', 'true');
      formData.append('timestamp', String(timestamp));
      formData.append('api_key', apiKey);
      formData.append('signature', signature);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('[UploadsService] Cloudinary upload returned non-200:', errorText);
        return null;
      }

      const json = await response.json();
      return json.secure_url || json.url || null;
    } catch (err) {
      console.warn('[UploadsService] Cloudinary upload error:', err);
      return null;
    }
  }

  async uploadCardPreview(
    actor: ActorContext,
    dto: { frontBase64?: string; backBase64?: string; designId?: string },
  ) {
    const designId = dto.designId || crypto.randomUUID();
    const folder = `taptch/card-previews/${actor.userId}`;

    let frontUrl: string = dto.frontBase64 || '';
    let backUrl: string = dto.backBase64 || '';

    if (dto.frontBase64 && dto.frontBase64.startsWith('data:image')) {
      const uploadedFront = await this.uploadToCloudinary(
        dto.frontBase64,
        `${designId}_front`,
        folder,
      );
      if (uploadedFront) {
        frontUrl = uploadedFront;
      }
    }

    if (dto.backBase64 && dto.backBase64.startsWith('data:image')) {
      const uploadedBack = await this.uploadToCloudinary(
        dto.backBase64,
        `${designId}_back`,
        folder,
      );
      if (uploadedBack) {
        backUrl = uploadedBack;
      }
    }

    // Persist to card_designs if designId exists
    if (dto.designId) {
      try {
        await this.dbService.withActor(actor, async (tx) => {
          await tx
            .update(schema.cardDesigns)
            .set({
              previewFrontUrl: frontUrl || undefined,
              previewBackUrl: backUrl || undefined,
              previewUrl: frontUrl || undefined,
              backPreviewUrl: backUrl || undefined,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(schema.cardDesigns.id, dto.designId!),
                eq(schema.cardDesigns.customerId, actor.userId),
              ),
            );
        });
      } catch (e) {
        console.warn('[UploadsService] Could not update card_designs with preview URLs:', e);
      }
    }

    return {
      frontUrl,
      backUrl,
      previewFrontUrl: frontUrl,
      previewBackUrl: backUrl,
      designId,
    };
  }

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
