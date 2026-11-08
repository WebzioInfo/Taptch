# TAPTCH — Cloudflare Storage Architecture & Migration Plan

**Date:** November 9, 2026  
**Architect:** Principal Cloud Architect, Senior Full-Stack Engineer  
**Target Services:** Cloudflare Images (v1 Direct Creator Upload & Delivery) + Cloudflare R2 (S3-Compatible Object Storage)

---

## 1. Target Architecture & Service Division

```
                                +-----------------------------+
                                |      Taptch Application     |
                                |  (Next.js 15 App Router)    |
                                +--------------+--------------+
                                               |
                                               v
                        +-----------------------------------------------+
                        |        Centralized Storage Abstraction        |
                        |      (src/lib/storage/StorageService.ts)       |
                        +--------------+-----------------+--------------+
                                       |                 |
                   +-------------------+                 +-------------------+
                   | (Image Assets)                                          | (Documents, Videos, Raw Files)
                   v                                                         v
    +------------------------------+                          +------------------------------+
    |      Cloudflare Images       |                          |        Cloudflare R2         |
    | - Avatars, Logos, Covers     |                          | - PDF Corporate Brochures    |
    | - Product & Gallery Images   |                          | - MP4/WebM Video Showcases   |
    | - NFC Card Mockups           |                          | - Batch QR Vector Sheets     |
    +--------------+---------------+                          +--------------+---------------+
                   |                                                         |
                   v                                                         v
    +------------------------------+                          +------------------------------+
    | Global Image Delivery CDN    |                          | Global Object Delivery CDN   |
    | https://imagedelivery.net/   |                          | https://assets.taptch.com/   |
    | - Automatic WebP / AVIF      |                          | - Range requests / streaming |
    | - Responsive Width Variants  |                          | - Private presigned access   |
    +------------------------------+                          +------------------------------+
```

### Architectural Principles
1. **Cloudflare Images** is selected for all user and business image assets:
   - Direct Creator Upload via one-time authenticated upload URLs (`POST /client/v4/accounts/{account_id}/images/v2/direct_upload`).
   - Global CDN delivery via `https://imagedelivery.net/{account_hash}/{imageId}/{variant}`.
   - Built-in responsive variants: `avatar` (400x400 fill), `cover` (1200x400 fit), `thumbnail` (200x200 crop), `public` (lossless optimized).
2. **Cloudflare R2** is selected for documents, videos, and private/vector print files:
   - Zero egress fees.
   - S3-compatible API using native fetch or lightweight S3 client.
   - Presigned download URLs for private files and custom domain CDN for public documents.
3. **StorageService Interface** encapsulates both adapters behind a single, strongly-typed contract:
   - `upload(file: Buffer, options: StorageUploadOptions): Promise<StorageAssetResult>`
   - `delete(assetId: string, actorId: string, isAdmin?: boolean): Promise<{ success: boolean; error?: string }>`
   - `getPublicUrl(storageKey: string, options?: TransformOptions): string`
   - `getPrivateUrl(storageKey: string, expiresInSeconds?: number): Promise<string>`
   - `generateDirectUploadUrl(category: string, actorId: string): Promise<DirectUploadToken>`
   - `validateFile(file: Buffer, mimeType: string, maxSize: number): ValidationResult`

---

## 2. Configuration & Environment Variables

| Variable Name | Purpose | Example / Format |
|---|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID | `0123456789abcdef0123456789abcdef` |
| `CLOUDFLARE_IMAGES_API_TOKEN` | Bearer Token for Images API | `cf_img_xxxxxxxxxxxxxxxxxxxx` |
| `CLOUDFLARE_IMAGES_ACCOUNT_HASH`| Delivery Hash for `imagedelivery.net` | `N7q9-X...` |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | R2 S3 Access Key ID | `e9a0...` |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY`| R2 S3 Secret Access Key | `4f1b...` |
| `CLOUDFLARE_R2_BUCKET_NAME` | Bucket Name | `taptch-media` |
| `CLOUDFLARE_R2_ENDPOINT` | R2 S3-Compatible Endpoint | `https://<account_id>.r2.cloudflarestorage.com` |
| `CLOUDFLARE_R2_PUBLIC_BASE_URL`| Custom CDN domain for R2 files | `https://assets.taptch.com` |

---

## 3. Database Migration Strategy

### Schema Changes (`media_assets`)
We will introduce provider-neutral columns while keeping legacy columns nullable during migration to guarantee zero downtime:
- `storage_provider`: `varchar(32)` (`'cloudflare_images' | 'cloudflare_r2' | 'mock'`)
- `storage_key`: `varchar(255)` (The Cloudflare Image ID or R2 object key)
- `storage_object_id`: `varchar(255)` (Unique Cloudflare asset identifier)
- `asset_url`: `text` (The full canonical delivery URL)
- `asset_type`: `varchar(32)` (`'image' | 'video' | 'document' | 'raw'`)
- `mime_type`: `varchar(100)`
- `is_public`: `boolean` (Default: `true`)
- Backward-compatibility: `cloudinary_public_id` becomes nullable and mirrors `storage_key`. `secure_url` mirrors `asset_url`.

---

## 4. Execution Slices

1. **Slice 1: Database Migration**: Create schema updates in `src/db/schema/media.ts` and SQL migration `0012_cloudflare_storage.sql`. Apply to local and live database.
2. **Slice 2: Storage Engine Core**: Implement `src/lib/storage/` with `types.ts`, `config.ts`, `images-adapter.ts`, `r2-adapter.ts`, and `index.ts` with test/mock resilience.
3. **Slice 3: API & Route Handlers**: Migrate `/api/v1/media/upload`, `/api/v1/media/signature` (renamed/adapted for direct upload), `/api/v1/media/[id]`, `/api/v1/admin/media`.
4. **Slice 4: UI Components & Admin**: Update `MediaUploaders.tsx` and `src/app/(admin)/admin/page.tsx` with Cloudflare branding, status, and previews.
5. **Slice 5: Asset Migration Utility**: Build `scripts/migrate-cloudinary-to-cloudflare.ts` with dry-run, batching, metadata comparison, and database updating.
6. **Slice 6: Cloudinary Package Purge**: Uninstall `cloudinary` package, remove from `package.json`, update `next.config.mjs`, update `.env.example`.
7. **Slice 7: Test Suite & Verification**: Replace `tests/unit/cloudinary.test.ts` with comprehensive `tests/unit/storage-service.test.ts`. Verify typecheck, lint, test, and build.
8. **Slice 8: Documentation, Commit & GitHub Push**: Update all docs, commit as `feat(storage): replace Cloudinary with Cloudflare`, and push to `origin/main`.
