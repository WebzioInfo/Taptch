---
name: nextjs-api-routes
description: "Master Next.js 15 Route Handlers (route.ts), HTTP method conventions, standardized API envelopes, rate limiting, and edge runtimes."
risk: safe
source: Tappzio-core
date_added: "2026-11-02"
version: "1.0.0"
---

# Next.js 15 Route Handlers & API Architecture Skill

Architectural standard for authoring RESTful API endpoints in Next.js 15 App Router using Route Handlers (`route.ts`).

---

## 1. When to Use This Skill

- Authoring API endpoints under `src/app/api/v1/`.
- Defining HTTP methods (`GET`, `POST`, `PATCH`, `PUT`, `DELETE`).
- Structuring standardized API envelopes (`{ data, error, meta }`).
- Configuring runtime environments (`nodejs` vs `edge`).
- Implementing rate limiting and authentication guards on API routes.

---

## 2. Standardized API Envelope Structure

All Tappzio REST APIs must respond with a consistent JSON envelope defined in `src/lib/api/response.ts`:

```json
{
  "data": { ... },
  "error": null,
  "meta": {
    "totalCount": 10,
    "page": 1,
    "pageSize": 20
  }
}
```

In the event of an error:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid shipping address",
    "details": { ... }
  },
  "meta": null
}
```

---

## 3. Route Handler Implementation Pattern

```ts
// src/app/api/v1/profiles/route.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getActorFromRequest } from '@/lib/auth/session';
import { listProfilesByOwner, createProfile } from '@/modules/profiles';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

const createProfileSchema = z.object({
  displayName: z.string().min(2),
  slug: z.string().min(2),
  templateId: z.string().default('obsidian-luxury'),
});

export async function GET(request: NextRequest) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }

    const profiles = await listProfilesByOwner(actor);
    return apiSuccess(profiles, { totalCount: profiles.length });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }

    const body = await request.json();
    const validated = createProfileSchema.safeParse(body);

    if (!validated.success) {
      return apiError('VALIDATION_ERROR', 'Invalid profile parameters.', 400, validated.error.format());
    }

    const profile = await createProfile(actor, validated.data);
    return apiSuccess(profile, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

## 4. Handling Dynamic Route Parameters (Next.js 15)

In Next.js 15, route parameters in Route Handlers are passed as a **Promise**:

```ts
// src/app/api/v1/profiles/[id]/route.ts
interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  // Use id
}
```

---

## 5. Streaming Responses & Edge Runtimes

For high-throughput endpoints or real-time event streaming:

```ts
export const runtime = 'edge';

export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode('data: chunk 1\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
```

---

## 6. Mandatory Engineering Rules

1. **Thin Route Handlers**: Route handlers must only parse requests, validate with Zod, verify actor session, and call domain services. Never put raw multi-step business transactions or SQL inside route files.
2. **Explicit Status Codes**: Return 200 for OK, 201 for Created, 400 for Validation Error, 401 for Unauthenticated, 403 for Forbidden, 404 for Not Found, 409 for Conflict, 500 for Internal Server Error.
3. **No Uncaught Exceptions**: Always wrap route handler bodies in `try ... catch` and pass errors to `handleApiError(error)`.

