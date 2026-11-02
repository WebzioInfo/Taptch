---
name: nfc-and-qr-engineering
description: NFC NDEF encoding, dynamic unguessable token redirects, card activation security, hardware materials (metal, wood, PVC), anti-metal ferrite shielding, QR code generation, and manufacturer pre-encoding pipelines. Activate when working on NFC or QR features.
---

# NFC & QR Engineering Skill

## 1. Unguessable Token Architecture
- Hardware chips and dynamic QR codes store ONLY unguessable URLs:
  - NFC Tap: `https://{domain}/n/{token}`
  - QR Scan: `https://{domain}/q/{token}`
- Direct profile URLs (`/p/{slug}`) are NEVER burned onto physical cards. This enables instant hardware reassignment, profile slug changes, and lost-card revocation without touching the physical card.
- Token format: High-entropy base62 / nanoid (minimum 12–16 alphanumeric characters, e.g. `n7K9xQ2pLm4W`).

## 2. Chip Types & Physical Material Considerations
- **PVC Cards**: Standard NTAG213 (144 bytes) or NTAG215 (504 bytes). Reliable bidirectional RF tap.
- **Solid Metal Cards**: Metal absorbs RF magnetic fields.
  - **Mandatory Ferrite Shielding**: Must incorporate a 0.2mm anti-metal ferrite shielding layer between the metal substrate and the antenna coil on the reverse face.
  - **Single-Sided Tap**: Metal cards tap from the reverse face only.
  - **Laser-Etched Dynamic QR Fallback**: High-contrast laser-etched QR on the reverse face serves as an immediate fallback for older smartphones or metal tap interference.
- **Wood / Bamboo**: Non-conductive, uses standard NTAG213/216 embedded in laminated core.

## 3. Card Activation & Claim Pipeline
- Cards are distributed in an `unclaimed` state inside a security sleeve with a printed 6-character activation code.
- User visits `/claim/{token}`.
- Authenticated user enters the secret code.
- Verification executes constant-time hash comparison (`crypto.timingSafeEqual`) against `activation_code_hash`.
- Upon successful activation, card transitions to `active` and links to the user's active profile.

## 4. Dynamic QR Code Engine & CI Decode Verification
- Generates SVG, high-resolution PNG, and 300 DPI vector PDF for print manufacturing.
- Supports brand color styling and optional center logo overlay (maintaining 30% Reed-Solomon error correction level H).
- Automated CI Test: Every QR generator modification must execute an automated roundtrip test (generate QR image buffer → decode via `jsQR` → assert decoded URI matches `https://{domain}/q/{token}`).

## 5. Manufacturer Pre-Encoding CSV Pipeline
- Generates batch export CSV containing:
  `serial_number, uid, redirect_token, encoded_url, activation_code_plain`
- Allows card manufacturers to pre-encode NDEF records on industrial pick-and-place lines prior to fulfillment.

