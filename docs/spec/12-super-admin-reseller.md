# Tapzio Specification — 12 Super Admin, Reseller, White-Label & Domains

> Source: Master Prompt Section 12

## Super Admin Control Plane
A dedicated control cockpit (`(admin)` route group) granting complete operational autonomy without requiring direct database access:
- **Operations Dashboard**:
  - Live metric KPI cards: MRR, active users, published profiles, orders in production, card activation rate, queue health (BullMQ stats), error rates.
- **Tenant Management**:
  - Global user directory, organization directory, subscription status, plan upgrades/downgrades, account suspension and restoration.
- **Order & Production Kanban**:
  - Visual drag-and-drop manufacturing pipeline from artwork review to courier handover.
  - Integration with courier APIs (Shiprocket / Delhivery / Bluedart tracking webhook updates).
- **Inventory & Hardware Registry**:
  - Chip token batches, batch generation wizard, stock depletion alerts, encoder station monitoring.
- **Content & Catalog Administration**:
  - Template engine manager (publish/unpublish, edit default token schemas).
  - System settings and feature flag toggle switches.
  - Comprehensive immutable audit log of administrative operations.

## Reseller Portal & Multi-Tier Channel Sales
- Dedicated portal for certified agency partners and hardware distributors.
- Reseller-branded workspace allowing client creation under wholesale discounted pricing.
- Tiered commission calculation engine with monthly automated payout statements.
- Audited "Login as Client" capability allowing resellers to assist clients with profile design.

## White-Label Engine
- Custom branding configuration:
  - System Brand Name, Logo, Favicon, Accent Colors, Typography.
  - Custom Support Email, Helpdesk URL, Terms of Service, and Privacy Policy links.
  - Dynamic removal or replacement of "Powered by Tapzio" footer badges across public profiles and system emails.

## Custom Domain Verification Architecture
Allows clients to host profiles on their own vanity domains (e.g., `card.acmecorp.com`, `connect.johndoe.in`):
1. **Domain Registration**: User submits domain in profile settings.
2. **DNS Verification**: System issues unique verification record:
   - TXT record: `_tapzio-verify.[domain] = [random-token]`
   - CNAME record: `[domain] -> cname.tapzio.com`
3. **Automated Verification Worker**: BullMQ job periodically queries DNS via Node `dns.promises.resolveTxt`.
4. **Edge SSL Provisioning**:
   - Status tracked: `PENDING_DNS` → `DNS_VERIFIED` → `SSL_PROVISIONING` → `ACTIVE` → `FAILED`.
   - Host-Header Security: Edge middleware resolves `Host` header strictly against verified database domains. Requests with unrecognized or unverified host headers are terminated immediately (HTTP 404/403) to prevent Host-Header Poisoning.

