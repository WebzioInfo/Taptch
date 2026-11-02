# Tapzio Specification — 02 Locked Technical Decisions

> Source: Master Prompt Section 2

## Core Architecture
- **Single Next.js 15 Application**: App Router, TypeScript strict mode.
  - Route groups and host-based routing:
    - `(marketing)`: Marketing pages, landing, card configurator, pricing.
    - `(profile)`: Public profile rendering (`/p/[slug]`) plus `/n/[token]` (NFC) and `/q/[token]` (QR) redirect handlers.
    - `(app)`: Customer dashboard, corporate workspace, card management, leads, builder.
    - `(admin)`: Super-admin control plane, support portal, reseller admin.
  - Domain logic separated into `src/modules/*` for clean encapsulation and future microservice extraction if needed.
  - Companion tooling: `tools/nfc-encoder` (Node.js CLI tool with simulation mode by default).

## Front-End Stack
- **CSS Framework**: Tailwind CSS with custom design tokens.
- **Component Primitives**: shadcn/ui + Radix UI primitives.
- **Animations**: Framer Motion (lazy-loaded; public profiles use CSS/minimal motion to honor performance budgets).
- **Icons**: Lucide icons exclusively (no emoji icons).
- **Internationalization**: `next-intl` (English, Malayalam, Hindi, Arabic).
- **Forms & Validation**: React Hook Form with Zod schemas.

## Data Layer & Isolation
- **Database**: PostgreSQL with Prisma ORM (versioned migrations).
- **Tenant Isolation**:
  - Primary: Tenant-scoped data-access layer (every service call and query takes an actor/org context).
  - Secondary (Defence in Depth): PostgreSQL Row Level Security (RLS) on sensitive tables (`profiles`, `leads`, `cards`, `orders`, `invoices`).

## Caching & Background Processing
- **Cache & Rate Limiting**: Redis.
- **Queues**: BullMQ for asynchronous jobs:
  - Analytics event ingestion & rollup aggregation.
  - Transactional emails and WhatsApp alerts.
  - Outgoing webhooks.
  - CSV bulk employee imports and profile generations.
  - PDF brochure & invoice generation.
  - Apple/Google Wallet pass signing.

## Storage & Media
- **Object Storage**: S3 interface (MinIO for local dev, AWS S3 / Cloudflare R2 for production).
- **Upload Flow**: Presigned upload URLs with client-side upload directly to storage.
- **Image Pipeline**: `sharp` worker pipeline generating WebP and AVIF formats in 3 sizes (thumbnail, medium, full) plus BlurHash placeholders.

## Authentication & Security
- **Auth Engine**: Auth.js (NextAuth v5) supporting:
  - Magic Link / Email OTP.
  - Google OAuth 2.0.
  - Phone OTP (SMS provider interface with console provider in local dev).
  - Argon2id for password hashing.
  - Mandatory TOTP MFA for `super_admin` and `support_admin` roles.
- **Session Security**: HttpOnly, SameSite=Lax, Secure cookies, CSRF protection, session rotation.

## Payments & Subscriptions
- **Gateway**: Razorpay behind a polymorphic `PaymentProvider` interface (with a Stripe stub).
- **Verification**: Strict server-side webhook signature verification; authoritative status fetched from provider.
- **Idempotency**: Webhook events processed idempotently via unique transaction IDs.
- **Rule**: Never unlock subscriptions or cards from client-side redirects alone.

## Communications
- **Email**: Resend / Amazon SES via provider interface (Console logger in dev); React Email templates branded via central config.
- **WhatsApp**: WhatsApp Business Cloud API provider interface (Console logger in dev).
- **SMS**: Twilio / Fast2SMS provider interface.

## Local Dev & Testing
- **Local Services**: `docker-compose.yml` orchestrating PostgreSQL, Redis, MinIO, and Mailpit.
- **Commands**: `npm run dev` starts the entire development stack.
- **Testing**:
  - Unit/Integration: Vitest.
  - End-to-End: Playwright.
  - Accessibility: axe-core / Playwright-axe.
  - Performance: Lighthouse CI budgets.
- **CI/CD**: GitHub Actions workflow running typecheck, lint, unit tests, build, and E2E smoke tests.

## API Standards
- Route handlers located under `/api/v1/*`.
- Zod schema validation on every input payload and query param.
- Standard response envelope: `{ data, error, meta }`.
- Unified error codes and HTTP status mapping.
- Rate limiting on public and write endpoints.
- OpenAPI specification auto-generated to `/docs/api.md`.

## Quality Budgets (Non-Negotiable)
- **Public Profile LCP**: < 1.2s on throttled 4G mid-range Android device.
- **Initial JS Bundle**: < 100 KB gzipped for public profile route.
- **Cumulative Layout Shift (CLS)**: ≈ 0.
- **Lighthouse Mobile Score**: ≥ 95.
- **Accessibility**: WCAG 2.2 Level AA compliance (`prefers-reduced-motion` respected, minimum 44px touch targets).
- **NFC Redirect Handler Latency**: < 50ms server-side execution time.

