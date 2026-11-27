import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

const mockUpload = vi.fn();
const mockConfig = vi.fn();

vi.mock('cloudinary', () => ({
  v2: {
    config: (...args: any[]) => mockConfig(...args),
    uploader: {
      upload: (...args: any[]) => mockUpload(...args),
    },
  },
}));

import { CloudinaryStorageService } from '../modules/uploads/cloudinary-storage.service';
import {
  extractLocalUploadFilename,
  migrateLocalUploads,
} from '../scripts/migrate-local-uploads-to-cloudinary';
import * as schema from '../database/schema';

describe('migrateLocalUploads', () => {
  let tempDir: string;
  let uploadsDir: string;
  let backupDir: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.CLOUDINARY_CLOUD_NAME = 'demo-cloud';
    process.env.CLOUDINARY_API_KEY = 'demo-key';
    process.env.CLOUDINARY_API_SECRET = 'demo-secret';

    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'taptch-migrate-'));
    uploadsDir = path.join(tempDir, 'uploads');
    backupDir = path.join(tempDir, 'backups');
    await fs.mkdir(uploadsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  function createMockDb(state: {
    profiles: any[];
    businesses: any[];
    catalogue: any[];
    media: any[];
  }) {
    return {
      select: () => ({
        from: async (table: any) => {
          if (table === schema.profiles) return state.profiles;
          if (table === schema.profileBusinesses) return state.businesses;
          if (table === schema.profileCatalogueItems) return state.catalogue;
          if (table === schema.mediaAssets) return state.media;
          return [];
        },
      }),
      update: (table: any) => ({
        set: (values: any) => ({
          where: async () => {
            if (table === schema.profiles) {
              Object.assign(state.profiles[0], values);
            } else if (table === schema.profileBusinesses) {
              Object.assign(state.businesses[0], values);
            } else if (table === schema.profileCatalogueItems) {
              Object.assign(state.catalogue[0], values);
            } else if (table === schema.mediaAssets) {
              Object.assign(state.media[0], values);
            }
          },
        }),
      }),
    };
  }

  it('extracts filenames from relative and absolute local upload URLs only', () => {
    expect(extractLocalUploadFilename('/api/v1/uploads/file/abc-123.webp')).toBe('abc-123.webp');
    expect(
      extractLocalUploadFilename('https://api.taptch.com/api/v1/uploads/file/abc-123.png?v=1'),
    ).toBe('abc-123.png');
    expect(
      extractLocalUploadFilename('https://res.cloudinary.com/demo/image/upload/v1/taptch/a.webp'),
    ).toBeNull();
  });

  it('backs up affected rows, skips missing files, and uploads existing files in apply mode idempotently', async () => {
    const existingFile = '11111111-1111-1111-1111-111111111111.png';
    const missingFile = '22222222-2222-2222-2222-222222222222.jpg';
    await fs.writeFile(path.join(uploadsDir, existingFile), Buffer.from([0x89, 0x50, 0x4e, 0x47]));

    const state = {
      profiles: [
        {
          id: 'prof_1',
          ownerId: 'user_1',
          avatarUrl: `/api/v1/uploads/file/${existingFile}`,
          coverUrl: null,
          portfolio: [],
          gallery: [],
          publishedJson: {
            avatarUrl: `/api/v1/uploads/file/${existingFile}`,
          },
        },
      ],
      businesses: [
        {
          id: 'biz_1',
          profileId: 'prof_1',
          logoUrl: `/api/v1/uploads/file/${missingFile}`,
          coverUrl: null,
        },
      ],
      catalogue: [],
      media: [],
    };

    const db = createMockDb(state);
    const cloudinaryStorage = new CloudinaryStorageService();

    // 1. Dry-run: does not call Cloudinary or mutate DB, still writes backup
    const dryReport = await migrateLocalUploads(
      { db, cloudinaryStorage, uploadsDir, backupDir },
      { dryRun: true },
    );
    expect(dryReport.dryRun).toBe(true);
    expect(dryReport.affectedRowCount).toBe(2);
    expect(dryReport.migrated).toHaveLength(1);
    expect(dryReport.missingFiles).toHaveLength(1);
    expect(dryReport.backupPath).toBeTruthy();
    expect(mockUpload).not.toHaveBeenCalled();
    expect(state.profiles[0].avatarUrl).toBe(`/api/v1/uploads/file/${existingFile}`);

    // 2. Apply mode: uploads existing file, updates DB & publishedJson, leaves missing file unchanged
    const migratedUrl =
      'https://res.cloudinary.com/demo-cloud/image/upload/v1/taptch/user_1/avatars/11111111-1111-1111-1111-111111111111.png';
    mockUpload.mockResolvedValueOnce({
      secure_url: migratedUrl,
      public_id: 'taptch/user_1/avatars/11111111-1111-1111-1111-111111111111',
      width: 400,
      height: 400,
      format: 'png',
      bytes: 120,
    });

    const applyReport = await migrateLocalUploads(
      { db, cloudinaryStorage, uploadsDir, backupDir },
      { dryRun: false },
    );
    expect(applyReport.dryRun).toBe(false);
    expect(applyReport.migrated).toHaveLength(1);
    expect(applyReport.migrated[0].newUrl).toBe(migratedUrl);
    expect(applyReport.missingFiles).toHaveLength(1);
    expect(state.profiles[0].avatarUrl).toBe(migratedUrl);
    expect(state.profiles[0].publishedJson.avatarUrl).toBe(migratedUrl);
    // Missing file row remains untouched
    expect(state.businesses[0].logoUrl).toBe(`/api/v1/uploads/file/${missingFile}`);
    // Local file is NOT deleted
    const stillExists = await fs
      .stat(path.join(uploadsDir, existingFile))
      .then(() => true)
      .catch(() => false);
    expect(stillExists).toBe(true);

    // 3. Idempotency: re-running does not re-upload already migrated profile
    const secondReport = await migrateLocalUploads(
      { db, cloudinaryStorage, uploadsDir, backupDir },
      { dryRun: false },
    );
    expect(secondReport.migrated).toHaveLength(0);
    expect(mockUpload).toHaveBeenCalledTimes(1);
  });
});
