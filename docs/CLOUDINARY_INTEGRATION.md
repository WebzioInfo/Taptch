# Taptch — Cloudinary Media Management Architecture

## 1. Architectural Overview

Taptch integrates **Cloudinary** as the centralized, enterprise-grade Digital Asset Management (DAM) platform powering high-resolution avatars, business logos, cover images, product & service catalogues, photo galleries, video showcases, and downloadable PDF corporate brochures.

The integration strictly follows our **Controlled Publishing & Plan Assignment System**:
- Registered users can upload media assets and assemble complete profiles in draft mode.
- All media assets are stored securely in Cloudinary with metadata persisted in PostgreSQL (`media_assets`).
- Public delivery of media assets is governed by the user's assigned subscription plan, filtered server-side during the compilation of the public JSON snapshot.

---

## 2. Environment Variables & Credentials

Cloudinary credentials are configured securely in `.env.local` (and documented in `.env.example`):

```bash
# Cloudinary Backend Configuration (Server-Side SDK)
CLOUDINARY_CLOUD_NAME=dhydmxcq2
CLOUDINARY_API_KEY=715391971962435
CLOUDINARY_API_SECRET=LSIRWQLv_QuFNQ99NaHKnutW_qk

# Cloudinary Public Variables (Client Direct Uploads & Signatures)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dhydmxcq2
NEXT_PUBLIC_CLOUDINARY_API_KEY=715391971962435
```

---

## 3. Standardized Cloudinary Folder Taxonomy

To maintain enterprise order and prevent asset collision, all uploads adhere to a strict namespace taxonomy defined in `src/lib/cloudinary/index.ts`:

| Media Purpose | Cloudinary Folder Path | Resource Type | Max File Size |
| :--- | :--- | :--- | :--- |
| **Personal Avatars** | `Taptch/profiles/personal` | `image` | 10 MB |
| **Personal Covers** | `Taptch/profiles/covers` | `image` | 10 MB |
| **Personal Galleries** | `Taptch/profiles/galleries` | `image` | 10 MB |
| **Business Logos** | `Taptch/businesses/logos` | `image` | 10 MB |
| **Business Covers** | `Taptch/businesses/covers` | `image` | 10 MB |
| **Catalogue Products** | `Taptch/businesses/products` | `image` | 10 MB |
| **Catalogue Services** | `Taptch/businesses/services` | `image` | 10 MB |
| **Business Galleries** | `Taptch/businesses/galleries` | `image` | 10 MB |
| **PDF Brochures** | `Taptch/documents/brochures` | `raw` / `document` | 20 MB |
| **Promotional Videos** | `Taptch/videos` | `video` | 50 MB |
| **Template Previews** | `Taptch/templates/previews` | `image` | 10 MB |
| **Physical NFC Assets** | `Taptch/nfc-products` | `image` | 10 MB |

---

## 4. Next.js Image Optimization Configuration

Remote image domains are whitelisted in `next.config.mjs` with next-gen image formats:

```javascript
images: {
  formats: ['image/avif', 'image/webp'],
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'res.cloudinary.com',
      pathname: '/dhydmxcq2/**',
    },
    {
      protocol: 'https',
      hostname: 'images.unsplash.com',
    },
  ],
},
```

---

## 5. Media Upload Workflows

### 5.1 Server-Side Multipart File Upload (`POST /api/v1/media/upload`)
- Handles authenticated multipart form uploads with streaming buffer to Cloudinary.
- Validates file MIME types: JPEG, PNG, WebP, AVIF, GIF, SVG, MP4, WebM, PDF.
- Enforces strict file size limits (10MB for images, 20MB for PDF brochures, 50MB for videos).
- Automatically records asset metadata in PostgreSQL `media_assets`.

### 5.2 Direct Client-Side Signed Uploads (`POST /api/v1/media/signature`)
- Generates HMAC-SHA256 request signatures via Cloudinary SDK without exposing `CLOUDINARY_API_SECRET` to the browser.
- Attaches contextual tags: `['Taptch', 'user_<id>', '<category>']`.
- Enables high-speed, direct-from-browser uploads straight to Cloudinary Edge CDN.

### 5.3 Media Deletion (`DELETE /api/v1/media/[id]`)
- Enforces multi-tenant ownership: only the asset owner or a platform `super_admin` can delete an asset.
- Removes file from Cloudinary CDN and deletes the row from PostgreSQL.

---

## 6. PostgreSQL Metadata Schema (`media_assets`)

Located in `src/db/schema/media.ts`:

```typescript
export const mediaAssets = pgTable('media_assets', {
  id: varchar('id', { length: 64 }).primaryKey(),
  ownerId: text('owner_id').references(() => users.id, { onDelete: 'cascade' }),
  profileId: varchar('profile_id', { length: 64 }).references(() => profiles.id, { onDelete: 'set null' }),
  businessId: varchar('business_id', { length: 64 }).references(() => profileBusinesses.id, { onDelete: 'set null' }),
  resourceType: varchar('resource_type', { length: 32 }).notNull().default('image'),
  mediaCategory: varchar('media_category', { length: 64 }).notNull(),
  cloudinaryPublicId: text('cloudinary_public_id').notNull(),
  secureUrl: text('secure_url').notNull(),
  format: varchar('format', { length: 32 }),
  fileSize: integer('file_size'),
  width: integer('width'),
  height: integer('height'),
  duration: integer('duration'),
  visibilityStatus: varchar('visibility_status', { length: 32 }).notNull().default('public'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

---

## 7. Dynamic Transformations & Zero Dynamic Profile Hot Path

Public digital profile views (`/p/[slug]`) consume pre-optimized responsive Cloudinary URLs generated via `getTransformedImageUrl`:
- **Auto Format & Quality**: `f_auto,q_auto` selects the smallest byte payload (AVIF/WebP) matching the visitor's browser.
- **Smart Gravity & Face Cropping**: `c_thumb,g_face` for personal avatars ensures perfect framing.
- **Pre-compiled Snapshot**: All image and document URLs are compiled into `profiles.publishedJson` during admin approval, guaranteeing **Zero Dynamic Database Reads** on public visitor requests.

