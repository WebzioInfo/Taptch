# Tapzio Specification — 07 NFC Cards, QR & Redirects

> Source: Master Prompt Section 7

## Hardware & Chip Profiles
- Supported Physical Formats: Matte PVC, Stainless Steel / Brushed Metal, Hybrid Wood (Bamboo, Walnut, Birch), Custom Corporate Cards.
- Chip Types: NXP NTAG213 (144 bytes), NTAG215 (504 bytes), NTAG216 (888 bytes), with support for cryptographic NTAG 424 DNA behind a feature flag.
- Hardware Constraint Handling: Metal cards shield RF signals; chips are embedded on the non-metallic reverse face with ferrite shielding. The reverse side always prints a fallback QR code.

## Card Data Model
- `id`: UUID v4.
- `serialNumber`: Visible hardware identifier (e.g. `TPZ-2026-A91B4C`).
- `uid`: Physical NFC chip UID (hex string, e.g. `04:A1:B2:C3:D4:E5:F6`).
- `chipType`: Enum (`NTAG213`, `NTAG215`, `NTAG216`, `NTAG424_DNA`).
- `token`: Cryptographically random unguessable URL token (base62 or nanoid, 10–12 characters).
- `activationCodeHash`: Argon2id hash of the unique scratch/box activation code.
- `assignedProfileId`: Nullable reference to active `Profile`.
- `assignedUserId`: Nullable reference to card owner.
- `organizationId`: Nullable reference to corporate owner.
- `status`: Enum (`MANUFACTURED`, `ENCODED`, `SHIPPED`, `ACTIVE`, `DEACTIVATED`, `LOST`).
- `batchId`: Reference to manufacturing production batch.
- `assignmentHistory`: JSON log of reassignments, unlinking, and activations.

## Architecture of Unguessable Redirects
- Chips **never store the profile slug or direct profile URL**.
- Chips store exclusively an NDEF URI record pointing to:
  - NFC URL: `https://{short-domain}/n/{token}`
  - QR Code URL: `https://{short-domain}/q/{token}`
- Benefits:
  1. The physical card never needs re-encoding when user changes their slug, template, or profile.
  2. Analytics cleanly distinguish between physical NFC taps (`/n/*`) and camera QR scans (`/q/*`).
  3. Lost cards can be instantly severed or redirected to a lost-card notice.

## High-Throughput Redirect Execution Flow (< 50ms)
1. Inbound HTTP GET `/n/{token}` or `/q/{token}`.
2. Fast Redis lookup: `HGET card:{token}`.
   - If cache miss: Query database and cache card payload in Redis with TTL.
3. State evaluation:
   - `ACTIVE` & bound to published profile:
     - Push analytics event asynchronously to BullMQ queue `analytics-ingest`.
     - Return HTTP 302 redirect to `/p/{slug}?src=nfc` (or `?src=qr`).
   - `MANUFACTURED` / `ENCODED` (unclaimed):
     - Return HTTP 302 to `/activate?token={token}`.
   - `LOST` or `DEACTIVATED`:
     - Return HTTP 410 Gone with user-friendly "This card is deactivated" page.
   - Unrecognized token:
     - Return HTTP 404 Not Found with helpful recovery options.
4. Resilience: If Postgres is experiencing brief downtime, active cards continue redirecting seamlessly from Redis memory.

## Security & Card Operations
- NFC UID is public metadata; it is **never** accepted as proof of ownership.
- Card activation requires:
  1. Authenticated user session.
  2. Valid activation code matching `activationCodeHash`.
  3. Rate limiting (max 5 failed attempts per IP/user per 15 minutes to prevent brute forcing).
- Encoder Station CLI (`tools/nfc-encoder`):
  - Programs chips via PC/SC smartcard readers (e.g. ACR122U).
  - Built-in simulation mode for automated testing and machines without physical hardware.
  - CSV batch encoding with read-back verification against the central database API.

## QR Code & vCard Generators
- **QR Generation Engine**:
  - Dynamic vector SVG / high-resolution PNG / print-ready 300 DPI PDF.
  - Error correction levels: `Q` (25%) or `H` (30%) allowing centered brand logo overlay.
  - Automated quiet-zone enforcement and color contrast validation.
  - Automated CI test suite that decodes generated QR images to ensure 100% scan fidelity.
- **vCard 3.0 / 4.0 Engine**:
  - Compliant `.vcf` generation.
  - Embedded, compressed, base64-encoded profile photo.
  - Multi-line phone numbers, work emails, corporate title, physical address, URLs, and social profiles.

