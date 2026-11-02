---
name: backend-development
description: Next.js App Router API design, domain service orchestration, Zod schema validation, server-side authorization, error handling, rate limiting, and BullMQ background workers. Activate when implementing API routes, domain services, or backend tasks.
---

# Backend Development Skill

## 1. Modular Domain Organization
- All business logic lives inside `src/modules/<domain>/`.
- Route handlers (`src/app/api/.../route.ts`) are thin transport adapters:
  1. Parse & validate request payload with Zod.
  2. Extract authenticated actor from session.
  3. Verify authorization via `can(actor, action, resource)`.
  4. Call the domain service.
  5. Return standard API envelope via `apiSuccess` or `apiError`.
- Route handlers must NEVER import raw database clients or embed complex queries directly (enforced by `tests/architecture/no-direct-db-in-pages.test.ts`).

## 2. API Contract & Response Envelope
- All REST endpoints must adhere to the standard response shape in `src/lib/api/response.ts`:
  ```ts
  interface ApiEnvelope<T> {
    data: T | null;
    error: {
      code: string;
      message: string;
      details?: unknown;
    } | null;
    meta?: {
      page?: number;
      pageSize?: number;
      totalCount?: number;
      requestId?: string;
    };
  }
  ```
- Validation failures return HTTP 400 with `code: 'VALIDATION_FAILED'`.
- Internal errors return HTTP 500 with generic message `code: 'INTERNAL_ERROR'` while logging full error traces to Pino.

## 3. Server-Side Authorization (`can()`)
- Authorization is strictly enforced in code via `can(actor, action, resource)` from `src/modules/authz`.
- Differentiate between platform `system_role` (`super_admin`, `support_admin`, `user`) and tenant organization roles (`owner`, `admin`, `manager`, `employee`).
- Never rely on frontend UI component hiding for security.

## 4. Background Processing Decoupling
- BullMQ workers run in a persistent standalone Node.js process (`src/worker/index.ts`).
- Web route handlers only push jobs to Redis via `queue.add(...)`.
- Workers execute long-running tasks: analytics batching, bulk CSV imports, PDF generation, and webhook dispatching.

