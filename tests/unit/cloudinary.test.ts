import { describe, it, expect } from 'vitest';
import {
  CLOUDINARY_FOLDERS,
  generateSignedUploadParams,
  getTransformedImageUrl,
  uploadMediaBuffer,
  deleteMediaAsset,
} from '@/lib/cloudinary';
import { db } from '@/db';
import { users } from '@/db/schema';

describe('Cloudinary Media Service', () => {
  it('defines structured enterprise folder hierarchy', () => {
    expect(CLOUDINARY_FOLDERS.personalAvatars).toBe('tapzio/profiles/personal');
    expect(CLOUDINARY_FOLDERS.businessLogos).toBe('tapzio/businesses/logos');
    expect(CLOUDINARY_FOLDERS.businessProducts).toBe('tapzio/businesses/products');
    expect(CLOUDINARY_FOLDERS.personalGalleries).toBe('tapzio/profiles/galleries');
    expect(CLOUDINARY_FOLDERS.videos).toBe('tapzio/videos');
    expect(CLOUDINARY_FOLDERS.documents).toBe('tapzio/documents/brochures');
  });

  it('generates signed direct upload parameters with timestamp and folder', () => {
    const signatureData = generateSignedUploadParams(CLOUDINARY_FOLDERS.personalAvatars, [
      'tapzio',
      'user_123',
    ]);

    expect(signatureData.timestamp).toBeGreaterThan(0);
    expect(signatureData.folder).toBe('tapzio/profiles/personal');
    expect(signatureData.cloudName).toBeDefined();
    expect(signatureData.apiKey).toBeDefined();
    expect(signatureData.signature).toBeDefined();
    expect(signatureData.tags).toBe('tapzio,user_123');
  });

  it('generates optimized transformed image URLs with auto-format and crop', () => {
    const publicId = 'tapzio/profiles/personal/avatar_12345';
    const transformedUrl = getTransformedImageUrl(publicId, {
      width: 400,
      height: 400,
      crop: 'thumb',
      gravity: 'face',
      quality: 'auto',
      format: 'webp',
    });

    expect(transformedUrl).toContain('res.cloudinary.com');
    expect(transformedUrl).toContain('w_400');
    expect(transformedUrl).toContain('h_400');
    expect(transformedUrl).toContain('c_thumb');
    expect(transformedUrl).toContain('g_face');
    expect(transformedUrl).toContain('q_auto');
    expect(transformedUrl).toContain('f_webp');
    expect(transformedUrl).toContain(publicId);
  });

  it('safely uploads media buffer in test environment using mock fallback or SDK', async () => {
    const userId = `usr_test_cld_${Date.now()}`;

    // Ensure user exists in db for foreign key
    await db.insert(users).values({
      id: userId,
      name: 'Cloudinary Tester',
      email: `${userId}@example.com`,
    }).onConflictDoNothing();

    const sampleBuffer = Buffer.from('mock image binary data for vitest testing');
    const asset = await uploadMediaBuffer(sampleBuffer, {
      folder: CLOUDINARY_FOLDERS.personalAvatars,
      mediaCategory: 'avatar',
      resourceType: 'image',
      ownerId: userId,
    });

    expect(asset.id).toBeDefined();
    expect(asset.secureUrl).toContain('cloudinary.com');
    expect(asset.publicId).toContain('tapzio/profiles/personal');

    // Test asset deletion with actor verification
    const deleted = await deleteMediaAsset(asset.id, userId);
    expect(deleted.success).toBe(true);
  });

  it('rejects asset deletion if actor is not the owner or admin', async () => {
    const ownerId = `usr_owner_${Date.now()}`;
    const attackerId = `usr_attacker_${Date.now()}`;

    await db.insert(users).values({
      id: ownerId,
      name: 'Asset Owner',
      email: `${ownerId}@example.com`,
    }).onConflictDoNothing();

    await db.insert(users).values({
      id: attackerId,
      name: 'Attacker',
      email: `${attackerId}@example.com`,
    }).onConflictDoNothing();

    const buffer = Buffer.from('private owner image');
    const asset = await uploadMediaBuffer(buffer, {
      folder: CLOUDINARY_FOLDERS.businessLogos,
      mediaCategory: 'logo',
      resourceType: 'image',
      ownerId,
    });

    // Attacker attempts to delete owner's asset
    const result = await deleteMediaAsset(asset.id, attackerId, false);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');
  });
});
