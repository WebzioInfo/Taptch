# Tapzio Specification — 09 Honest & Privacy-Aware Analytics

> Source: Master Prompt Section 9

## Principles & Honesty Rules
1. **Honest Terminology**: An HTTP request to `/n/{token}` confirms a digital link was requested, not physical contact between card and antenna. Metrics must be truthfully labeled:
   - *"NFC Link Opens"* (never "Physical Taps").
   - *"QR Scans"* (requests via `/q/*`).
   - *"Direct & Shared Views"* (requests via `/p/*` without token).
2. **Privacy by Design**:
   - Zero third-party tracker cookies.
   - Raw IP addresses are **never** stored. A daily rotating salted hash (`SHA256(IP + Salt + Date)`) is used strictly for unique visitor counting within a 24-hour window, then discarded.
   - Coarse geolocation only (Country and City via MaxMind GeoLite2 or Cloudflare CF-IPCountry headers).
   - Configurable retention periods (30 days, 90 days, 1 year based on subscription tier).

## Tracked Interaction Events
Events are captured via a lightweight Beacon API (`navigator.sendBeacon`) or background server triggers:
- `PROFILE_VIEW`: Public profile rendered.
- `REDIRECT_NFC`: Link accessed via `/n/{token}`.
- `REDIRECT_QR`: Link accessed via `/q/{token}`.
- `BUTTON_CLICK`: Action button clicked (`type`: `call`, `whatsapp`, `email`, `website`, `directions`, `social`).
- `CONTACT_SAVE`: vCard file downloaded.
- `CONTACT_EXCHANGE`: Lead capture form submitted.
- `CATALOGUE_VIEW`: Product or service card inspected.
- `BROCHURE_DOWNLOAD`: Attached PDF brochure downloaded.
- `UPI_CLICK`: UPI payment link or QR code viewed.
- `BOOKING_CLICK`: Appointment scheduler triggered.

## Asynchronous Data Pipeline & Aggregation
- **Ingestion**: Event endpoints push payloads directly to BullMQ queue (`analytics-events`) in Redis. The user response is never blocked by database analytics writes.
- **Partitioning**: PostgreSQL `analytics_events` table is partitioned by month (`RANGE (created_at)`).
- **Daily Rollups**: A BullMQ cron job runs every night to aggregate raw events into `analytics_daily_rollups` (counts by `profile_id`, `date`, `event_type`, `device_category`, `country`, `city`).
- **Dashboard Queries**: Analytics dashboards query only bounded rollups and pre-calculated materialized views, guaranteeing sub-50ms dashboard load times regardless of historical event volume.

