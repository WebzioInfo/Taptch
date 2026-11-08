import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

const TEST_SECRET = 'taptch-development-better-auth-secret-min-32-chars-long';

async function createSignedCookie(token: string, secret: string = TEST_SECRET): Promise<string> {
  const algorithm = { name: 'HMAC', hash: 'SHA-256' };
  const secretBuf = new TextEncoder().encode(secret);
  const key = await crypto.subtle.importKey('raw', secretBuf, algorithm, false, ['sign']);
  const signature = await crypto.subtle.sign(algorithm.name, key, new TextEncoder().encode(token));
  const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${token}.${sigBase64}`;
}

describe('Edge Route Protection Middleware & Cryptographic Session Verification', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('redirects unauthenticated user accessing protected /dashboard to /login', async () => {
    const request = new NextRequest('http://localhost:3000/dashboard');
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/login?callbackUrl=%2Fdashboard');
  });

  it('redirects unauthenticated user accessing protected /builder/new to /login with encoded callback', async () => {
    const request = new NextRequest('http://localhost:3000/builder/new?theme=obsidian');
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/login?callbackUrl=%2Fbuilder%2Fnew%3Ftheme%3Dobsidian'
    );
  });

  it('allows authenticated user with valid test cookie to access /dashboard in test mode', async () => {
    const request = new NextRequest('http://localhost:3000/dashboard', {
      headers: {
        cookie: 'better-auth.session_token=valid_test_token_123',
      },
    });
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('allows authenticated user with cryptographically HMAC-signed session cookie', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const signedCookie = await createSignedCookie('sess_real_user_xyz', TEST_SECRET);
    const request = new NextRequest('http://localhost:3000/cards', {
      headers: {
        cookie: `better-auth.session_token=${encodeURIComponent(signedCookie)}`,
      },
    });
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('rejects forged cookie with invalid signature and redirects to /login', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    // Forged signature
    const forgedCookie = 'sess_fake_user.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
    const request = new NextRequest('http://localhost:3000/dashboard', {
      headers: {
        cookie: `better-auth.session_token=${forgedCookie}`,
      },
    });
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/login?callbackUrl=%2Fdashboard');
  });

  it('rejects unsigned raw token in production and redirects to /login', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const unsignedRawToken = 'raw_unprotected_token_without_signature';
    const request = new NextRequest('http://localhost:3000/dashboard', {
      headers: {
        cookie: `better-auth.session_token=${unsignedRawToken}`,
      },
    });
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/login?callbackUrl=%2Fdashboard');
  });

  it('ignores test bypass header x-test-user-id in production mode', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const request = new NextRequest('http://localhost:3000/dashboard', {
      headers: {
        'x-test-user-id': 'attacker_trying_to_impersonate_admin',
        'x-test-role': 'super_admin',
      },
    });
    const response = await middleware(request);

    // Must be rejected in production despite test header
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/login?callbackUrl=%2Fdashboard');
  });

  it('redirects authenticated user visiting /login back to /dashboard', async () => {
    const request = new NextRequest('http://localhost:3000/login', {
      headers: {
        cookie: 'better-auth.session_token=valid_test_token_123',
      },
    });
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard');
  });

  it('allows unauthenticated access to public routes like /templates', async () => {
    const request = new NextRequest('http://localhost:3000/templates');
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('returns 404 for /dev/* routes in production mode', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const request = new NextRequest('http://localhost:3000/dev/gallery');
    const response = await middleware(request);

    expect(response.status).toBe(404);
  });
});
