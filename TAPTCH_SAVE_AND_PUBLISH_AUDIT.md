# Taptch Profile Studio — Save Draft & Publish Architecture Audit

## 1. Executive Summary
This document specifies the persistence, restoration, serialization, cache invalidation, and publication pipeline for digital profiles in the Taptch platform. Both **Save Draft** and **Publish** flows are verified across PostgreSQL, Redis, NestJS route controllers, and React Query mutations.

---

## 2. End-to-End Data Pipeline

```
[ Studio User Input ]
        │
        ▼
[ Central Form State ] (React State in BuilderPage.tsx)
        │
        ▼
[ Serialization & Normalization ] (Clean trims, entity ID assignment, blanks omitted)
        │
        ├──▶ [ POST /api/v1/profiles ] (New Draft)
        └──▶ [ PATCH /api/v1/profiles/:id ] (Update Draft)
                │
                ▼
        [ ProfilesService.update() ]
                │
                ├──▶ Validates actor authorization & ownership
                ├──▶ Checks slug uniqueness & reserved system usernames
                ├──▶ Atomically updates profiles table (displayName, headline, bio, contacts, theme, etc.)
                ├──▶ Replaces profile_businesses child rows (with display_order)
                ├──▶ Replaces profile_catalogue_items child rows (with display_order)
                └──▶ Invalidates Redis edge cache: profile:slug:<slug>
                        │
                        ▼
                [ If Publish Clicked ]
                        │
                        ▼
                [ POST /api/v1/profiles/:id/publish ]
                        │
                        ├──▶ Pre-compiles fresh PublicProfileSnapshot from DB
                        ├──▶ Atomically stamps status = 'PUBLISHED' & published_at = NOW()
                        ├──▶ Writes pre-compiled snapshot into published_json
                        └──▶ Edge caches snapshot in Redis (24-hour TTL)
                                │
                                ▼
                        [ Public Profile Route: /p/:slug or /:slug ]
                                │
                                └──▶ Sub-50ms SSR/Client snapshot render
```

---

## 3. Save Draft vs. Publish Behavior Comparison

| Parameter | Save Draft (`publish: false`) | Publish Profile (`publish: true`) |
|---|---|---|
| **Trigger Action** | User clicks `Save Draft` button | User clicks `Publish` CTA button |
| **Required Validations** | Valid `displayName` and valid `slug` | Valid `displayName`, unique `slug`, verified URLs |
| **Status in Database** | Remains `'DRAFT'` | Transitions to `'PUBLISHED'` |
| **`published_at` Timestamp** | `null` | Updated to current `Date()` |
| **`published_json` Snapshot** | Unchanged or partial | Pre-compiled complete `PublicProfileSnapshot` |
| **Redis Cache State** | Stale cache purged (`del profile:slug:<slug>`) | Hot cache primed for 24h (`set profile:slug:<slug>`) |
| **Public Route Accessibility** | Returns `robots: noindex, nofollow` | Returns `robots: index, follow` with full OG metadata |
| **User Toast Feedback** | `"Profile draft saved successfully!"` | `"Profile published live at /{slug}!"` |
| **Navigation on Create** | Navigates to `/builder/{newId}` | Navigates to `/builder/{newId}` and reveals live URL link |

---

## 4. Draft Restoration & Persistence Verification Matrix

| Entity | DB Storage Mechanism | Retrieval Path (`findOne`) | Form Hydration Mapping | Restoration Integrity Status |
|---|---|---|---|---|
| **Identity & Card** | Columns in `profiles` | `profiles` row | `setDisplayName`, `setHeadline`, `setBio`, `setAvatarUrl`, `setCoverUrl` | ✅ 100% Verified |
| **Direct Contacts** | Columns in `profiles` | `profiles` row | `setPhone`, `setWhatsapp`, `setEmail`, `setWebsite`, `setAddress`, `setLocation` | ✅ 100% Verified |
| **Template & Colors** | `template_id`, `theme_config` | `profiles` row | `setTemplateId(canonicalTemplateId(...))`, `setThemeColors(...)` | ✅ 100% Verified |
| **Social Channels** | `profiles.social_links` (JSONB) | `profiles` row | `setSocialLinks(profile.socialLinks)` | ✅ 100% Verified |
| **Ventures & Branches** | `profile_businesses` table | Joined by `profileId` | Normalized with `companyName`, `jobTitle`, `businessWebsite`, `businessAddress` | ✅ 100% Verified |
| **Products & Services** | `profile_catalogue_items` table | Joined by `profileId` | Normalized with `title`, `type`, `price`, `description`, `actionUrl`, `actionLabel` | ✅ 100% Verified |
| **SEO & Sharing Meta** | `profiles.custom_fields` (JSONB) | `profiles` row | `setSeoTitle(profile.customFields.seo.title)`, `setSeoDescription(...)` | ✅ 100% Verified |

---

## 5. Failure & Edge Case Handling

1. **Duplicate Slug Collision**:
   - Backend detects conflicting profile slugs with `ne(schema.profiles.id, profileId)` and throws `ConflictException("The profile slug ... is already taken.")`.
   - The studio UI captures the error and displays an inline red diagnostic toast without clearing entered form state.

2. **Reserved System Usernames**:
   - Slugs matching reserved paths (`admin`, `api`, `dashboard`, `login`, `signup`, `builder`, `settings`, `support`) are rejected with `BadRequestException`.

3. **Network Failure Resilience**:
   - In the event of a network disruption during save, the mutation fails gracefully, triggering `onError` with a descriptive message while preserving all inputs in React state.

4. **Slug Migration Handling**:
   - When a profile's slug is updated, `ProfilesService.update()` invalidates both the legacy cache key (`profile:slug:<oldSlug>`) and the new cache key (`profile:slug:<newSlug>`), preventing orphaned stale cache entries.
