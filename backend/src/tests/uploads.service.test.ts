import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';

const mockUpload = vi.fn();
const mockDestroy = vi.fn();
const mockConfig = vi.fn();

vi.mock('cloudinary', () => ({
  v2: {
    config: (...args: any[]) => mockConfig(...args),
    uploader: {
      upload: (...args: any[]) => mockUpload(...args),
      destroy: (...args: any[]) => mockDestroy(...args),
    },
  },
}));

import { CloudinaryStorageService } from '../modules/uploads/cloudinary-storage.service';
import { UploadsService } from '../modules/uploads/uploads.service';

describe('UploadsService & CloudinaryStorageService', () => {
  const actor: any = { userId: 'user_abc', organizationId: 'org_1', systemRole: 'user' };
  let cloudinaryStorage: CloudinaryStorageService;
  let uploadsService: UploadsService;
  let mockDbService: any;

  const TINY_PNG_DATA_URL =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CLOUDINARY_CLOUD_NAME = 'demo-cloud';
    process.env.CLOUDINARY_API_KEY = 'demo-key';
    process.env.CLOUDINARY_API_SECRET = 'demo-secret';

    const insertedValues: any[] = [];
    mockDbService = {
      insertedValues,
      withActor: vi.fn(async (_actor: any, fn: (tx: any) => Promise<any>) => {
        const tx = {
          insert: () => ({
            values: (val: any) => {
              insertedValues.push(val);
              return { returning: async () => [val] };
            },
          }),
          select: () => ({
            from: () => ({
              where: async () => [],
            }),
          }),
          delete: () => ({
            where: async () => [],
          }),
        };
        return fn(tx);
      }),
    };

    cloudinaryStorage = new CloudinaryStorageService();
    uploadsService = new UploadsService(mockDbService, cloudinaryStorage);
  });

  it('uploads valid profile avatar to Cloudinary and returns https secure_url', async () => {
    mockUpload.mockResolvedValueOnce({
      secure_url: 'https://res.cloudinary.com/demo-cloud/image/upload/v1/taptch/user_abc/avatars/id1.png',
      public_id: 'taptch/user_abc/avatars/id1',
      width: 512,
      height: 512,
      format: 'png',
      bytes: 120,
    });

    const result = await uploadsService.uploadProfileImage(actor, {
      dataUrl: TINY_PNG_DATA_URL,
      filename: 'avatar.png',
      category: 'avatar',
    });

    expect(mockUpload).toHaveBeenCalledTimes(1);
    const [, uploadOpts] = mockUpload.mock.calls[0];
    expect(uploadOpts.folder).toBe('taptch/user_abc/avatars');
    expect(uploadOpts.transformation).toEqual([
      { width: 1200, height: 1200, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' },
    ]);
    expect(result.url).toBe(
      'https://res.cloudinary.com/demo-cloud/image/upload/v1/taptch/user_abc/avatars/id1.png',
    );
    expect(result.url.startsWith('https://')).toBe(true);
    expect(result.storageProvider).toBe('cloudinary');
    expect(mockDbService.insertedValues[0].cloudinaryPublicId).toBe('taptch/user_abc/avatars/id1');
  });

  it('rejects unsupported file types and oversized images (>5MB)', async () => {
    await expect(
      uploadsService.uploadProfileImage(actor, {
        dataUrl: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
      }),
    ).rejects.toThrow(BadRequestException);

    const oversizedBase64 = Buffer.alloc(5 * 1024 * 1024 + 10, 1).toString('base64');
    await expect(
      uploadsService.uploadProfileImage(actor, {
        dataUrl: `data:image/png;base64,${oversizedBase64}`,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('fails cleanly when Cloudinary credentials are missing instead of writing to local disk', async () => {
    delete process.env.CLOUDINARY_API_SECRET;
    await expect(
      uploadsService.uploadProfileImage(actor, {
        dataUrl: TINY_PNG_DATA_URL,
        category: 'logo',
      }),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('deletes the old Cloudinary asset best-effort when replaced or removed', async () => {
    mockDestroy.mockResolvedValueOnce({ result: 'ok' });

    const res = await uploadsService.cleanupAsset(actor, {
      url: 'https://res.cloudinary.com/demo-cloud/image/upload/v173000/taptch/user_abc/avatars/old-id.webp',
    });

    expect(res.deleted).toBe(true);
    expect(res.publicId).toBe('taptch/user_abc/avatars/old-id');
    expect(mockDestroy).toHaveBeenCalledWith('taptch/user_abc/avatars/old-id', {
      invalidate: true,
      resource_type: 'image',
    });

    // Cross-user IDOR attempt is ignored without calling destroy
    const foreignRes = await uploadsService.cleanupAsset(actor, {
      url: 'https://res.cloudinary.com/demo-cloud/image/upload/v173000/taptch/other_user/avatars/secret.webp',
    });
    expect(foreignRes.deleted).toBe(false);
    expect(mockDestroy).toHaveBeenCalledTimes(1);
  });

  it('uploads multipart file to Cloudinary and rejects invalid MIME type or >5MB buffer', async () => {
    mockUpload.mockResolvedValueOnce({
      secure_url: 'https://res.cloudinary.com/demo-cloud/image/upload/v1/taptch/user_abc/products/p1.webp',
      public_id: 'taptch/user_abc/products/p1',
      width: 800,
      height: 800,
      format: 'webp',
      bytes: 2048,
    });

    const result = await uploadsService.uploadMultipartFile(
      actor,
      {
        buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
        mimetype: 'image/png',
        originalname: 'product.png',
      },
      { category: 'product' },
    );

    expect(result.url).toBe(
      'https://res.cloudinary.com/demo-cloud/image/upload/v1/taptch/user_abc/products/p1.webp',
    );
    expect(result.storageProvider).toBe('cloudinary');

    await expect(
      uploadsService.uploadMultipartFile(actor, {
        buffer: Buffer.from('<svg></svg>'),
        mimetype: 'image/svg+xml',
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      uploadsService.uploadMultipartFile(actor, {
        buffer: Buffer.alloc(5 * 1024 * 1024 + 1, 1),
        mimetype: 'image/jpeg',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws ServiceUnavailableException from generateSignature when credentials are missing and records cloudinary provider in recordAsset', async () => {
    delete process.env.CLOUDINARY_API_SECRET;
    await expect(uploadsService.generateSignature(actor, 'image')).rejects.toThrow(
      ServiceUnavailableException,
    );

    process.env.CLOUDINARY_API_SECRET = 'demo-secret';
    const record = await uploadsService.recordAsset(actor, {
      url: 'https://res.cloudinary.com/demo-cloud/image/upload/v1/taptch/user_abc/logos/logo.png',
      storageKey: 'taptch/user_abc/logos/logo',
      mimeType: 'image/png',
      sizeBytes: 512,
    });
    expect(record.storageProvider).toBe('cloudinary');
    expect(record.cloudinaryPublicId).toBe('taptch/user_abc/logos/logo');
  });
});
