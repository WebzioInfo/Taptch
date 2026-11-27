import { Injectable, BadRequestException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';
import { eq, desc, and } from 'drizzle-orm';
import type { ActorContext } from '../../common/types';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { CloudinaryStorageService } from './cloudinary-storage.service';

const CATEGORY_UPLOAD_CONFIG: Record<
  'avatar' | 'cover' | 'logo' | 'product',
  { folderSuffix: string; maxWidth: number; maxHeight: number }
> = {
  avatar: { folderSuffix: 'avatars', maxWidth: 1200, maxHeight: 1200 },
  cover: { folderSuffix: 'covers', maxWidth: 1920, maxHeight: 1080 },
  logo: { folderSuffix: 'logos', maxWidth: 1024, maxHeight: 1024 },
  product: { folderSuffix: 'products', maxWidth: 1400, maxHeight: 1400 },
};

@Injectable()
export class UploadsService {
  constructor(
    private dbService: DatabaseService,
    private cloudinaryStorage: CloudinaryStorageService,
  ) {}

  async uploadProfileImage(
    actor: ActorContext,
    dto: { dataUrl?: string; filename?: string; category?: string },
  ) {
    if (!dto?.dataUrl || typeof dto.dataUrl !== 'string') {
      throw new BadRequestException('Image dataUrl is required.');
    }

    const match = dto.dataUrl.match(/^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=\s]+)$/i);
    if (!match) {
      throw new BadRequestException('Unsupported image format. Please upload JPG, JPEG, PNG, or WebP.');
    }

    const rawExt = match[1].toLowerCase();
    const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
    const mimeType = `image/${rawExt === 'jpg' ? 'jpeg' : rawExt}`;
    const base64Body = match[2].replace(/\s+/g, '');
    const buffer = Buffer.from(base64Body, 'base64');

    const MAX_BYTES = 5 * 1024 * 1024;
    if (buffer.length === 0 || buffer.length > MAX_BYTES) {
      throw new BadRequestException('Image must be smaller than 5 MB.');
    }

    const assetId = crypto.randomUUID();
    const category: 'avatar' | 'cover' | 'logo' | 'product' =
      dto.category === 'logo' ||
      dto.category === 'cover' ||
      dto.category === 'avatar' ||
      dto.category === 'product'
        ? dto.category
        : 'avatar';
    const cfg = CATEGORY_UPLOAD_CONFIG[category];
    const folder = `taptch/${actor.userId}/${cfg.folderSuffix}`;

    const uploaded = await this.cloudinaryStorage.uploadDataUrl(dto.dataUrl, {
      folder,
      publicId: assetId,
      maxWidth: cfg.maxWidth,
      maxHeight: cfg.maxHeight,
    });

    await this.dbService.withActor(actor, async (tx) => {
      await tx.insert(schema.mediaAssets).values({
        id: assetId,
        ownerId: actor.userId,
        storageProvider: 'cloudinary',
        storageKey: uploaded.publicId,
        storageObjectId: uploaded.publicId,
        cloudinaryPublicId: uploaded.publicId,
        assetUrl: uploaded.secureUrl,
        secureUrl: uploaded.secureUrl,
        assetType: 'image',
        mimeType,
        mediaCategory: category,
        format: uploaded.format || ext,
        width: uploaded.width ?? null,
        height: uploaded.height ?? null,
        fileSize: buffer.length,
        visibilityStatus: 'public',
      });
    });

    return {
      id: assetId,
      url: uploaded.secureUrl,
      publicId: uploaded.publicId,
      mimeType,
      sizeBytes: buffer.length,
      storageProvider: 'cloudinary',
    };
  }

  async getLocalProfileImage(filename: string): Promise<{ buffer: Buffer; mimeType: string }> {
    if (!/^[a-zA-Z0-9-]+\.(jpg|jpeg|png|webp)$/i.test(filename)) {
      throw new BadRequestException('Invalid file name.');
    }

    const filePath = path.resolve(process.cwd(), 'uploads', 'profiles', filename);
    try {
      const buffer = await fs.readFile(filePath);
      const ext = filename.split('.').pop()?.toLowerCase() || 'png';
      const mimeType =
        ext === 'jpg' || ext === 'jpeg'
          ? 'image/jpeg'
          : ext === 'webp'
            ? 'image/webp'
            : 'image/png';
      return { buffer, mimeType };
    } catch {
      throw new NotFoundException('Uploaded image not found.');
    }
  }

  async uploadCardPreview(
    actor: ActorContext,
    dto: { frontBase64?: string; backBase64?: string; designId?: string },
  ) {
    const designId = dto.designId || crypto.randomUUID();
    const folder = `taptch/${actor.userId}/card-previews`;

    let frontUrl: string = dto.frontBase64 || '';
    let backUrl: string = dto.backBase64 || '';

    if (dto.frontBase64 && dto.frontBase64.startsWith('data:image')) {
      const uploadedFront = await this.cloudinaryStorage.uploadDataUrl(dto.frontBase64, {
        folder,
        publicId: `${designId}_front`,
        maxWidth: 1600,
        maxHeight: 1600,
      });
      frontUrl = uploadedFront.secureUrl;
    }

    if (dto.backBase64 && dto.backBase64.startsWith('data:image')) {
      const uploadedBack = await this.cloudinaryStorage.uploadDataUrl(dto.backBase64, {
        folder,
        publicId: `${designId}_back`,
        maxWidth: 1600,
        maxHeight: 1600,
      });
      backUrl = uploadedBack.secureUrl;
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
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() || '';
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim() || '';
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim() || '';
    if (!cloudName || !apiKey || !apiSecret) {
      throw new ServiceUnavailableException('Cloudinary storage is not configured on the server.');
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = `taptch/customers/${actor.userId}/${assetType}s`;

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

  async uploadMultipartFile(
    actor: ActorContext,
    file: { buffer: Buffer; mimetype?: string; originalname?: string; size?: number },
    dto?: { category?: string; assetType?: string },
  ) {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Image file is required.');
    }

    const ALLOWED_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
    const mimeType = (file.mimetype || '').toLowerCase();
    if (!ALLOWED_MIMES.has(mimeType)) {
      throw new BadRequestException('Unsupported image format. Please upload JPG, JPEG, PNG, or WebP.');
    }

    const MAX_BYTES = 5 * 1024 * 1024;
    if (file.buffer.length > MAX_BYTES) {
      throw new BadRequestException('Image must be smaller than 5 MB.');
    }

    const assetId = crypto.randomUUID();
    const category: 'avatar' | 'cover' | 'logo' | 'product' =
      dto?.category === 'logo' ||
      dto?.category === 'cover' ||
      dto?.category === 'avatar' ||
      dto?.category === 'product'
        ? dto.category
        : 'product';
    const cfg = CATEGORY_UPLOAD_CONFIG[category];
    const folder = `taptch/${actor.userId}/${cfg.folderSuffix}`;

    const uploaded = await this.cloudinaryStorage.uploadBuffer(file.buffer, mimeType, {
      folder,
      publicId: assetId,
      maxWidth: cfg.maxWidth,
      maxHeight: cfg.maxHeight,
    });

    await this.dbService.withActor(actor, async (tx) => {
      await tx.insert(schema.mediaAssets).values({
        id: assetId,
        ownerId: actor.userId,
        storageProvider: 'cloudinary',
        storageKey: uploaded.publicId,
        storageObjectId: uploaded.publicId,
        cloudinaryPublicId: uploaded.publicId,
        assetUrl: uploaded.secureUrl,
        secureUrl: uploaded.secureUrl,
        assetType: dto?.assetType || 'image',
        mimeType,
        mediaCategory: category,
        format: uploaded.format || null,
        width: uploaded.width ?? null,
        height: uploaded.height ?? null,
        fileSize: file.buffer.length,
        visibilityStatus: 'public',
      });
    });

    return {
      id: assetId,
      url: uploaded.secureUrl,
      publicId: uploaded.publicId,
      storageKey: uploaded.publicId,
      originalName: file.originalname || 'uploaded-image',
      mimeType,
      sizeBytes: file.buffer.length,
      width: uploaded.width,
      height: uploaded.height,
      storageProvider: 'cloudinary',
    };
  }

  async recordAsset(actor: ActorContext, data: any) {
    if (!data.url) {
      throw new BadRequestException('Asset URL is required.');
    }

    const id = crypto.randomUUID();
    const publicId =
      data.publicId ||
      data.storageKey ||
      this.cloudinaryStorage.extractPublicIdFromUrl(data.url) ||
      null;

    const [record] = await this.dbService.withActor(actor, async (tx) => {
      return tx
        .insert(schema.mediaAssets)
        .values({
          id,
          ownerId: actor.userId,
          storageProvider: 'cloudinary',
          storageKey: publicId || id,
          storageObjectId: publicId || id,
          cloudinaryPublicId: publicId,
          assetUrl: data.url,
          secureUrl: data.url,
          assetType: data.assetType || 'image',
          mimeType: data.mimeType || 'image/png',
          mediaCategory: data.category || 'logo',
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

  async cleanupAsset(actor: ActorContext, dto: { url?: string; publicId?: string }) {
    const publicId =
      dto?.publicId?.trim() || this.cloudinaryStorage.extractPublicIdFromUrl(dto?.url);
    if (!publicId) {
      return { success: false, deleted: false };
    }

    const ownedPrefixA = `taptch/${actor.userId}/`;
    const ownedPrefixB = `taptch/customers/${actor.userId}/`;
    const isOwnedPath = publicId.startsWith(ownedPrefixA) || publicId.startsWith(ownedPrefixB);

    let deleted = false;
    await this.dbService.withActor(actor, async (tx) => {
      const [existing] = await tx
        .select()
        .from(schema.mediaAssets)
        .where(
          and(
            eq(schema.mediaAssets.ownerId, actor.userId),
            eq(schema.mediaAssets.cloudinaryPublicId, publicId),
          ),
        );

      if (!isOwnedPath && !existing) {
        return;
      }

      deleted = await this.cloudinaryStorage.deleteByPublicId(publicId);
      if (existing) {
        await tx.delete(schema.mediaAssets).where(eq(schema.mediaAssets.id, existing.id));
      }
    });

    return { success: true, deleted, publicId };
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

      const publicId =
        existing.cloudinaryPublicId ||
        this.cloudinaryStorage.extractPublicIdFromUrl(existing.secureUrl || existing.assetUrl);
      if (publicId) {
        await this.cloudinaryStorage.deleteByPublicId(publicId);
      }

      await tx.delete(schema.mediaAssets).where(eq(schema.mediaAssets.id, id));
      return { success: true, message: 'Asset deleted successfully' };
    });
  }
}
