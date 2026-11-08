# TAPTCH — Complete Cloudinary Discovery Report

**Audit Date:** November 9, 2026  
**Auditor:** Principal Cloud Architect & Security Engineer  
**Objective:** Complete discovery and enumeration of all Cloudinary dependencies, SDK usages, environment variables, APIs, UI components, database fields, and test fixtures across the TAPTCH repository.

---

## 1. Discovered Inventory & Locations

### A. NPM Dependencies & Packages
- **`package.json`**: `"cloudinary": "^2.11.0"` (Production dependency)
- **`package-lock.json`**: Lock entry for `cloudinary` and transitive dependencies (`q`, `core-js`, etc.)

### B. Environment Configuration Files
- **`.env.example`**:
  - `CLOUDINARY_CLOUD_NAME=dhydmxcq2`
  - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dhydmxcq2`
  - `CLOUDINARY_API_KEY=your_cloudinary_api_key_here`
  - `CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here`
- **`.env.local`**:
  - Configured with live/sandbox keys (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_URL`).

### C. Core Engine & Abstraction Files
- **`src/lib/cloudinary/index.ts`** (357 lines):
  - Configuration resolver (`getCloudinaryConfig`)
  - Initialization (`initCloudinary`)
  - Standardized folder taxonomy (`CLOUDINARY_FOLDERS`)
  - Streaming buffer upload (`uploadMediaBuffer`)
  - Signed direct upload parameter generator (`generateSignedUploadParams`)
  - Transformed delivery URL builder (`getTransformedImageUrl`)
  - Deletion handler with owner verification (`deleteMediaAsset`)
  - User media asset listing (`listUserMediaAssets`)

### D. API Route Handlers
- **`src/app/api/v1/media/upload/route.ts`**:
  - Multipart form upload handler with streaming buffer processing
  - Size validation (10MB image, 50MB video, 20MB document)
  - MIME type filtering and folder routing
- **`src/app/api/v1/media/signature/route.ts`**:
  - HMAC-SHA256 direct upload signature endpoint
- **`src/app/api/v1/media/[id]/route.ts`**:
  - Single media asset deletion endpoint
- **`src/app/api/v1/admin/media/route.ts`**:
  - Administrative asset listing endpoint projecting `cloudinaryPublicId`

### E. Frontend UI Components & Pages
- **`src/components/media/MediaUploaders.tsx`**:
  - Universal media uploader component with badges reading `"Cloudinary Hosted"` and `"Uploading to Cloudinary..."`
  - Specialized components: `ProfileImageUploader`, `CoverImageUploader`, `BusinessLogoUploader`, `ProductImageUploader`, `VideoUploader`, `DocumentUploader`
- **`src/app/(admin)/admin/page.tsx`**:
  - Super admin media asset inspector tab
  - Displays `"Cloud: {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}"`
  - Displays `"No Cloudinary media assets registered yet"`
  - Lists assets with `cloudinaryPublicId`

### F. Database Schema & Migrations
- **`src/db/schema/media.ts`**:
  - Table `media_assets`: Column `cloudinaryPublicId: varchar('cloudinary_public_id', { length: 255 }).notNull().unique()`
- **`src/db/migrations/0006_media_and_publishing.sql`**:
  - SQL table definition for `media_assets` with column `cloudinary_public_id`

### G. Next.js Runtime Configuration
- **`next.config.mjs`**:
  - `images.remotePatterns` contains `res.cloudinary.com`

### H. Automated Tests & Fixtures
- **`tests/unit/cloudinary.test.ts`**:
  - 5 tests verifying folder taxonomy, signature generation, transformed URLs, mock buffer upload, and deletion.
- **`tests/unit/publishing-scenarios.test.ts`**:
  - Mock URLs formatted as `https://res.cloudinary.com/taptch/...`

### I. Documentation References
- **`docs/CLOUDINARY_INTEGRATION.md`**: Entire document dedicated to Cloudinary integration.
- References in `docs/DECISIONS.md`, `docs/PROGRESS.md`, `DEPLOYMENT_GUIDE.md`, `AUDIT_REPORT.md`, `ARCHITECTURE.md`.

---

## 2. Taxonomy of Assets & Operations

| Media Category | Cloudinary Folder Path | Target Cloudflare Service | Target Storage Key / Path |
|---|---|---|---|
| Personal Avatars | `taptch/profiles/personal` | **Cloudflare Images** | `profiles/{userId}/avatars/{id}` |
| Personal Covers | `taptch/profiles/covers` | **Cloudflare Images** | `profiles/{userId}/covers/{id}` |
| Personal Galleries | `taptch/profiles/galleries` | **Cloudflare Images** | `profiles/{userId}/gallery/{id}` |
| Business Logos | `taptch/businesses/logos` | **Cloudflare Images** | `businesses/{bizId}/logos/{id}` |
| Business Covers | `taptch/businesses/covers` | **Cloudflare Images** | `businesses/{bizId}/covers/{id}` |
| Products / Services | `taptch/businesses/products` | **Cloudflare Images** | `businesses/{bizId}/products/{id}` |
| NFC Card Designs | `taptch/nfc-products` | **Cloudflare Images** | `nfc/{id}` |
| PDF Brochures / Docs | `taptch/documents/brochures` | **Cloudflare R2** | `documents/{userId}/{id}.pdf` |
| Video Showcases | `taptch/videos` | **Cloudflare R2** | `videos/{userId}/{id}.mp4` |
| Vector Print Assets | `taptch/print` | **Cloudflare R2** | `print/{batchId}/{id}.pdf` |

---

## 3. Migration Mandates
1. **Zero Disruption to Existing Database Records**: Existing `media_assets` rows must be preserved. Provider-neutral columns (`storage_provider`, `storage_key`, `storage_object_id`, `asset_url`, `asset_type`, `mime_type`, `is_public`) must be added.
2. **Provider-Agnostic Storage Service**: Build `src/lib/storage/` with interface `StorageService`, supporting Cloudflare Images and Cloudflare R2 adapters with mock fallback for local tests.
3. **No Downtime / Broken UI**: Update all API routes, uploaders, and admin panels to interface with the unified storage engine.
4. **Complete Package Purge**: Uninstall `cloudinary` from `package.json` and `package-lock.json`.
