import { describe, it, expect } from 'vitest';
import {
  STORAGE_FOLDERS,
  generateSignedUploadParams,
  getTransformedImageUrl,
  uploadMediaBuffer,
  deleteMediaAsset,
} from '@/lib/storage';
import { db } from '@/db';
import { users } from '@/db/schema';

describe('Cloudflare Storage & Asset Management Service', () => {
  it('defines structured enterprise folder hierarchy for Cloudflare storage', () => {
    expect(STORAGE_FOLDERS.personalAvatars).toBe('profiles/avatars');
    expect(STORAGE_FOLDERS.businessLogos).toBe('businesses/logos');
    expect(STORAGE_FOLDERS.businessProducts).toBe('businesses/products');
    expect(STORAGE_FOLDERS.personalGalleries).toBe('profiles/galleries');
    expect(STORAGE_FOLDERS.videos).toBe('videos/showcases');
    expect(STORAGE_FOLDERS.documents).toBe('documents/brochures');
  });

  it('generates direct upload parameters with destination folder and tags', async () => {
    const uploadParams = await generateSignedUploadParams(STORAGE_FOLDERS.personalAvatars, [
      'taptch',
      'user_123',
    ]);

    expect(uploadParams.uploadUrl).toBeDefined();
    expect(uploadParams.folder).toBe('profiles/avatars');
    expect(uploadParams.storageProvider).toBeDefined();
    expect(uploadParams.tags).toEqual(['taptch', 'user_123']);
  });

  it('generates optimized Cloudflare delivery URLs with responsive variants', () => {
    const imageId = 'cf_img_avatar_998877';
    const transformedUrl = getTransformedImageUrl(imageId, {
      variant: 'avatar',
    });

    expect(transformedUrl).toContain('imagedelivery.net');
    expect(transformedUrl).toContain('avatar');
    expect(transformedUrl).toContain(imageId);
  });

  it('safely uploads image buffer in test environment using mock fallback or Cloudflare Images', async () => {
    const userId = `usr_test_cf_${Date.now()}`;

    // Ensure user exists in db for foreign key
    await db
      .insert(users)
      .values({
        id: userId,
        name: 'Cloudflare Tester',
        email: `${userId}@example.com`,
      })
      .onConflictDoNothing();

    const sampleBuffer = Buffer.from('mock image binary data for vitest testing');
    const asset = await uploadMediaBuffer(sampleBuffer, {
      folder: STORAGE_FOLDERS.personalAvatars,
      mediaCategory: 'avatar',
      resourceType: 'image',
      ownerId: userId,
    });

    expect(asset.id).toBeDefined();
    expect(asset.secureUrl).toBeDefined();
    expect(asset.storageKey).toBeDefined();
    expect(asset.storageProvider).toBeDefined();

    // Test asset deletion with actor verification
    const deleted = await deleteMediaAsset(asset.id, userId);
    expect(deleted.success).toBe(true);
  });

  it('safely uploads document buffer to Cloudflare R2 object storage', async () => {
    const userId = `usr_doc_cf_${Date.now()}`;

    await db
      .insert(users)
      .values({
        id: userId,
        name: 'Document Tester',
        email: `${userId}@example.com`,
      })
      .onConflictDoNothing();

    const pdfBuffer = Buffer.from('%PDF-1.4 mock pdf document content');
    const asset = await uploadMediaBuffer(pdfBuffer, {
      folder: STORAGE_FOLDERS.documents,
      mediaCategory: 'brochure',
      resourceType: 'raw',
      fileName: 'corporate-brochure.pdf',
      mimeType: 'application/pdf',
      ownerId: userId,
    });

    expect(asset.id).toBeDefined();
    expect(asset.format).toBe('pdf');
    expect(asset.secureUrl).toContain('.pdf');

    // Clean up
    const deleted = await deleteMediaAsset(asset.id, userId);
    expect(deleted.success).toBe(true);
  });

  it('rejects asset deletion if actor is not the owner or admin', async () => {
    const ownerId = `usr_owner_cf_${Date.now()}`;
    const attackerId = `usr_attacker_cf_${Date.now()}`;

    await db
      .insert(users)
      .values({
        id: ownerId,
        name: 'Asset Owner',
        email: `${ownerId}@example.com`,
      })
      .onConflictDoNothing();

    await db
      .insert(users)
      .values({
        id: attackerId,
        name: 'Attacker',
        email: `${attackerId}@example.com`,
      })
      .onConflictDoNothing();

    const buffer = Buffer.from('private owner image');
    const asset = await uploadMediaBuffer(buffer, {
      folder: STORAGE_FOLDERS.businessLogos,
      mediaCategory: 'logo',
      resourceType: 'image',
      ownerId,
    });

    // Attacker attempts to delete owner's asset
    const result = await deleteMediaAsset(asset.id, attackerId, false);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');

    // Admin can delete owner's asset
    const adminResult = await deleteMediaAsset(asset.id, attackerId, true);
    expect(adminResult.success).toBe(true);
  });
});
