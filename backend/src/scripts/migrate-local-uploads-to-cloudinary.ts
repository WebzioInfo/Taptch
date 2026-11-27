import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../database/schema';
import { CloudinaryStorageService } from '../modules/uploads/cloudinary-storage.service';

export interface MigrationTarget {
  table: 'profiles' | 'profile_businesses' | 'profile_catalogue_items' | 'media_assets';
  rowId: string;
  ownerId: string;
  field: string;
  oldUrl: string;
  filename: string;
  category: 'avatar' | 'cover' | 'logo' | 'product';
}

export interface MissingFileReportItem {
  table: string;
  rowId: string;
  field: string;
  oldUrl: string;
  expectedPath: string;
}

export interface MigratedItem {
  table: string;
  rowId: string;
  field: string;
  oldUrl: string;
  newUrl: string;
  publicId: string;
}

export interface MigrationReport {
  dryRun: boolean;
  backupPath: string | null;
  scannedCount: number;
  affectedRowCount: number;
  migrated: MigratedItem[];
  missingFiles: MissingFileReportItem[];
  skippedAlreadyMigrated: number;
}

const LOCAL_UPLOAD_REGEX = /\/api\/v1\/uploads\/file\/([a-zA-Z0-9-]+\.(?:jpg|jpeg|png|webp))$/i;

export function extractLocalUploadFilename(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim().split('?')[0];
  const match = trimmed.match(LOCAL_UPLOAD_REGEX);
  return match ? match[1] : null;
}

export function mimeTypeFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || 'png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  return 'image/png';
}

export function rewriteUrlsInJson(
  value: unknown,
  urlMap: Map<string, string>,
): { updated: unknown; changed: boolean } {
  if (typeof value === 'string') {
    const filename = extractLocalUploadFilename(value);
    if (filename && urlMap.has(filename)) {
      return { updated: urlMap.get(filename)!, changed: true };
    }
    return { updated: value, changed: false };
  }
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const res = rewriteUrlsInJson(item, urlMap);
      if (res.changed) changed = true;
      return res.updated;
    });
    return { updated: next, changed };
  }
  if (value && typeof value === 'object') {
    let changed = false;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const res = rewriteUrlsInJson(v, urlMap);
      if (res.changed) changed = true;
      out[k] = res.updated;
    }
    return { updated: out, changed };
  }
  return { updated: value, changed: false };
}

const CATEGORY_CONFIG: Record<
  'avatar' | 'cover' | 'logo' | 'product',
  { folderSuffix: string; maxWidth: number; maxHeight: number }
> = {
  avatar: { folderSuffix: 'avatars', maxWidth: 1200, maxHeight: 1200 },
  cover: { folderSuffix: 'covers', maxWidth: 1920, maxHeight: 1080 },
  logo: { folderSuffix: 'logos', maxWidth: 1024, maxHeight: 1024 },
  product: { folderSuffix: 'products', maxWidth: 1400, maxHeight: 1400 },
};

export interface MigrationDeps {
  db: any;
  cloudinaryStorage: CloudinaryStorageService;
  uploadsDir: string;
  backupDir: string;
}

