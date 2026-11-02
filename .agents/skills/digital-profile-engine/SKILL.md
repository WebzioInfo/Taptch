---
name: digital-profile-engine
description: "Master Tappzio's digital identity domain architecture: personal vs business profiles, multi-business association, dynamic section reordering, and pre-compiled JSON snapshots."
risk: safe
source: Tappzio-core
date_added: "2026-11-02"
version: "1.0.0"
---

# Tappzio Digital Profile Engine Architecture Skill

Domain engineering specification and implementation standard for Tappzio's core digital profile system, multi-business association architecture, and atomic snapshot compilation.

---

## 1. When to Use This Skill

- Modifying or extending digital profiles in `src/modules/profiles/index.ts`.
- Implementing multi-business entities (`profile_businesses` table).
- Managing product & service catalogue shelves (`profile_catalogue_items` table).
- Implementing reorderable profile sections (`profile_sections` table).
- Compiling pre-rendered JSON snapshots (`published_json`) on publish.

---

## 2. Core Domain Entities & Relationships

```mermaid
erDiagram
    USERS ||--o{ PROFILES : owns
    PROFILES ||--o{ PROFILE_BUSINESSES : contains
    PROFILES ||--o{ PROFILE_CATALOGUE_ITEMS : showcases
    PROFILES ||--o{ PROFILE_SECTIONS : configures
    PROFILES ||--o{ LEADS : captures
    CARDS }o--|| PROFILES : maps_to

    PROFILES {
        string id PK
        string slug UK
        string owner_id FK
        string display_name
        string headline
        string bio
        string template_id
        string status "draft | published"
        jsonb published_json
    }

    PROFILE_BUSINESSES {
        string id PK
        string profile_id FK
        string company_name
        string role_title
        string industry
        string website_url
        string brochure_url
        integer display_order
    }

    PROFILE_CATALOGUE_ITEMS {
        string id PK
        string profile_id FK
        string title
        string item_type "product | service"
        string price
        string currency
        string action_url
        integer display_order
    }
```

---

## 3. Personal vs Single Business vs Multi-Business Architecture

Tappzio supports three distinct profile operational modes:

1. **Personal Executive Profile (`profile_type: 'personal'`)**:
   - Focuses on individual identity, executive bio, social/networking links, and direct vCard download.
2. **Single Business Profile (`profile_type: 'business'`)**:
   - Focuses on a single company entity, company overview, business address, and primary contact channels.
3. **Multi-Business Executive Profile**:
   - Allows 1 person with 1 card to attach up to 10 distinct companies (governed by plan entitlements).
   - Visitors can toggle between businesses via interactive switcher tabs on the public profile.
   - Each business entity carries its own logo, role title, brochure PDF download link, and dedicated catalogue items.

---

## 4. Atomic Snapshot Compilation on Publish

To satisfy the **Zero Dynamic Profile Hot Path** architectural constraint, public profile pages must never execute heavy relational joins across multiple tables on every tap.

When a user clicks "Publish Profile" in the builder:
1. `publishProfile(actor, profileId)` queries the profile, businesses, catalogue items, and active sections.
2. Compiles an atomic JSON snapshot representing the exact rendered state:
   ```json
   {
     "displayName": "Aditya Singhania",
     "headline": "Managing Partner, Singhania Capital",
     "templateId": "obsidian-luxury",
     "businesses": [ ... ],
     "catalogue": [ ... ],
     "sections": [ ... ],
     "publishedAt": "2026-11-02T14:00:00Z"
   }
   ```
3. Updates `profiles.published_json` and sets `status = 'published'`.
4. Syncs the snapshot into Redis cache (`profile:snapshot:${slug}`) for instant edge retrieval.
5. Invalidation: Any profile update purges the Redis cache key and invokes `revalidatePath('/p/' + slug)`.

---

## 5. Mandatory Engineering Rules

1. **Slug Immutability & Collision Safety**: Profile slugs must be normalized (`normalizeSlug`) to lowercase alphanumeric hyphens (`/^[a-z0-9-]+$/`). Slugs must be unique platform-wide.
2. **Entitlement Gate on Profile Creation**: Always call `assertWithinLimit(actor, 'max_profiles', currentCount + 1)` before inserting a new profile.
3. **Multi-Business Limit Enforcement**: Check `assertWithinLimit(actor, 'max_businesses', currentBusinessCount + 1)` before adding a business.
4. **Zero Raw DB Queries in Page Components**: Public page `/p/[slug]` must call `getProfileBySlug(slug)` domain service, never direct `db` queries.

