import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

describe('Edge Route Protection Middleware', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('redirects unauthenticated user accessing protected /dashboard to /login', () => {
    const request = new NextRequest('http://localhost:3000/dashboard');
    const response = middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/login?callbackUrl=%2Fdashboard');
  });

  it('redirects unauthenticated user accessing protected /builder/new to /login with encoded callback', () => {
    const request = new NextRequest('http://localhost:3000/builder/new?theme=obsidian');
    const response = middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/login?callbackUrl=%2Fbuilder%2Fnew%3Ftheme%3Dobsidian'
    );
  });

  it('allows authenticated user with better-auth.session_token to access /dashboard', () => {
    const request = new NextRequest('http://localhost:3000/dashboard', {
      headers: {
        cookie: 'better-auth.session_token=valid_test_token_123',
      },
    });
    const response = middleware(request);

    // NextResponse.next() returns a 200 pass-through response
    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('allows authenticated user with __Secure-better-auth.session_token to access /cards', () => {
    const request = new NextRequest('http://localhost:3000/cards', {
      headers: {
        cookie: '__Secure-better-auth.session_token=valid_secure_token_456',
      },
    });
    const response = middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('redirects authenticated user visiting /login back to /dashboard', () => {
    const request = new NextRequest('http://localhost:3000/login', {
      headers: {
        cookie: 'better-auth.session_token=valid_test_token_123',
      },
    });
    const response = middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard');
  });

  it('allows unauthenticated access to public routes like /templates', () => {
    const request = new NextRequest('http://localhost:3000/templates');
    const response = middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('returns 404 for /dev/* routes in production mode', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const request = new NextRequest('http://localhost:3000/dev/gallery');
    const response = middleware(request);

    expect(response.status).toBe(404);
  });
});