export async function migrateLocalUploads(
  deps: MigrationDeps,
  options: { dryRun: boolean },
): Promise<MigrationReport> {
  const { db, cloudinaryStorage, uploadsDir, backupDir } = deps;
  const dryRun = options.dryRun;

  const [profilesRows, businessRows, catalogueRows, mediaRows] = await Promise.all([
    db.select().from(schema.profiles),
    db.select().from(schema.profileBusinesses),
    db.select().from(schema.profileCatalogueItems),
    db.select().from(schema.mediaAssets),
  ]);

  const profileOwnerMap = new Map<string, string>();
  for (const p of profilesRows) {
    profileOwnerMap.set(p.id, p.ownerId);
  }

  const targets: MigrationTarget[] = [];
  const affectedProfiles: any[] = [];
  const affectedBusinesses: any[] = [];
  const affectedCatalogue: any[] = [];
  const affectedMedia: any[] = [];

  for (const p of profilesRows) {
    let rowAffected = false;
    const avatarFile = extractLocalUploadFilename(p.avatarUrl);
    if (avatarFile) {
      targets.push({
        table: 'profiles',
        rowId: p.id,
        ownerId: p.ownerId,
        field: 'avatarUrl',
        oldUrl: p.avatarUrl,
        filename: avatarFile,
        category: 'avatar',
      });
      rowAffected = true;
    }
    const coverFile = extractLocalUploadFilename(p.coverUrl);
    if (coverFile) {
      targets.push({
        table: 'profiles',
        rowId: p.id,
        ownerId: p.ownerId,
        field: 'coverUrl',
        oldUrl: p.coverUrl,
        filename: coverFile,
        category: 'cover',
      });
      rowAffected = true;
    }
    if (Array.isArray(p.portfolio)) {
      for (const item of p.portfolio) {
        const f = extractLocalUploadFilename(item?.imageUrl);
        if (f) {
          targets.push({
            table: 'profiles',
            rowId: p.id,
            ownerId: p.ownerId,
            field: 'portfolio',
            oldUrl: item.imageUrl,
            filename: f,
            category: 'product',
          });
          rowAffected = true;
        }
      }
    }
    if (Array.isArray(p.gallery)) {
      for (const item of p.gallery) {
        const f = extractLocalUploadFilename(item?.url);
        if (f) {
          targets.push({
            table: 'profiles',
            rowId: p.id,
            ownerId: p.ownerId,
            field: 'gallery',
            oldUrl: item.url,
            filename: f,
            category: 'product',
          });
          rowAffected = true;
        }
      }
    }
    if (rowAffected) affectedProfiles.push(p);
  }

  for (const b of businessRows) {
    let rowAffected = false;
    const ownerId = profileOwnerMap.get(b.profileId) || 'system';
    const logoFile = extractLocalUploadFilename(b.logoUrl);
    if (logoFile) {
      targets.push({
        table: 'profile_businesses',
        rowId: b.id,
        ownerId,
        field: 'logoUrl',
        oldUrl: b.logoUrl,
        filename: logoFile,
        category: 'logo',
      });
      rowAffected = true;
    }
    const coverFile = extractLocalUploadFilename(b.coverUrl);
    if (coverFile) {
      targets.push({
        table: 'profile_businesses',
        rowId: b.id,
        ownerId,
        field: 'coverUrl',
        oldUrl: b.coverUrl,
        filename: coverFile,
        category: 'cover',
      });
      rowAffected = true;
    }
    if (rowAffected) affectedBusinesses.push(b);
  }

  for (const c of catalogueRows) {
    const ownerId = profileOwnerMap.get(c.profileId) || 'system';
    const imgFile = extractLocalUploadFilename(c.imageUrl);
    if (imgFile) {
      targets.push({
        table: 'profile_catalogue_items',
        rowId: c.id,
        ownerId,
        field: 'imageUrl',
        oldUrl: c.imageUrl,
        filename: imgFile,
        category: 'product',
      });
      affectedCatalogue.push(c);
    }
  }

  for (const m of mediaRows) {
    const assetFile = extractLocalUploadFilename(m.secureUrl || m.assetUrl);
    if (assetFile) {
      const category =
        m.mediaCategory === 'cover' || m.mediaCategory === 'logo' || m.mediaCategory === 'product'
          ? m.mediaCategory
          : 'avatar';
      targets.push({
        table: 'media_assets',
        rowId: m.id,
        ownerId: m.ownerId,
        field: 'secureUrl',
        oldUrl: m.secureUrl || m.assetUrl,
        filename: assetFile,
        category,
      });
      affectedMedia.push(m);
    }
  }

  const affectedRowCount =
    affectedProfiles.length +
    affectedBusinesses.length +
    affectedCatalogue.length +
    affectedMedia.length;

  let backupPath: string | null = null;
  if (affectedRowCount > 0) {
    await fs.mkdir(backupDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    backupPath = path.join(backupDir, `local-uploads-backup-${stamp}.json`);
    await fs.writeFile(
      backupPath,
      JSON.stringify(
        {
          createdAt: new Date().toISOString(),
          dryRun,
          counts: {
            profiles: affectedProfiles.length,
            profile_businesses: affectedBusinesses.length,
            profile_catalogue_items: affectedCatalogue.length,
            media_assets: affectedMedia.length,
          },
          rows: {
            profiles: affectedProfiles,
            profile_businesses: affectedBusinesses,
            profile_catalogue_items: affectedCatalogue,
            media_assets: affectedMedia,
          },
        },
        null,
        2,
      ),
      'utf8',
    );
  }

  const uploadedByFilename = new Map<string, { secureUrl: string; publicId: string }>();
  const migrated: MigratedItem[] = [];
  const missingFiles: MissingFileReportItem[] = [];

  for (const target of targets) {
    const filePath = path.join(uploadsDir, target.filename);
    let fileBuffer: Buffer | null = null;
    try {
      fileBuffer = await fs.readFile(filePath);
    } catch {
      missingFiles.push({
        table: target.table,
        rowId: target.rowId,
        field: target.field,
        oldUrl: target.oldUrl,
        expectedPath: filePath,
      });
      continue;
    }

    if (dryRun) {
      const cfg = CATEGORY_CONFIG[target.category];
      const baseName = target.filename.replace(/\.[^.]+$/, '');
      const plannedPublicId = `taptch/${target.ownerId}/${cfg.folderSuffix}/${baseName}`;
      migrated.push({
        table: target.table,
        rowId: target.rowId,
        field: target.field,
        oldUrl: target.oldUrl,
        newUrl: `[DRY-RUN] cloudinary://${plannedPublicId}`,
        publicId: plannedPublicId,
      });
      continue;
    }

    let uploaded = uploadedByFilename.get(target.filename);
    if (!uploaded) {
      const cfg = CATEGORY_CONFIG[target.category];
      const baseName = target.filename.replace(/\.[^.]+$/, '');
      const result = await cloudinaryStorage.uploadBuffer(
        fileBuffer,
        mimeTypeFromFilename(target.filename),
        {
          folder: `taptch/${target.ownerId}/${cfg.folderSuffix}`,
          publicId: baseName,
          maxWidth: cfg.maxWidth,
          maxHeight: cfg.maxHeight,
        },
      );
      uploaded = { secureUrl: result.secureUrl, publicId: result.publicId };
      uploadedByFilename.set(target.filename, uploaded);
    }

    migrated.push({
      table: target.table,
      rowId: target.rowId,
      field: target.field,
      oldUrl: target.oldUrl,
      newUrl: uploaded.secureUrl,
      publicId: uploaded.publicId,
    });
  }

  if (!dryRun && uploadedByFilename.size > 0) {
    const urlMap = new Map<string, string>();
    for (const [fname, val] of uploadedByFilename.entries()) {
      urlMap.set(fname, val.secureUrl);
    }

    for (const p of affectedProfiles) {
      const nextAvatar = (() => {
        const f = extractLocalUploadFilename(p.avatarUrl);
        return f && urlMap.has(f) ? urlMap.get(f)! : p.avatarUrl;
      })();
      const nextCover = (() => {
        const f = extractLocalUploadFilename(p.coverUrl);
        return f && urlMap.has(f) ? urlMap.get(f)! : p.coverUrl;
      })();
      const nextPortfolio = rewriteUrlsInJson(p.portfolio, urlMap);
      const nextGallery = rewriteUrlsInJson(p.gallery, urlMap);
      const nextPublished = rewriteUrlsInJson(p.publishedJson, urlMap);

      await db
        .update(schema.profiles)
        .set({
          avatarUrl: nextAvatar,
          coverUrl: nextCover,
          portfolio: nextPortfolio.updated,
          gallery: nextGallery.updated,
          publishedJson: nextPublished.updated,
          updatedAt: new Date(),
        })
        .where(eq(schema.profiles.id, p.id));
    }

    for (const b of affectedBusinesses) {
      const fLogo = extractLocalUploadFilename(b.logoUrl);
      const fCover = extractLocalUploadFilename(b.coverUrl);
      await db
        .update(schema.profileBusinesses)
        .set({
          logoUrl: fLogo && urlMap.has(fLogo) ? urlMap.get(fLogo)! : b.logoUrl,
          coverUrl: fCover && urlMap.has(fCover) ? urlMap.get(fCover)! : b.coverUrl,
          updatedAt: new Date(),
        })
        .where(eq(schema.profileBusinesses.id, b.id));
    }

    for (const c of affectedCatalogue) {
      const fImg = extractLocalUploadFilename(c.imageUrl);
      if (fImg && urlMap.has(fImg)) {
        await db
          .update(schema.profileCatalogueItems)
          .set({
            imageUrl: urlMap.get(fImg)!,
            updatedAt: new Date(),
          })
          .where(eq(schema.profileCatalogueItems.id, c.id));
      }
    }

    for (const m of affectedMedia) {
      const fMedia = extractLocalUploadFilename(m.secureUrl || m.assetUrl);
      if (fMedia && uploadedByFilename.has(fMedia)) {
        const up = uploadedByFilename.get(fMedia)!;
        await db
          .update(schema.mediaAssets)
          .set({
            storageProvider: 'cloudinary',
            storageKey: up.publicId,
            storageObjectId: up.publicId,
            cloudinaryPublicId: up.publicId,
            assetUrl: up.secureUrl,
            secureUrl: up.secureUrl,
            updatedAt: new Date(),
          })
          .where(eq(schema.mediaAssets.id, m.id));
      }
    }
  }

  return {
    dryRun,
    backupPath,
    scannedCount:
      profilesRows.length + businessRows.length + catalogueRows.length + mediaRows.length,
    affectedRowCount,
    migrated,
    missingFiles,
    skippedAlreadyMigrated: 0,
  };
}

async function main() {
  dotenv.config({ path: path.resolve('.env.local') });
  dotenv.config({ path: path.resolve('.env') });

  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const dryRun = !apply;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to run the local uploads migration.');
  }

  const client = postgres(databaseUrl, { prepare: false });
  const db = drizzle(client, { schema });
  const cloudinaryStorage = new CloudinaryStorageService();

  try {
    const report = await migrateLocalUploads(
      {
        db,
        cloudinaryStorage,
        uploadsDir: path.resolve(process.cwd(), 'uploads', 'profiles'),
        backupDir: path.resolve(process.cwd(), 'backups'),
      },
      { dryRun },
    );

    console.log(JSON.stringify(report, null, 2));
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[migrate-local-uploads-to-cloudinary] Failed:', err);
    process.exit(1);
  });
}
